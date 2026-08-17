import { describe, it, expect } from "vitest";
import { ArchetypeReport, SocialSignal } from "@/types";
import {
  checkSchemaConformance,
  checkValidatedByIntegrity,
  checkEnrichmentZeroDrift,
  checkSnapshotTraceability,
  checkCoreNameCoherence,
  checkNumberLogAudit,
  extractNumericTokens,
  runVerifier,
  runCodeChecks,
  ToolAuditEntry,
} from "@/lib/verifier";
import fixtureJson from "./__fixtures__/home-crafters-report.json";

// The Aug 11 Home Crafters report — the last manually-verified good report.
// Per the brief's Testing #1: the code checks must produce NO fails on it
// (warns are acceptable when explainable; fails on a verified report = bug).
const fixture = fixtureJson as unknown as ArchetypeReport;

function clone(): ArchetypeReport {
  return JSON.parse(JSON.stringify(fixture));
}

/** Synthetic tool audit whose results contain every number the fixture's
 * dataSignals cite — stands in for the real audit (not stored for old runs). */
function syntheticAudit(report: ArchetypeReport): ToolAuditEntry[] {
  return (report.dataSignals?.signals ?? []).map((d) => ({
    tool: `search_${d.source}`,
    query: d.subject,
    resultJson: JSON.stringify({ metric: d.metric, finding: d.finding, significance: d.significance }),
  }));
}

/** Reconciliation baseline reconstructed from the report itself — by
 * construction zero-drift, since the merge preserves reconciliation fields. */
function reconBaseline(report: ArchetypeReport): { socialSignals: SocialSignal[] } {
  return { socialSignals: JSON.parse(JSON.stringify(report.socialSignals ?? [])) };
}

// ─── Clean fixture: no fails ──────────────────────────────────────────────────

describe("verifier on the last good report (Aug 11 Home Crafters)", () => {
  it("produces no FAILs across all code checks", () => {
    const checks = runCodeChecks({
      report: fixture,
      reconciliation: reconBaseline(fixture),
      toolAudit: syntheticAudit(fixture),
    });
    const fails = checks.filter((c) => c.status === "fail");
    expect(fails, JSON.stringify(fails, null, 2)).toHaveLength(0);
  });

  it("assembles a VerifierReport with counts and summary", async () => {
    const vr = await runVerifier({
      report: fixture,
      reconciliation: reconBaseline(fixture),
      toolAudit: syntheticAudit(fixture),
    });
    expect(vr.totalCount).toBe(6); // code checks only — no LLM runner injected
    expect(vr.passCount).toBeGreaterThan(0);
    expect(vr.passCount).toBeLessThanOrEqual(vr.totalCount);
    expect(vr.summary.length).toBeGreaterThan(0);
    expect(vr.checks.map((c) => c.id)).toContain("schema-conformance");
  });
});

// ─── Seeded errors (the brief's three corruptions + structural extras) ───────

