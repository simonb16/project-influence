import { describe, it, expect } from "vitest";
import { ArchetypeReport, SocialSignal } from "@/types";
import {
  checkSchemaConformance,
  checkValidatedByIntegrity,
  checkEnrichmentZeroDrift,
  checkSnapshotTraceability,
  checkCoreNameCoherence,
  checkNumberLogAudit,
  checkExemplarLeakage,
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
    expect(vr.totalCount).toBe(7); // code checks only — no LLM runner injected
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
    expect(vr.totalCount).toBe(10);
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

// ─── Round 9: behavioral-bucket conformance + evidence audit ─────────────────

function withBuckets(overrides?: Partial<import("@/types").BucketedBehavioralSignal>[]): ArchetypeReport {
  const base = clone();
  base.behavioralBuckets = [
    {
      id: "bb1",
      bucket: "search",
      signal: "Stash-reduction query cluster",
      targetableSignal: "searching 'yarn stash organization' on Google",
      whatItSignals: "The core manages accumulation guilt through planning behavior.",
      reinforcingEvidence: [
        { evidence: "'stash busting' searches +40% (12m)", source: "google_trends tool result" },
        { evidence: "recurring stash-guilt threads", source: "audience lens community evidence" },
      ],
      strength: "high",
    },
    {
      id: "bb2",
      bucket: "go",
      signal: "Local yarn store visits",
      targetableSignal: "Google local search 'yarn store near me'",
      whatItSignals: "The core's purchase decisions form at physical trust nodes.",
      reinforcingEvidence: [{ evidence: "steady 'yarn store near me' intent (-5% YoY, stable)", source: "google_trends tool result" }],
      strength: "high",
    },
    ...(overrides ?? []).map((o, i) => ({
      id: `bbx${i}`,
      bucket: "consume" as const,
      signal: "x",
      targetableSignal: "x",
      whatItSignals: "x",
      reinforcingEvidence: [],
      strength: "medium" as const,
      ...o,
    })),
  ];
  return base;
}

describe("behavioral-bucket schema conformance (Round 9)", () => {
  it("passes well-formed buckets", () => {
    const result = checkSchemaConformance(withBuckets());
    expect(result.status).not.toBe("fail");
    expect(result.detail).toContain("bucket items conform");
  });

  it("fails a blanked whatItSignals", () => {
    const result = checkSchemaConformance(withBuckets([{ whatItSignals: "" }]));
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("whatItSignals is empty");
  });

  it("fails a bare reinforcing-evidence entry (no source)", () => {
    const result = checkSchemaConformance(
      withBuckets([{ reinforcingEvidence: [{ evidence: "searches +80%", source: "" }] }])
    );
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("no source (bare evidence)");
  });

  it("fails an invalid bucket value", () => {
    const result = checkSchemaConformance(
      withBuckets([{ bucket: "platforms" as unknown as import("@/types").BehavioralBucket }])
    );
    expect(result.status).toBe("fail");
    expect(result.detail).toContain('bucket "platforms" invalid');
  });

  it("warns (not fails) when ALL targetables are empty — enrichment down", () => {
    const report = withBuckets();
    for (const b of report.behavioralBuckets!) b.targetableSignal = "";
    const result = checkSchemaConformance(report);
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("enrichment unavailable");
  });

  it("fails a PARTIAL targetable gap", () => {
    const report = withBuckets();
    report.behavioralBuckets![0].targetableSignal = "";
    const result = checkSchemaConformance(report);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("targetableSignal empty on: bb1");
  });
});

describe("reinforcing-evidence number audit (Round 9)", () => {
  const audit: ToolAuditEntry[] = [
    { tool: "search_google_trends", query: "stash busting", resultJson: '{"timeRange":"12m","percentChange":"+40%","trend":"rising"}' },
    { tool: "search_google_trends", query: "yarn store near me", resultJson: '{"timeRange":"12m","percentChange":"-5%","trend":"stable"}' },
  ];

  it("passes tool-sourced evidence whose numbers trace to the log", () => {
    const report = withBuckets();
    report.dataSignals = undefined;
    const result = checkNumberLogAudit(report, audit);
    expect(result.status).toBe("pass");
  });

  it("fails a tool-sourced evidence number found nowhere in the log", () => {
    const report = withBuckets();
    report.dataSignals = undefined;
    report.behavioralBuckets![0].reinforcingEvidence[0] = {
      evidence: "'stash busting' searches +85% (12m)",
      source: "google_trends tool result",
    };
    const result = checkNumberLogAudit(report, audit);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("85");
    expect(result.detail).toContain("reinforcingEvidence");
  });

  it("skips lens-attributed evidence numbers (LLM check's domain)", () => {
    const report = withBuckets();
    report.dataSignals = undefined;
    report.behavioralBuckets![0].reinforcingEvidence = [
      { evidence: "Mintel: 71% of US adults did a craft project", source: "context lens (Mintel)" },
    ];
    const result = checkNumberLogAudit(report, audit);
    expect(result.status).toBe("pass");
  });
});

// ─── Exemplar-leakage drift guard (Round 8b, Part 8) ─────────────────────────

describe("checkExemplarLeakage", () => {
  it("passes clean report content (no exemplar phrases present)", () => {
    const result = checkExemplarLeakage(fixture);
    expect(result.status).toBe("pass");
  });

  it("FAILs a leaked exemplar phrase in a different-audience report", () => {
    const corrupted = clone();
    corrupted.audience = "Millennial natural wine enthusiasts who shop at Trader Joe's";
    corrupted.summary = `${corrupted.summary} Their trust grammar is fixed.`;

    const result = checkExemplarLeakage(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("trust grammar");
  });

  it("WARNs (not fails) a leaked phrase in a same-audience re-run", () => {
    const corrupted = clone(); // audience is still the crafting fixture's own audience
    corrupted.summary = `${corrupted.summary} Their trust grammar is fixed.`;

    const result = checkExemplarLeakage(corrupted);
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("trust grammar");
  });

  it("catches multiple leaked n-grams at once", () => {
    const corrupted = clone();
    corrupted.audience = "Millennial natural wine enthusiasts";
    corrupted.summary = `${corrupted.summary} The knit-night regular's trust grammar is fixed.`;

    const result = checkExemplarLeakage(corrupted);
    expect(result.status).toBe("fail");
    expect(result.detail).toContain("trust grammar");
    expect(result.detail).toContain("knit-night regular");
  });
});

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
