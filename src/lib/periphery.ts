import {
  Adjacency,
  ArchetypeReport,
  OverlapStrength,
  PeripheryInfluence,
  PeripheryItem,
  PeripherySegment,
} from "@/types";

// Normalizes both the Round 2 Periphery agent output and the legacy
// pre-Round-2 periphery shape into one structure the rings visualization
// renders.

export interface NormalizedAdjacency {
  name: string;
  ring: "inner" | "outer";
  overlapPct: number; // numeric strength for the score bar
  overlapLabel?: string; // qualitative label (new-format data only)
  description?: string;
  evidence: string;
  topInfluences?: PeripheryInfluence[];
}

export type NormalizedPeriphery = Record<PeripherySegment, NormalizedAdjacency[]>;

const STRENGTH_PCT: Record<OverlapStrength, number> = {
  "near-universal": 95,
  strong: 85,
  moderate: 70,
  emerging: 55,
};

const SEGMENTS: PeripherySegment[] = ["mindset", "lifestyle", "interest", "entertainment"];

export function normalizePeriphery(report: ArchetypeReport): NormalizedPeriphery | null {
  // Round 2+: dedicated Periphery agent output
  if (report.peripheryData?.peripheryMap) {
    const normalized: NormalizedPeriphery = { mindset: [], lifestyle: [], interest: [], entertainment: [] };
    const push = (item: PeripheryItem, ring: "inner" | "outer") => {
      const segment = SEGMENTS.includes(item.segment) ? item.segment : "interest";
      normalized[segment].push({
        name: item.name,
        ring,
        overlapPct: STRENGTH_PCT[item.overlapStrength] ?? 60,
        overlapLabel: item.overlapStrength,
        description: item.description,
        evidence: item.evidence,
      });
    };
    report.peripheryData.peripheryMap.innerRing?.forEach((i) => push(i, "inner"));
    report.peripheryData.peripheryMap.outerRing?.forEach((i) => push(i, "outer"));
    return normalized;
  }

  // Legacy saved reports (pre-Round 2 pipeline)
  if (report.periphery) {
    const mapAdj = (a: Adjacency): NormalizedAdjacency => ({
      name: a.name,
      ring: a.ring,
      overlapPct: a.overlapStrength,
      evidence: a.evidence,
      topInfluences: a.topInfluences,
    });
    return {
      mindset: (report.periphery.mindset ?? []).map(mapAdj),
      lifestyle: (report.periphery.lifestyle ?? []).map(mapAdj),
      interest: (report.periphery.interest ?? []).map(mapAdj),
      entertainment: (report.periphery.entertainment ?? []).map(mapAdj),
    };
  }

  return null;
}
