import { ArchetypeReport, CoreVsBaseNote, SocialSignal } from "@/types";
import { buildBucketInventory } from "@/lib/bucketInventory";
import { selectFeaturedSignals } from "./featured";

// Round 11A Part 3: the Summary page derivations. Everything here is
// deterministic template assembly over report_json — same JSON, same Summary.
// No LLM calls, no synthesized sentences: every string below is either a
// field value, a sentence extracted from one, or a fixed template joining
// field values. When a derivation's inputs are absent the block degrades
// (omits) rather than inventing content.

// ── Header ──────────────────────────────────────────────────────────────────

/** Audience tagline: the first sentence of the Story (its first beat names the
 * core↔base relationship — the closest existing field to a one-line read). */
export function deriveTagline(report: ArchetypeReport): string | null {
  const first = (report.summary ?? "").split(/(?<=[.!?])\s+/)[0]?.trim();
  return first && first.length > 20 ? first : null;
}

const ABSOLUTE_SIZE_RE = /(~?\d+(?:\.\d+)?)\s*(M|K|million|billion)\b/i;
const PERCENT_RANGE_RE = /(\d+(?:\s*[–\-−]\s*\d+)?)\s*%/;

/** Est. reach: an absolute audience-size figure parsed from coreSize
 * (estimate+basis). Null → the stat box renders as an empty slot; we never
 * promote a percentage into an absolute. */
export function deriveEstReach(report: ArchetypeReport): string | null {
  const haystack = `${report.coreSize?.estimate ?? ""} ${report.coreSize?.basis ?? ""}`;
  const m = haystack.match(ABSOLUTE_SIZE_RE);
  if (!m) return null;
  const unit = m[2].toLowerCase() === "million" ? "M" : m[2];
  return `${m[1].startsWith("~") ? "" : "~"}${m[1]}${unit}`;
}

/** Influential core %: the percent range from coreSize.estimate (fallback:
 * the 6a chain — coreSizeEstimate, then narrative parse). */
export function deriveCorePercent(report: ArchetypeReport): string | null {
  const candidates = [
    report.coreSize?.estimate,
    report.influentialCore?.coreSizeEstimate,
    report.influentialCore?.definition,
    report.influentialCore?.profile,
  ];
  for (const c of candidates) {
    const m = c?.match(PERCENT_RANGE_RE);
    if (m) return `${m[1].replace(/\s/g, "")}%`;
  }
  return null;
}

// ── 01 block ────────────────────────────────────────────────────────────────

interface ScoredContrast {
  note: CoreVsBaseNote;
  score: number;
}

/** All coreVsBase contrasts in the report, each with its parent item's score
 * so "strongest" is well-defined. */
export function collectContrasts(report: ArchetypeReport): ScoredContrast[] {
  const out: ScoredContrast[] = [];
  for (const i of report.influenceMap ?? []) {
    if (i.coreVsBase) out.push({ note: i.coreVsBase, score: i.intensityScore ?? 0 });
  }
  for (const d of report.emotionalDrivers ?? []) {
    if (d.coreVsBase) out.push({ note: d.coreVsBase, score: d.score ?? 0 });
  }
  for (const b of report.behavioralSignals ?? []) {
    if (b.coreVsBase) out.push({ note: b.coreVsBase, score: b.intensity === "high" ? 80 : b.intensity === "medium" ? 60 : 40 });
  }
  if (report.inMarketBehavior?.coreVsBase) out.push({ note: report.inMarketBehavior.coreVsBase, score: 70 });
  return out.sort((a, b) => b.score - a.score);
}

/** Base summary: template-assembled from the top coreVsBase base sides —
 * the lenses' own words about the broader audience, joined, not rewritten. */
export function deriveBaseSummary(report: ArchetypeReport): string | null {
  const bases = collectContrasts(report)
    .map((c) => c.note.base.trim().replace(/\.$/, ""))
    .filter(Boolean)
    .slice(0, 3);
  if (bases.length === 0) return null;
  return bases.join(". ") + ".";
}

export function strongestContrast(report: ArchetypeReport): CoreVsBaseNote | null {
  return collectContrasts(report)[0]?.note ?? null;
}

// ── 02 block: signal chips ──────────────────────────────────────────────────

export interface SummaryChip {
  label: string;
  detail?: string;
  core: boolean; // iris border — distinctive / high-strength analyzed signal
}

