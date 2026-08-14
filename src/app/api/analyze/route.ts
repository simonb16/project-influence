import { AgentInputs } from "@/lib/agents";
import { ensureDb, isAtConcurrencyLimit, createRun } from "@/lib/db";
import { executeRun, deriveTitle } from "@/lib/pipeline";

// Kicks off a run and returns immediately — the pipeline itself runs
// detached (fired here, not awaited) and keeps going after this response is
// sent. That only works because Railway runs a persistent Node process; on
// a serverless/edge platform the function would be torn down as soon as the
// response went out and the un-awaited work would die with it.
export async function POST(request: Request) {
  const body = await request.json();
  const audience: string | undefined = body.audience;
  const brand: string | undefined = body.brand || undefined;
  const context: string | undefined = body.context || undefined;
  const email: string | undefined = body.email || undefined;

  if (!audience?.trim()) {
    return new Response(JSON.stringify({ error: "Missing audience description" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await ensureDb();
  } catch {
    // One delivery mechanism, not two — no falling back to the old SSE path.
    return new Response(JSON.stringify({ error: "Database unavailable — try again shortly" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (await isAtConcurrencyLimit()) {
    return new Response(
      JSON.stringify({ error: "Three reports are already running — give one a moment to finish and try again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const inputs: AgentInputs = { audience: audience.trim(), brand, context };
  const runId = crypto.randomUUID();
  const title = deriveTitle(inputs.audience);
  const runBy = email?.trim() || null;

  await createRun(runId, title, inputs.audience, runBy);

  // Fire and forget — intentionally not awaited.
  executeRun(runId, title, inputs, runBy).catch((err) => {
    console.error(`[analyze] executeRun threw unexpectedly for run ${runId}:`, err);
  });

  return new Response(JSON.stringify({ runId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
