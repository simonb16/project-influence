import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import {
  AgentInputs,
  buildAudienceLensPrompt,
  buildBrandLensPrompt,
  buildContextLensPrompt,
  buildPeripheryPrompt,
  buildReconciliationPrompt,
  buildSynthesisPrompt,
} from "@/lib/prompt";
import { ArchetypeReport, DataSignalsSynthesis, PeripheryData } from "@/types";
import { getAvailableTools, executeDataTool, MAX_TOOL_CALLS, DataToolSchema } from "@/lib/data-tools";

export type { AgentInputs };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LOG_FILE = path.join(process.cwd(), "agent.log");

function log(message: string) {
  const line = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

// ─── Models & batching ────────────────────────────────────────────────────────
// Batch 1: three lens agents in parallel (Sonnet 4.6 + web search, 15 each)
// Batch 2: reconciliation, solo (Fable 5, analysis only — no tools)
// Batch 3: synthesis (Fable 5, no tools) — runs parallel with Batch 4
// Batch 4: periphery (Sonnet 4.6 + web search, 25) — runs parallel with Batch 3

const LENS_MODEL = "claude-sonnet-4-6";
const REASONING_MODEL = "claude-fable-5";
const FALLBACK_MODEL = "claude-opus-4-8";

export const AGENT_BATCHES: string[][] = [
  ["audience-lens", "brand-lens", "context-lens"],
  ["reconciliation"],
  ["synthesis"],
  ["periphery"], // depends on reconciliation only — fires alongside synthesis
];

// All search agents run 15 searches for now — bump PERIPHERY_SEARCH_TOOL back up
// once the pause/resume path is proven if deeper periphery research is wanted.
const LENS_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 15,
};

const PERIPHERY_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 15,
};

// The SDK's streaming timeout is per-chunk, not wall-clock — a wedged stream
// can hang forever. Enforce a hard deadline per attempt and retry once.
// 15-search lenses have been observed taking up to ~14 minutes; 20 gives margin
// while still catching genuine hangs. Periphery's 25 searches share the same
// ceiling — it starts from reconciled seeds, so its searches are more targeted.
const LENS_TIMEOUT_MS = 20 * 60 * 1000;
const REASONING_TIMEOUT_MS = 20 * 60 * 1000;
const MAX_ATTEMPTS = 2;

// The API's server-side web-search loop pauses (`stop_reason: "pause_turn"`)
// after ~10 internal iterations; with 25 searches a lens can pause several
// times before finishing. Cap the resume loop as a runaway backstop.
const MAX_CONTINUATIONS = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) s = s.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
  if (!s.startsWith("{")) {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  }
  return s;
}

function textFromContent(content: Array<{ type: string }>): string {
  return content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Run an agent attempt with a hard wall-clock deadline, retrying once on
 * timeout, API error, or malformed JSON. Each attempt gets a fresh connection.
 */
async function withDeadline<T>(
  label: string,
  timeoutMs: number,
  attempt: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await attempt(controller.signal);
    } catch (err) {
      lastError = controller.signal.aborted
        ? new Error(`${label} timed out after ${Math.round(timeoutMs / 60000)} minutes`)
        : err;
      const reason = lastError instanceof Error ? lastError.message : String(lastError);
      log(`${label} — attempt ${i}/${MAX_ATTEMPTS} failed: ${reason}${i < MAX_ATTEMPTS ? " — retrying" : ""}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed: ${String(lastError)}`);
}

/**
 * Search agents (lenses, periphery): Sonnet 4.6 with web search (max 25 searches).
 * The server-side search loop can pause mid-task (`stop_reason: "pause_turn"`);
 * re-send the conversation so the API resumes where it left off, and collect
 * text across all turns since the JSON can span the pause boundary.
 */
async function runLensAgent<T>(
  prompt: string,
  signal: AbortSignal,
  searchTool: typeof LENS_SEARCH_TOOL = LENS_SEARCH_TOOL,
  maxTokens = 32000
): Promise<T> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
  let text = "";
  // The 20260209 web-search tool filters results via server-side code execution.
  // Resuming after pause_turn must reuse that container or the API 400s.
  let containerId: string | undefined;

  for (let turn = 0; turn < MAX_CONTINUATIONS; turn++) {
    const stream = client.messages.stream(
      {
        model: LENS_MODEL,
        max_tokens: maxTokens,
        tools: [searchTool],
        messages,
        ...(containerId ? { container: containerId } : {}),
      },
      { signal }
    );
    const message = await stream.finalMessage();
    text += textFromContent(message.content);

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      containerId = message.container?.id ?? containerId;
      continue;
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error(`output truncated at max_tokens (${maxTokens}) — JSON incomplete`);
    }
    return JSON.parse(extractJSON(text)) as T;
  }
  throw new Error(`search loop did not finish within ${MAX_CONTINUATIONS} continuations`);
}