describe("seeded-error detection", () => {
  it("catches a changed validated metric (number no longer in the tool log)", () => {
    const audit = syntheticAudit(fixture); // audit built from the ORIGINAL numbers
    const corrupted = clone();
    // ds2's real metric is "23,509 views on a stash wind-down video"
    const ds = corrupted.dataSignals!.signals.find((d) => d.id === "ds2")!;
    expect(ds.metric).toContain("23,509");
    ds.metric = ds.metric.replace("23,509", "93,509");

    const result = checkNumberLogAudit(corrupted, audit);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("93509");
    expect(result.detail).toContain("ds2");
  });

  it("catches a blanked WHO", () => {
    const corrupted = clone();
    corrupted.socialSignals![2].who = "";

    const result = checkSchemaConformance(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("WHO is empty");
    expect(result.detail).toContain(corrupted.socialSignals![2].id);
  });

  it("catches a dangling validatedBy reference", () => {
    const corrupted = clone();
    const withRef = corrupted.socialSignals!.find((s) => (s.validatedBy ?? []).length > 0)!;
    withRef.validatedBy = ["ds99"];

    const result = checkValidatedByIntegrity(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("ds99");
  });

  it("catches enrichment drift (strength changed post-reconciliation)", () => {
    const baseline = reconBaseline(fixture);
    const corrupted = clone();
    corrupted.socialSignals![0].strength = corrupted.socialSignals![0].strength - 15;

    const result = checkEnrichmentZeroDrift(corrupted, baseline);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("strength drifted");
  });

  it("catches a dropped signal (count drift)", () => {
    const baseline = reconBaseline(fixture);
    const corrupted = clone();
    corrupted.socialSignals = corrupted.socialSignals!.slice(0, -1);

    const result = checkEnrichmentZeroDrift(corrupted, baseline);
    expect(result.status).toBe("fail");
  });

  it("catches a snapshot score that disagrees with its source section", () => {
    const corrupted = clone();
    // trust[0] = "The friend who crafts" @95 — set a score no source carries
    const entry = corrupted.signalsSnapshot!.trust[0];
    entry.score = 41;

    const result = checkSnapshotTraceability(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail.toLowerCase()).toContain("trust");
  });

  it("flags an incoherent coreName (warn, not fail)", () => {
    const corrupted = clone();
    corrupted.influentialCore!.coreName = "Quantum Yak Overlord";

    const result = checkCoreNameCoherence(corrupted);
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("Quantum Yak Overlord");
  });

  it("catches strength out of range", () => {
    const corrupted = clone();
    corrupted.socialSignals![1].strength = 140;

    const result = checkSchemaConformance(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("out of range");
  });
});

// ─── Degradation paths ────────────────────────────────────────────────────────

describe("graceful degradation", () => {
  it("number audit skips (pass) when no tool audit is available", () => {
    const result = checkNumberLogAudit(fixture, undefined);
    expect(result.status).toBe("pass");
    expect(result.detail).toContain("skipped");
  });

  it("zero-drift skips (pass) when no reconciliation baseline is available", () => {
    const result = checkEnrichmentZeroDrift(fixture, undefined);
    expect(result.status).toBe("pass");
    expect(result.detail).toContain("skipped");
  });

  it("an LLM-runner crash degrades to warns, never a thrown error", async () => {
    const vr = await runVerifier(
      { report: fixture, reconciliation: reconBaseline(fixture), toolAudit: syntheticAudit(fixture) },
      async () => {
        throw new Error("model unavailable");
      }
    );
    expect(vr.totalCount).toBe(9);
    const llmChecks = vr.checks.filter((c) =>
      ["paraphrase-number-audit", "basis-honesty", "targetable-groundedness"].includes(c.id)
    );
    expect(llmChecks).toHaveLength(3);
    for (const c of llmChecks) {
      expect(c.status).toBe("warn");
      expect(c.detail).toContain("model unavailable");
    }
  });
});

// ─── Numeric token extraction ─────────────────────────────────────────────────

describe("extractNumericTokens", () => {
  it("extracts multi-digit numbers, decimals, and comma-separated numbers", () => {
    expect(extractNumericTokens("+103% YoY on 23,509 views")).toEqual(["103", "23509"]);
    expect(extractNumericTokens("2.4M subscribers vs 40K")).toEqual(["2.4", "40"]);
  });

  it("skips single digits", () => {
    expect(extractNumericTokens("3x the size, top 5 results")).toEqual([]);
  });

  it("matches decimal shorthand against scaled log values", () => {
    const report = clone();
    report.dataSignals!.signals = [
      {
        id: "dsX",
        source: "reddit",
        signalType: "social",
        subject: "r/knitting",
        metric: "2.4M subscribers",
        finding: "large community",
        significance: "it is big",
        validates: "community size",
      },
    ];
    const audit: ToolAuditEntry[] = [
      { tool: "search_reddit", query: "r/knitting", resultJson: '{"subscribers":2400000}' },
    ];
    expect(checkNumberLogAudit(report, audit).status).toBe("pass");
  });
});
