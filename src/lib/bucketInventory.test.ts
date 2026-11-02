import { describe, expect, it } from "vitest";
import { buildBucketInventory, isInventoryEmpty } from "./bucketInventory";
import { ArchetypeReport } from "@/types";

// Shapes modeled on the Aug 24 espresso report (4a29a06e) — the Part 0
// acceptance case — and its enrichment-outage re-run (42c2fa0f).

const base = {
  findability: {
    searchBehaviors: ["niche zero vs eureka mignon", "gaggia classic pro mod"],
    targetableInterests: [
      "Home espresso / home barista equipment", // purchase-relevant → buy
      "Specialty coffee and single-origin beans", // → consume
    ],
    platformConcentrations: [
      {
        platform: "Home-Barista.com",
        spaces: ["Buying Advice", "Grinders"],
        note: "~38K registered members generate the canonical guidance",
      },
      {
        platform: "Local roasteries and specialty cafés",
        spaces: [],
        note: "dial-in classes and cuppings",
      },
    ],
    affinityAdjacencies: [{ interest: "mechanical keyboards", rationale: "tinkerer overlap" }],
  },
  inMarketBehavior: {
    researchPattern: "months-long",
    comparisonBehavior: "head-to-head pairs",
    decisionTriggers: ["A vetted creator review landing on the shortlisted product"],
    postPurchaseBehavior: "posts the shot log",
  },
  realWorldHabitat: [
    {
      context: "SCA Specialty Coffee Expo",
      influenceType: "validation" as const,
      description: "",
      evidence: "",
      strength: 55,
    },
  ],
} as unknown as ArchetypeReport;

describe("buildBucketInventory", () => {
  const inv = buildBucketInventory(base);

  it("maps searchBehaviors to search", () => {
    expect(inv.search.map((e) => e.label)).toEqual([
      "niche zero vs eureka mignon",
      "gaggia classic pro mod",
    ]);
  });

  it("keeps platformConcentration notes attached (no amputated chips)", () => {
    const hb = inv.consume.find((e) => e.label === "Home-Barista.com");
    expect(hb?.note).toContain("~38K registered members");
    expect(hb?.meta).toContain("Buying Advice");
  });

  it("routes physical platforms to go, digital to consume", () => {
    expect(inv.go.some((e) => e.label.includes("Local roasteries"))).toBe(true);
    expect(inv.consume.some((e) => e.label.includes("Local roasteries"))).toBe(false);
  });

  it("splits targetableInterests: purchase-relevant to buy, rest to consume", () => {
    expect(inv.buy.some((e) => e.label.includes("equipment"))).toBe(true);
    expect(inv.consume.some((e) => e.label.includes("single-origin beans"))).toBe(true);
  });

  it("maps decisionTriggers to buy and realWorldHabitat to go with meta", () => {
    expect(inv.buy.some((e) => e.label.includes("vetted creator review"))).toBe(true);
    const expo = inv.go.find((e) => e.label.includes("SCA"));
    expect(expo?.meta).toBe("validation · 55");
  });

  it("does not map affinityAdjacencies anywhere (no force-fit)", () => {
    const all = Object.values(inv).flat();
    expect(all.some((e) => e.label.includes("mechanical keyboards"))).toBe(false);
  });
});

describe("graceful degradation (enrichment-outage shape, 42c2fa0f)", () => {
  it("renders partial inventory from what exists when findability is missing", () => {
    const degraded = {
      inMarketBehavior: base.inMarketBehavior,
      realWorldHabitat: base.realWorldHabitat,
    } as unknown as ArchetypeReport;
    const inv = buildBucketInventory(degraded);
    expect(inv.search).toEqual([]);
    expect(inv.consume).toEqual([]);
    expect(inv.buy.length).toBeGreaterThan(0);
    expect(inv.go.length).toBeGreaterThan(0);
    expect(isInventoryEmpty(inv)).toBe(false);
  });

  it("reports a fully empty layer when no sources exist", () => {
    const inv = buildBucketInventory({} as unknown as ArchetypeReport);
    expect(isInventoryEmpty(inv)).toBe(true);
  });
});