/**
 * Reasoning agents (reconciliation, synthesis): Fable 5.
 * Fable API rules: thinking is always on (no `thinking` param), no sampling params,
 * and safety classifiers can decline with stop_reason "refusal" — so we opt into a
 * server-side fallback to Opus 4.8 and still guard the stop_reason.
 */
async function runReasoningAgent<T>(prompt: string, signal: AbortSignal, maxTokens = 32000): Promise<T> {
  const { result } = await runReasoningToolLoop<T>(prompt, signal, [], undefined, maxTokens);
  return result;
}

/**
 * Round 5: Fable 5 with client-side data tools (reconciliation only).
 * Runs the tool-use loop: the model requests platform lookups, we execute them
 * against the wrappers in data-tools.ts, and feed results back until it writes
 * its final analysis. The MAX_TOOL_CALLS cap is enforced here in code — the
 * model can request more, but every request past the cap gets a budget-exhausted
 * result instead of data. Batched tool calls in one turn are all executed and
 * each counts against the budget.
 */
async function runReasoningToolLoop<T>(
  prompt: string,
  signal: AbortSignal,
  tools: DataToolSchema[],
  onToolCall?: (message: string) => void,
  maxTokens = 32000
): Promise<{ result: T; toolCallsUsed: number }> {
  const messages: Array<{ role: "user" | "assistant"; content: unknown }> = [
    { role: "user", content: prompt },
  ];
  let toolCallCount = 0;
  // Each iteration is one model turn; a turn can batch several tool calls.
  // Budget-exhausted turns terminate quickly, so cap iterations generously.
  const maxTurns = MAX_TOOL_CALLS + 4;

  for (let turn = 0; turn < maxTurns; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: REASONING_MODEL,
        max_tokens: maxTokens,
        betas: ["server-side-fallback-2026-06-01"],
        // `fallbacks` postdates SDK 0.78.0's types; the SDK forwards it to the API as-is.
        fallbacks: [{ model: FALLBACK_MODEL }],
        ...(tools.length > 0 ? { tools } : {}),
        messages,
      } as unknown as Parameters<typeof client.beta.messages.stream>[0],
      { signal }
    );
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new Error("The reasoning model declined this request (stop_reason: refusal), including after fallback.");
    }

    if (message.stop_reason === "tool_use") {
      // Echo the full assistant content back (thinking blocks included — Fable
      // requires them unmodified on the same model).
      messages.push({ role: "assistant", content: message.content });

      const toolUses = message.content.filter(
        (b): b is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
          b.type === "tool_use"
      );
      const results: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];

      for (const tu of toolUses) {
        if (toolCallCount >= MAX_TOOL_CALLS) {
          log(`Tool budget exhausted — declined ${tu.name}("${String(tu.input?.query ?? "")}") request`);
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: "TOOL BUDGET EXHAUSTED. Write your final reconciled analysis now with the data you have.",
          });
          continue;
        }
        toolCallCount++;
        const queryLabel = String(tu.input?.query ?? "");
        onToolCall?.(`Checking ${tu.name.replace("search_", "")}: "${queryLabel}" (${toolCallCount}/${MAX_TOOL_CALLS})`);
        const result = await executeDataTool(tu.name, tu.input ?? {});
        const resultJson = JSON.stringify(result);
        // Log the full-ish result so cited numbers can be audited against reality
        log(`Tool call ${toolCallCount}/${MAX_TOOL_CALLS} — ${tu.name}("${queryLabel}") → ${resultJson.slice(0, 1500)}`);
        results.push({ type: "tool_result", tool_use_id: tu.id, content: resultJson });
      }

      messages.push({ role: "user", content: results });
      continue;
    }

    // end_turn (or max_tokens, which extractJSON/parse will surface as an error)
    return {
      result: JSON.parse(extractJSON(textFromContent(message.content))) as T,
      toolCallsUsed: toolCallCount,
    };
  }
  throw new Error(`tool-use loop did not finish within ${maxTurns} turns`);
}

// ─── Batch 1: Lens agents ────────────────────────────────────────────────────
// Lens outputs are consumed by the reconciliation agent as JSON — typed loosely
// on purpose; the reconciliation prompt defines the contract.

export interface LensResult {
  lens: "audience" | "brand" | "context";
  [key: string]: unknown;
}

export async function runAudienceLens(inputs: AgentInputs): Promise<LensResult> {
  log(`Audience Lens — started (audience: ${inputs.audience.slice(0, 60)}…)`);
  const result = await withDeadline("Audience Lens", LENS_TIMEOUT_MS, (signal) =>
    runLensAgent<LensResult>(buildAudienceLensPrompt(inputs), signal)
  );
  log(`Audience Lens — complete`);
  return result;
}

export async function runBrandLens(inputs: AgentInputs): Promise<LensResult> {
  log(`Brand Lens — started${inputs.brand ? "" : " (no brand — category-level analysis)"}`);
  const result = await withDeadline("Brand Lens", LENS_TIMEOUT_MS, (signal) =>
    runLensAgent<LensResult>(buildBrandLensPrompt(inputs), signal)
  );
  log(`Brand Lens — complete`);
  return result;
}

