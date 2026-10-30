import { describe, it, expect } from "vitest";
import { ArchetypeReport, MediaPlan } from "@/types";
import { checkPlanTraceability, checkNoInventedReach, ToolAuditEntry } from "@/lib/verifier";
import fixtureJson from "./__fixtures__/home-crafters-report.json";

// Round 11B Part 6: the two plan checks, exercised per the brief's Testing #5 —
// a seeded dangling sourceSignalId and an invented reach figure must both FAIL
// by name; an honest plan passes; pre-11B reports (no plan) skip cleanly.

const fixture = fixtureJson as unknown as ArchetypeReport;

function clone(): ArchetypeReport {
  return JSON.parse(JSON.stringify(fixture));
}

/** An honest plan built strictly from the fixture's own signals. */
function honestPlan(report: ArchetypeReport): MediaPlan {
  const sig = (report.socialSignals ?? [])[0];
  const bucket = (report.behavioralBuckets ?? [])[0];
  const sourceIds = [sig?.id, bucket?.id].filter(Boolean) as string[];
  return {
    soWhat: "This plan reaches the core where its trust actually forms, not where impressions are cheapest.",
    splitHypothesis: {
      coreSharePct: { low: 10, high: 25 },
      rationale: "The core's habitats are cheap to saturate relative to broad placements — the split follows channel economics.",
      status: "hypothesis",
    },
    lines: [
      {
        id: "line1",
        channel: `Placements around "${sig?.signal ?? "the strongest signal"}"`,
        role: "core-seed",
        targetingStack: sig?.targetableSignals?.[0]?.detail ?? sig?.signal ?? "signal-derived targeting",
        rationale: "Derived directly from the report's strongest distinctive signal.",
        sourceSignalIds: sourceIds,
        reachBasis: "unestimated",
      },
    ],
    sequencing: ["Win the core first", "Extend to reach placements once core engagement is observed"],
    messagingInputs: ["From the report's drivers: belonging over hype"],
    measurementSignals: ["core-seed: engagement quality and community echo; utm_campaign=core-seed-line1"],
  };
}

const NO_AUDIT: ToolAuditEntry[] = [];

describe("plan-traceability", () => {
  it("skips (pass) on a pre-11B report with no plan", () => {
    const r = clone();
    delete r.plan;
    const c = checkPlanTraceability(r);
    expect(c.status).toBe("pass");
    expect(c.detail).toContain("no plan");
  });

  it("passes an honest plan whose lines cite real signals", () => {
    const r = clone();
    r.plan = honestPlan(r);
    const c = checkPlanTraceability(r);
    expect(c.status, c.detail).toBe("pass");
  });

  it("FAILs by name on a seeded dangling sourceSignalId", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.lines[0].sourceSignalIds = ["sig999-does-not-exist"];
    const c = checkPlanTraceability(r);
    expect(c.status).toBe("fail");
    expect(c.detail).toContain("sig999-does-not-exist");
    expect(c.detail).toContain("line1");
  });

  it("FAILs on an empty sourceSignalIds array (the contract)", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.lines[0].sourceSignalIds = [];
    const c = checkPlanTraceability(r);
    expect(c.status).toBe("fail");
    expect(c.detail).toContain("empty sourceSignalIds");
  });

  it("warns (not fails) when channel/targeting shares no token with its sources", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.lines[0].channel = "Zeppelin hull wraps";
    r.plan.lines[0].targetingStack = "blimp enthusiasts quarterly";
    const c = checkPlanTraceability(r);
    expect(c.status).toBe("warn");
    expect(c.detail).toContain("no channel/targeting token");
  });
});

describe("no-invented-reach", () => {
  it("skips (pass) on a pre-11B report with no plan", () => {
    const r = clone();
    delete r.plan;
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status).toBe("pass");
    expect(c.detail).toContain("no plan");
  });

  it("passes an honest plan with no reach figures", () => {
    const r = clone();
    r.plan = honestPlan(r);
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status, c.detail).toBe("pass");
  });

  it("FAILs by name on an invented reach figure in a line rationale", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.lines[0].rationale = "A 40K-subscriber newsletter the core actually reads.";
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status).toBe("fail");
    expect(c.detail).toContain("40");
    expect(c.detail).toContain("line1");
  });

  it("FAILs on a bare large figure in the targeting stack", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.lines[0].targetingStack = "lookalike seed of 250000 newsletter readers";
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status).toBe("fail");
    expect(c.detail).toContain("250000");
  });

  it("allows a figure already carried in the report body (attribution policed elsewhere)", () => {
    const r = clone();
    r.plan = honestPlan(r);
    const carried = (JSON.stringify(r.socialSignals ?? []).match(/\d[\d,]*/g) ?? [])
      .map((t) => t.replace(/,/g, ""))
      .find((t) => Number(t) >= 1000);
    if (!carried) return; // fixture carries no large figure — nothing to assert
    r.plan.lines[0].rationale = `Grounded in the ${carried}-member community the report already evidences.`;
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status, c.detail).toBe("pass");
  });

  it("exempts the split band and dollar costs (not audience sizes)", () => {
    const r = clone();
    r.plan = honestPlan(r);
    r.plan.splitHypothesis.rationale = "Start at 15–20% to core: a $50 sponsorship saturates a room broad spend can't enter.";
    const c = checkNoInventedReach(r, NO_AUDIT);
    expect(c.status, c.detail).toBe("pass");
  });
});