/** Core chips: top high-strength bucket signals from Search/Consume/Buy (in
 * that bucket order, array order within). Reach chips: the broad inventory —
 * interest targeting (first 3 targetableInterests) then the first platform
 * concentrations. Capped at ~6 total per the mockup. */
export function deriveSignalChips(report: ArchetypeReport): SummaryChip[] {
  const chips: SummaryChip[] = [];
  const buckets = report.behavioralBuckets ?? [];
  for (const bucket of ["search", "consume", "buy"] as const) {
    const top = buckets.find((b) => b.bucket === bucket && b.strength === "high");
    if (top && chips.length < 3) chips.push({ label: top.signal, core: true });
  }
  const f = report.findability;
  if (f?.targetableInterests?.length) {
    chips.push({ label: "Interest targeting:", detail: f.targetableInterests.slice(0, 3).join(" · "), core: false });
  }
  for (const pc of f?.platformConcentrations ?? []) {
    if (chips.length >= 6) break;
    chips.push({ label: pc.platform, core: false });
  }
  return chips.slice(0, 6);
}

// ── 03 / 04 blocks: top-3 cards ─────────────────────────────────────────────

export interface SummaryLine {
  label: string;
  detail?: string;
  hot: boolean; // top item(s) get the accent treatment
}

export function deriveInTheWorld(report: ArchetypeReport): SummaryLine[] {
  const go = (report.behavioralBuckets ?? [])
    .filter((b) => b.bucket === "go")
    .map((b) => ({ label: b.signal, detail: b.whatItSignals, score: b.strength === "high" ? 80 : 60 }));
  const habitat = (report.realWorldHabitat ?? []).map((h) => ({
    label: h.context,
    detail: h.description,
    score: h.strength,
  }));
  return [...go, ...habitat]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x, i) => ({ label: x.label, detail: x.detail, hot: i === 0 }));
}

export function deriveOnline(report: ArchetypeReport): SummaryLine[] {
  return (report.socialSignals ?? [])
    .filter((s) => s.type !== "physical")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map((s, i) => ({ label: s.signal, detail: undefined, hot: i === 0 }));
}

export function deriveWhatWorks(report: ArchetypeReport): SummaryLine[] {
  return [...(report.emotionalDrivers ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((d, i) => ({
      label: d.emotion.charAt(0).toUpperCase() + d.emotion.slice(1),
      detail: d.mechanism ?? d.evidence,
      hot: i === 0,
    }));
}

export function deriveBackfires(report: ArchetypeReport): SummaryLine[] {
  return [...(report.barriers ?? [])]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3)
    .map((b) => ({ label: b.name, detail: b.description, hot: false }));
}

// ── 05 / 06 blocks: chips ───────────────────────────────────────────────────

export function deriveEngagementChips(report: ArchetypeReport): SummaryChip[] {
  return (report.entryPoints ?? [])
    .slice(0, 5)
    .map((e) => ({ label: e.type, core: false }));
}

/** ~5-word bridge reason: the first clause of the adjacency's description. */
function shortReason(text: string): string {
  const clause = text.split(/[—;.]/)[0].trim();
  const words = clause.split(/\s+/);
  return words.length > 8 ? words.slice(0, 8).join(" ") + "…" : clause;
}

export function deriveAdjacencyChips(report: ArchetypeReport): SummaryChip[] {
  const inner = report.peripheryData?.peripheryMap?.innerRing ?? [];
  const outer = report.peripheryData?.peripheryMap?.outerRing ?? [];
  return [...inner, ...outer]
    .slice(0, 5)
    .map((p) => ({ label: p.name, detail: shortReason(p.description), core: false }));
}

// ── Verdict strip ───────────────────────────────────────────────────────────

/** The strategic lever: the Story's fourth beat, which the Round 8b floor
 * anchors with "The lever is…". Extracted verbatim from that marker to the
 * end of the summary (it is specified as the close). Absent marker → null →
 * the strip is omitted entirely; the view layer never writes its own. */
export function extractLever(report: ArchetypeReport): string | null {
  const summary = report.summary ?? "";
  const m = summary.match(/\bthe lever\b/i);
  if (!m || m.index === undefined) return null;
  const lever = summary.slice(m.index).trim();
  return lever.length > 20 ? lever : null;
}

// ── Shared with chapters ────────────────────────────────────────────────────

export function distinctiveSignals(report: ArchetypeReport): SocialSignal[] {
  return selectFeaturedSignals(report.socialSignals ?? []).featured;
}

export { buildBucketInventory };