export async function runContextLens(inputs: AgentInputs): Promise<LensResult> {
  log(`Context Lens — started${inputs.context ? "" : " (no context — broad scan)"}`);
  const result = await withDeadline("Context Lens", LENS_TIMEOUT_MS, (signal) =>
    runLensAgent<LensResult>(buildContextLensPrompt(inputs), signal)
  );
  log(`Context Lens — complete`);
  return result;
}

export interface AllLensOutputs {
  audience: LensResult;
  brand: LensResult;
  context: LensResult;
}

// ─── Batch 2: Reconciliation & scoring ───────────────────────────────────────

export interface ReconciledSignal {
  signal: string;
  type: string;
  convergenceStatus: "converged" | "conflicted" | "single-lens";
  lensesFound: string[];
  conflictNotes?: string | null;
  scores: {
    credibility: number;
    copyability: number;
    participationQuality: number;
    transmissionPower: number;
    bridgePotential: number;
    desireCreation: number;
    composite: number;
  };
  scoreRationale?: string;
  confidence: "high" | "medium" | "directional" | "flagged";
  evidence?: string;
  sourceUrls?: string[];
  [key: string]: unknown;
}

export interface ReconciliationResult {
  reconciledSignals: ReconciledSignal[];
  influentialCore?: {
    definition: string;
    convergenceNotes?: string;
    conflictNotes?: string;
  };
  keyConvergences?: string[];
  keyConflicts?: string[];
  keyGaps?: string[];
  dataSignals?: DataSignalsSynthesis; // Round 5 — present only when tools ran usefully
}

// Tool turns add wall-clock time (up to 8 API calls + extra inference turns),
// so reconciliation gets a longer deadline than the single-shot agents.
const RECONCILIATION_TIMEOUT_MS = 25 * 60 * 1000;

export async function runReconciliationAgent(
  inputs: AgentInputs,
  lenses: AllLensOutputs,
  onProgress?: (message: string) => void
): Promise<ReconciliationResult> {
  const tools = getAvailableTools();
  log(`Reconciliation agent — started (${tools.length} data tools: ${tools.map((t) => t.name).join(", ") || "none"})`);
  const { result, toolCallsUsed } = await withDeadline(
    "Reconciliation agent",
    RECONCILIATION_TIMEOUT_MS,
    (signal) =>
      runReasoningToolLoop<ReconciliationResult>(
        buildReconciliationPrompt(
          inputs,
          JSON.stringify(lenses.audience, null, 2),
          JSON.stringify(lenses.brand, null, 2),
          JSON.stringify(lenses.context, null, 2),
          tools.map((t) => t.name)
        ),
        signal,
        tools,
        onProgress
      )
  );
  log(
    `Reconciliation agent — complete (${result.reconciledSignals?.length ?? 0} signals scored, ${toolCallsUsed}/${MAX_TOOL_CALLS} platform lookups)`
  );
  onProgress?.(`Reconciliation complete — used ${toolCallsUsed}/${MAX_TOOL_CALLS} platform lookups`);
  return result;
}

// ─── Batch 3: Synthesis ──────────────────────────────────────────────────────
// The synthesis agent emits the report body; the route fills in archetype,
// query, and generatedAt.

export type SynthesisResult = Omit<
  ArchetypeReport,
  "archetype" | "query" | "audience" | "brand" | "context" | "generatedAt" | "peripheryData"
>;

export async function runSynthesisAgent(
  inputs: AgentInputs,
  reconciliation: ReconciliationResult
): Promise<SynthesisResult> {
  log(`Synthesis agent — started`);
  // Round 4 added six structured sections to the synthesis output — give it
  // extra output headroom so the report JSON can't truncate.
  const result = await withDeadline("Synthesis agent", REASONING_TIMEOUT_MS, (signal) =>
    runReasoningAgent<SynthesisResult>(
      buildSynthesisPrompt(inputs, JSON.stringify(reconciliation, null, 2)),
      signal,
      48000
    )
  );
  log(`Synthesis agent — complete`);
  return result;
}

// ─── Batch 4: Periphery (parallel with Synthesis) ────────────────────────────
// Maps adjacent audiences/interests for the ENTIRE audience using the
// reconciled lens data as search seeds. Sonnet 4.6 + web search (25).

export async function runPeripheryAgent(
  inputs: AgentInputs,
  reconciliation: ReconciliationResult
): Promise<PeripheryData> {
  log(`Periphery agent — started`);
  const result = await withDeadline("Periphery agent", LENS_TIMEOUT_MS, (signal) =>
    runLensAgent<PeripheryData>(
      buildPeripheryPrompt(inputs, JSON.stringify(reconciliation, null, 2)),
      signal,
      PERIPHERY_SEARCH_TOOL
    )
  );
  log(
    `Periphery agent — complete (${result.peripheryMap?.innerRing?.length ?? 0} inner, ${result.peripheryMap?.outerRing?.length ?? 0} outer)`
  );
  return result;
}
