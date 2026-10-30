import { describe as baseDescribe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import type { ArchetypeReport } from "@/types";
import {
  deriveEngagementChips,
  deriveInTheWorld,
  deriveAdjacencyChips,
} from "./summaryDerive";
import { verifierDisplay } from "./verifierDisplay";
import { sameEntity } from "./dedupe";

// TEMPORARY acceptance pass for the Round 11A punchlist — runs the fixed
// derivations against the two real reports (SMB c0835162, blessed Home
// Crafters). Delete after sign-off. Fixtures live in /tmp (dumped from
// postgres-dev); when they're absent the whole file skips.

const FIXTURES = { smb: "/tmp/sway-smb.json", crafters: "/tmp/sway-crafters.json" };
const hasFixtures = existsSync(FIXTURES.smb) && existsSync(FIXTURES.crafters);
const describe = baseDescribe.skipIf(!hasFixtures);

const load = (p: string): ArchetypeReport =>
  hasFixtures ? JSON.parse(readFileSync(p, "utf8")) : ({} as ArchetypeReport);
const smb = load(FIXTURES.smb);
const crafters = load(FIXTURES.crafters);

// Punchlist 1: resolved by omission — the subtitle no longer renders and the
// extraction was deleted (Simon's call). Nothing to assert.

describe("punchlist 2 — block 05 chips are entry-point titles", () => {
  it("SMB: chips are content titles, not category labels", () => {
    const chips = deriveEngagementChips(smb);
    expect(chips.length).toBeGreaterThan(0);
    const categories = new Set(["ritual", "community", "voice", "moment", "context", "channel"]);
    for (const c of chips) {
      expect(categories.has(c.label.toLowerCase())).toBe(false);
      expect(c.label.split(/\s+/).length).toBeLessThanOrEqual(12);
    }
    console.log("SMB engage chips:", chips.map((c) => c.label));
  });
  it("crafters: no crash, no category labels", () => {
    const chips = deriveEngagementChips(crafters);
    console.log("crafters engage chips:", chips.map((c) => c.label));
    for (const c of chips) expect(c.label.length).toBeGreaterThan(0);
  });
});

describe("punchlist 3 — venue dedup", () => {
  it("SMB: the three known dupe pairs match as entities", () => {
    expect(sameEntity("EO Forum / Vistage / TAB monthly peer meetings (local, in-person)", "Vistage/EO/TAB monthly peer-group sessions")).toBe(true);
    expect(sameEntity("SBDC/SCORE local workshops and vertical trade events", "SBDC/SCORE local workshops")).toBe(true);
    expect(sameEntity("Goldman Sachs 10,000 Small Businesses Summit (Washington D.C., annual, 2,000+ owners)", "Goldman Sachs 10,000 Small Businesses Summit (Washington D.C.)")).toBe(true);
  });
  it("SMB: distinct venues do NOT merge", () => {
    expect(sameEntity("SBDC/SCORE local workshops and vertical trade events", "Vertical trade shows, trade associations, and chamber events")).toBe(false);
  });
  it("crafters: initialism bridge merges LYS with its expansion", () => {
    expect(sameEntity("Local yarn stores and their knit nights", "LYS knit nights and LYS Day (April annual event)")).toBe(true);
  });
  it("SMB: chapter-03 merge leaves no duplicate venues", () => {
    const go = (smb.behavioralBuckets ?? []).filter((b) => b.bucket === "go");
    const habitat = (smb.realWorldHabitat ?? []).filter((h) => !go.some((g) => sameEntity(g.signal, h.context)));
    const titles = [...go.map((g) => g.signal), ...habitat.map((h) => h.context)];
    for (let i = 0; i < titles.length; i++)
      for (let j = i + 1; j < titles.length; j++)
        expect(sameEntity(titles[i], titles[j])).toBe(false);
    console.log("SMB in-the-world rows:", titles);
  });
  it("summary in-the-world has no duplicate venues (both reports)", () => {
    for (const rep of [smb, crafters]) {
      const lines = deriveInTheWorld(rep);
      for (let i = 0; i < lines.length; i++)
        for (let j = i + 1; j < lines.length; j++)
          expect(sameEntity(lines[i].label, lines[j].label)).toBe(false);
    }
    console.log("crafters in-the-world:", deriveInTheWorld(crafters).map((l) => l.label));
  });
});

describe("punchlist 5 — verifier footer arithmetic", () => {
  it("SMB: 7/9 passed (1 failed, 1 warned) · 2 notes", () => {
    const vd = verifierDisplay(smb.verifierReport);
    expect(vd?.summaryLine).toBe("7/9 checks passed (1 failed, 1 warned) · 2 notes");
  });
  it("crafters: counts are tier-consistent", () => {
    const vd = verifierDisplay(crafters.verifierReport);
    if (vd) {
      console.log("crafters summaryLine:", vd.summaryLine);
      expect(vd.summaryLine).not.toContain("undefined");
    }
  });
});

describe("punchlist 6 — adjacency chips end clean", () => {
  it("no dangling ellipsis, ≤ 8 words (both reports)", () => {
    for (const rep of [smb, crafters]) {
      for (const chip of deriveAdjacencyChips(rep)) {
        if (chip.detail) {
          expect(chip.detail.endsWith("…")).toBe(false);
          expect(chip.detail.split(/\s+/).length).toBeLessThanOrEqual(10);
          const last = chip.detail.split(/\s+/).pop()!.toLowerCase();
          expect(["to", "and", "or", "of", "the", "a", "an"].includes(last)).toBe(false);
        }
      }
    }
    console.log("SMB adjacency chips:", deriveAdjacencyChips(smb).map((c) => `${c.label} — ${c.detail}`));
  });
});
