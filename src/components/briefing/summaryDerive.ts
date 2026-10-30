import { ArchetypeReport, CoreVsBaseNote, SocialSignal } from "@/types";
import { buildBucketInventory } from "@/lib/bucketInventory";
import { selectFeaturedSignals } from "./featured";
import { sameEntity } from "./dedupe";

// Round 11A Part 3: the Summary page derivations. Everything here is
// deterministic template assembly over report_json — same JSON, same Summary.
// No LLM calls, no synthesized sentences: every string below is either a
// field value, a sentence extracted from one, or a fixed template joining
// field values. When a derivation's inputs are absent the block degrades
// (omits) rather than inventing content.

// ── Header ──────────────────────────────────────────────────────────────────

// Punchlist 1 resolution (Simon's call): the hero subtitle is OMITTED — a
// clause extracted from lens material describes the base's behavior, not the
// audience, and a fragment in the hero position is worse than nothing. A
// dedicated audienceTagline synthesis field is planned for the next pipeline
// round; when it lands, render it in SummaryPage's header. Until then there
// is deliberately no derivation here.

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
  // Punchlist 3: Go and habitat often name the same venue — one venue, one line.
  const merged = [...go];
  for (const h of habitat) {
    const dupe = merged.find((m) => sameEntity(m.label, h.label));
    if (dupe) dupe.score = Math.max(dupe.score, h.score);
    else merged.push(h);
  }
  return merged
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

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, directional: 1, flagged: 0 };

/** Clean word-cap (punchlist 6 rules): never a dangling ellipsis, cut-off
 * infinitive/adverb tail, chopped noun phrase, or trailing separator token. */
const DANGLING_TAIL = new Set(["and", "or", "to", "of", "the", "a", "an", "with", "for", "in", "on", "at", "by", "their", "its", "is", "are", "as", "that", "who"]);

function dangles(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  return DANGLING_TAIL.has(w) || /ly$/.test(w);
}

function cleanTrim(text: string, cap: number): string {
  const words = text.split(/\s+/);
  if (words.length <= cap) return text;
  let out = words.slice(0, cap);
  let trimmed = true;
  while (trimmed && out.length > 3) {
    trimmed = false;
    // letterless tokens ("/", "·") and dangling tails never end a phrase
    if (!/[a-z]/i.test(out[out.length - 1]) || dangles(out[out.length - 1]) || out[out.length - 2]?.toLowerCase() === "to") {
      out.pop();
      trimmed = true;
      continue;
    }
    // an article or separator in the cut's last 3 words marks a chopped
    // phrase ("…function as a shared media[ diet]", "…Index / Hampton[ AI]")
    // — back up to before it
    for (let k = out.length - 1; k >= out.length - 3 && k >= 3; k--) {
      if (/^(a|an|the)$/i.test(out[k]) || !/[a-z]/i.test(out[k])) {
        out = out.slice(0, k);
        trimmed = true;
        break;
      }
    }
  }
  return out.join(" ");
}

/** Punchlist 2: the chip is the entry point's short title — the clause of its
 * description before the first em-dash, parenthetical stripped (e.type is a
 * category label, not content). Top items by confidence, array order within;
 * capped at ~12 words with the clean-trim rules. */
export function deriveEngagementChips(report: ArchetypeReport): SummaryChip[] {
  return [...(report.entryPoints ?? [])]
    .sort((a, b) => (CONFIDENCE_RANK[b.confidence ?? "medium"] ?? 2) - (CONFIDENCE_RANK[a.confidence ?? "medium"] ?? 2))
    .map((e) => {
      let title = e.description.split(/\s+—\s+/)[0].replace(/\s*\([^)]*\)/g, "").trim();
      if (title.length > 70) title = title.split(/(?<=[.!?])\s+/)[0].trim();
      return { label: cleanTrim(title, 12), core: false };
    })
    .filter((c) => c.label.length > 0)
    .slice(0, 5);
}

/** ≤ ~8-word bridge reason (punchlist 6): the first clause when it ends
 * cleanly (a couple words of slack beats a chopped phrase), else clean-trimmed. */
function shortReason(text: string): string {
  const commaClause = text.split(/[,—;.]/)[0].trim();
  if (commaClause.split(/\s+/).length <= 8) return commaClause;
  const clause = text.split(/[—;.]/)[0].trim();
  if (clause.split(/\s+/).length <= 10) return clause;
  return cleanTrim(clause, 8);
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
