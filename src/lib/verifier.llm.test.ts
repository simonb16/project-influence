import { describe, it, expect } from "vitest";
import { ArchetypeReport } from "@/types";
import { runVerifier, ToolAuditEntry } from "@/lib/verifier";
import fixtureJson from "./__fixtures__/home-crafters-report.json";

// Live LLM checks (one real Sonnet call per test) — excluded from the default
// suite. Run explicitly with:
//   RUN_LLM_TESTS=1 ANTHROPIC_API_KEY=... npx vitest run src/lib/verifier.llm.test.ts
// This is the brief's third seeded corruption: an unattributed number added
// to prose, which only the paraphrase-tolerant LLM audit can catch.

const enabled = process.env.RUN_LLM_TESTS === "1" && !!process.env.ANTHROPIC_API_KEY;
const fixture = fixtureJson as unknown as ArchetypeReport;

function clone(): ArchetypeReport {
  return JSON.parse(JSON.stringify(fixture));
}

function syntheticAudit(report: ArchetypeReport): ToolAuditEntry[] {
  return (report.dataSignals?.signals ?? []).map((d) => ({
    tool: `search_${d.source}`,
    query: d.subject,
    resultJson: JSON.stringify({ metric: d.metric, finding: d.finding, significance: d.significance }),
  }));
}

describe.skipIf(!enabled)("verifier LLM checks (live)", () => {
  it(
    "catches an unattributed number seeded into a signal body",
    async () => {
      const { runVerifierLLMChecks } = await import("@/lib/agents");
      const corrupted = clone();
      // Seed a fabricated, unattributed stat into a signal body: no tool
      // result and no lens attribution backs "87% of crafters".
      const sig = corrupted.socialSignals![0];
      sig.body = `${sig.body} Fully 87% of crafters follow this pattern, with 412,000 active participants.`;

      const vr = await runVerifier(
        { report: corrupted, toolAudit: syntheticAudit(corrupted) },
        runVerifierLLMChecks
      );
      const numberAudit = vr.checks.find((c) => c.id === "paraphrase-number-audit");
      expect(numberAudit).toBeDefined();
      expect(["warn", "fail"]).toContain(numberAudit!.status);
      expect(numberAudit!.detail.length).toBeGreaterThan(0);
    },
    5 * 60 * 1000
  );

  it(
    "passes the clean fixture's prose (attributed lens numbers are fine)",
    async () => {
      const { runVerifierLLMChecks } = await import("@/lib/agents");
      const vr = await runVerifier({ report: fixture, toolAudit: syntheticAudit(fixture) }, runVerifierLLMChecks);
      const llm = vr.checks.filter((c) =>
        ["paraphrase-number-audit", "basis-honesty", "targetable-groundedness"].includes(c.id)
      );
      expect(llm).toHaveLength(3);
      // The manually-verified report must not FAIL — warns are acceptable
      // (e.g., ambiguity the model flags conservatively).
      for (const c of llm) {
        expect(["pass", "warn"], `${c.id}: ${c.detail}`).toContain(c.status);
      }
    },
    5 * 60 * 1000
  );
});
