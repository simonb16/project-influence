// ─── Round 8: Verifier — hybrid code + LLM integrity checker ─────────────────
// Design principle: code first, model second. Checks 1-6 are mechanical and
// implemented as pure functions here (deterministic, cheap, unit-testable);
// checks 7-9 need judgment and run as a single Sonnet call injected by the
// caller. The Verifier informs — it never blocks: non-fatal in both
// directions (a crash ships the report without a verifierReport; failed
// checks ship the report WITH the failures visible).
//
// This module deliberately imports only types — no Anthropic client, no fs —
// so the code checks can be unit-tested with plain fixtures.

import {
  ArchetypeReport,
  DataSignal,
  SocialSignal,
  VerifierCheck,
  VerifierReport,
} from "@/types";
// Round 8b: the n-gram list lives next to the exemplars in prompt.ts so the
// two can't drift apart. prompt.ts's own import from this module is
// type-only (erased at compile time), so this does not create a runtime
// circular dependency — verified by the build.
import { EXEMPLAR_NGRAMS } from "@/lib/prompt";

/** One executed tool call, captured in memory by the reconciliation loop.
 * resultJson is the untruncated JSON returned to the model. */
export interface ToolAuditEntry {
  tool: string;
  query: string;
  resultJson: string;
}

/** The slice of reconciliation output the code checks need — kept minimal so
 * tests don't have to build a full ReconciliationResult. */
export interface VerifierReconciliationView {
  socialSignals?: SocialSignal[];
}

export interface VerifierInputs {
  report: ArchetypeReport;
  reconciliation?: VerifierReconciliationView;
  toolAudit?: ToolAuditEntry[];
}

/** Injected by the pipeline; absent in unit tests of the code checks. */
export type LLMCheckRunner = (
  report: ArchetypeReport,
  toolAudit: ToolAuditEntry[]
) => Promise<VerifierCheck[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCALES = ["micro", "niche", "significant", "mainstream"];
const SIGNAL_TYPES = ["content", "digital", "physical"] as const;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const MATCH_STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "or", "who", "as", "in", "on", "for", "with", "to", "at",
]);

/** Light stem: strip a trailing "s" so "podcasts" matches "podcast". */
function stem(token: string): string {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !MATCH_STOPWORDS.has(t))
    .map(stem);
}

/** Loose label matching. Snapshot labels are short distillations of their
 * source items ("The friend who crafts" ← "The friend, sibling, or colleague
 * who crafts"), so exact equality and even substring containment fail
 * spuriously — match on normalized containment OR ≥60% of the label's
 * significant tokens appearing in the source's tokens. */
function labelMatches(label: string, source: string): boolean {
  const nl = normalize(label);
  const ns = normalize(source);
  if (!nl || !ns) return false;
  if (nl.includes(ns) || ns.includes(nl)) return true;

  const labelTokens = significantTokens(label);
  if (labelTokens.length === 0) return false;
  const sourceTokens = new Set(significantTokens(source));
  const hits = labelTokens.filter((t) => sourceTokens.has(t)).length;
  return hits / labelTokens.length >= 0.6;
}

function clip(items: string[], max = 4): string {
  return items.length > max ? `${items.slice(0, max).join("; ")} (+${items.length - max} more)` : items.join("; ");
}

function check(id: string, failures: string[], warns: string[], passDetail: string): VerifierCheck {
  if (failures.length > 0) return { id, status: "fail", detail: clip(failures) };
  if (warns.length > 0) return { id, status: "warn", detail: clip(warns) };
  return { id, status: "pass", detail: passDetail };
}

// ─── Check 1: schema conformance ─────────────────────────────────────────────

export function checkSchemaConformance(report: ArchetypeReport): VerifierCheck {
  const failures: string[] = [];
  const warns: string[] = [];
  const signals = report.socialSignals;

  if (!signals || signals.length === 0) {
    return { id: "schema-conformance", status: "fail", detail: "socialSignals is missing or empty" };
  }

  if (signals.length < 8 || signals.length > 14) {
    warns.push(`socialSignals count ${signals.length} outside 8-14`);
  }
  for (const t of SIGNAL_TYPES) {
    if (!signals.some((s) => s.type === t)) warns.push(`no "${t}" signals present`);
  }
  for (const s of signals) {
    if (!s.where?.trim()) failures.push(`${s.id}: WHERE is empty`);
    if (!s.who?.trim()) failures.push(`${s.id}: WHO is empty`);
    if (typeof s.strength !== "number" || s.strength < 0 || s.strength > 100) {
      failures.push(`${s.id}: strength ${String(s.strength)} out of range`);
    }
    if (!SCALES.includes(s.scale)) failures.push(`${s.id}: scale "${String(s.scale)}" invalid`);
  }

  const snapshot = report.signalsSnapshot;
  if (snapshot) {
    for (const box of ["motivational", "behavioral", "trust", "social"] as const) {
      const n = snapshot[box]?.length ?? 0;
      if (n < 3 || n > 5) warns.push(`snapshot.${box} has ${n} entries (expected 3-5)`);
    }
  }

  // Round 9: behavioral buckets. Reconciliation-owned fields empty → fail;
  // targetableSignal is enrichment-owned, so ALL empty means enrichment was
  // down (graceful degradation → warn), while a PARTIAL gap is a real
  // conformance failure.
  const buckets = report.behavioralBuckets;
  if (buckets && buckets.length > 0) {
    const BUCKETS = ["search", "consume", "buy", "go"];
    for (const b of buckets) {
      if (!BUCKETS.includes(b.bucket)) failures.push(`${b.id}: bucket "${String(b.bucket)}" invalid`);
      if (!b.signal?.trim()) failures.push(`${b.id}: signal is empty`);
      if (!b.whatItSignals?.trim()) failures.push(`${b.id}: whatItSignals is empty`);
      if (!["high", "medium"].includes(b.strength)) failures.push(`${b.id}: strength "${String(b.strength)}" invalid`);
      for (const [i, ev] of (b.reinforcingEvidence ?? []).entries()) {
        if (!ev.source?.trim()) failures.push(`${b.id}: reinforcingEvidence[${i}] has no source (bare evidence)`);
      }
    }
    const emptyTargets = buckets.filter((b) => !b.targetableSignal?.trim());
    if (emptyTargets.length === buckets.length) {
      warns.push("all bucket targetableSignals empty — enrichment unavailable this run");
    } else if (emptyTargets.length > 0) {
      failures.push(`targetableSignal empty on: ${emptyTargets.map((b) => b.id).join(", ")}`);
    }
  }

  return check(
    "schema-conformance",
    failures,
    warns,
    `${signals.length} signals, all types present, WHERE/WHO/strength/scale valid${buckets?.length ? `; ${buckets.length} bucket items conform` : ""}`
  );
}

// ─── Check 2: validatedBy referential integrity ──────────────────────────────
// The ✓ VALIDATED lines in the UI are derived by resolving each validatedBy
// ref against dataSignals (by id, then by subject) and rendering that
// dataSignal's metric + finding — so integrity here means: every ref
// resolves, and the resolved dataSignal actually has the metric/finding the
// line would display.

export function checkValidatedByIntegrity(report: ArchetypeReport): VerifierCheck {
  const failures: string[] = [];
  const signals = report.socialSignals ?? [];
  const dataSignals = report.dataSignals?.signals ?? [];

  const resolve = (ref: string): DataSignal | undefined =>
    dataSignals.find((d) => d.id === ref) ?? dataSignals.find((d) => d.subject === ref);

  let refCount = 0;
  for (const s of signals) {
    for (const ref of s.validatedBy ?? []) {
      refCount++;
      const d = resolve(ref);
      if (!d) {
        failures.push(`${s.id}: validatedBy "${ref}" resolves to no dataSignal`);
      } else if (!d.metric?.trim() || !d.finding?.trim()) {
        failures.push(`${s.id}: validatedBy "${ref}" resolves to a dataSignal with empty metric/finding`);
      }
    }
  }

  if (refCount === 0) {
    return { id: "validatedby-integrity", status: "pass", detail: "no validation links present to check" };
  }
  return check("validatedby-integrity", failures, [], `${refCount} validation links all resolve`);
}

// ─── Check 3: enrichment zero-drift ──────────────────────────────────────────
// The merge guard already enforces this — the Verifier independently confirms
// and reports it. Any drift here means a merge-guard bug.

export function checkEnrichmentZeroDrift(
  report: ArchetypeReport,
  reconciliation?: VerifierReconciliationView
): VerifierCheck {
  const recon = reconciliation?.socialSignals;
  if (!recon || recon.length === 0) {
    return { id: "enrichment-zero-drift", status: "pass", detail: "skipped — no reconciliation baseline available" };
  }
  const final = report.socialSignals ?? [];
  const failures: string[] = [];

  if (final.length !== recon.length) {
    failures.push(`signal count ${final.length} vs reconciliation's ${recon.length}`);
  }
  const finalById = new Map(final.map((s) => [s.id, s]));
  for (const r of recon) {
    const f = finalById.get(r.id);
    if (!f) {
      failures.push(`${r.id} missing from final report`);
      continue;
    }
    const fields: Array<[string, unknown, unknown]> = [
      ["strength", r.strength, f.strength],
      ["scale", r.scale, f.scale],
      ["type", r.type, f.type],
      ["where", r.where, f.where],
      ["who", r.who, f.who],
      ["strengthBasis", r.strengthBasis, f.strengthBasis],
      ["scaleBasis", r.scaleBasis, f.scaleBasis],
    ];
    for (const [name, rv, fv] of fields) {
      if (rv !== fv) failures.push(`${r.id}: ${name} drifted`);
    }
  }

  return check("enrichment-zero-drift", failures, [], `${recon.length} signals unchanged through enrichment merge`);
}

// ─── Check 4: snapshot traceability ──────────────────────────────────────────
// Every snapshot entry must trace to its source section: same label (loose
// match — labels are distillations), same score where both carry one. A label
// with no plausible source item → warn (could be a paraphrase code can't
// match); a matched label whose score disagrees → fail (the prompt requires
// "same name, same score").

export function checkSnapshotTraceability(report: ArchetypeReport): VerifierCheck {
  const snapshot = report.signalsSnapshot;
  if (!snapshot) {
    return { id: "snapshot-traceability", status: "pass", detail: "skipped — report has no snapshot" };
  }
  const failures: string[] = [];
  const warns: string[] = [];

  const trace = (
    box: string,
    entries: Array<{ label: string; score?: number }>,
    sources: Array<{ name: string; score?: number }>
  ) => {
    for (const e of entries ?? []) {
      const matches = sources.filter((s) => labelMatches(e.label, s.name));
      if (matches.length === 0) {
        warns.push(`${box}: "${e.label}" not found in source section`);
        continue;
      }
      // Score verification needs a scored source to compare against — when a
      // label only matches scoreless sources (e.g. highSusceptibility
      // strings), the label trace stands and there is nothing to contradict.
      const scored = matches.filter((m) => typeof m.score === "number");
      if (typeof e.score === "number" && scored.length > 0 && !scored.some((m) => m.score === e.score)) {
        // Short generic source labels ("peer", "creator") can out-match the
        // true multi-word source of a distilled snapshot label. If the exact
        // score exists anywhere in this box's source pool, the score itself
        // traces — that's a label-match miss, not a fabricated number.
        if (sources.some((s) => typeof s.score === "number" && s.score === e.score)) {
          warns.push(
            `${box}: "${e.label}" score ${e.score} traces to a source the label match missed (label-matched: ${scored.map((m) => m.score).join("/")})`
          );
        } else {
          failures.push(`${box}: "${e.label}" score ${e.score} does not match source (${scored.map((m) => m.score).join("/")})`);
        }
      }
    }
  };

  trace(
    "motivational",
    snapshot.motivational ?? [],
    (report.emotionalDrivers ?? []).map((d) => ({ name: d.emotion, score: d.score }))
  );
  trace(
    "behavioral",
    snapshot.behavioral ?? [],
    (report.behavioralSignals ?? []).map((b) => ({ name: b.signal }))
  );
  trace("trust", snapshot.trust ?? [], [
    ...(report.influenceSusceptibility?.channels ?? []).map((c) => ({ name: c.channel, score: c.score })),
    ...(report.influenceSusceptibility?.highSusceptibility ?? []).map((h) => ({ name: h })),
    ...(report.trustedVoices ?? []).map((v) => ({ name: v.voice, score: v.trustWeight })),
  ]);
  trace("social", snapshot.social ?? [], [
    ...(report.influenceMap ?? []).map((i) => ({ name: i.name, score: i.intensityScore })),
    // Platform folded into the habitat name: snapshot labels often carry it
    // ("Peer-scale YouTube knitting podcasts" ← community + platform "YouTube")
    ...(report.digitalHabitat ?? []).map((h) => ({ name: `${h.community} ${h.platform}`, score: h.engagementIntensity })),
    ...(report.realWorldHabitat ?? []).map((r) => ({ name: r.context, score: r.strength })),
    ...(report.socialSignals ?? []).map((s) => ({ name: s.signal, score: s.strength })),
  ]);

  return check("snapshot-traceability", failures, warns, "every snapshot entry traces to its source section");
}

// ─── Check 5: coreName coherence ─────────────────────────────────────────────

const STOPWORDS = new Set(["the", "a", "an", "of", "who", "and", "for", "with", "that"]);

export function checkCoreNameCoherence(report: ArchetypeReport): VerifierCheck {
  const core = report.influentialCore;
  const coreName = core?.coreName;
  if (!coreName?.trim()) {
    return { id: "corename-coherence", status: "warn", detail: "influentialCore.coreName is missing" };
  }

  const haystack = normalize([core?.definition, core?.profile, core?.coreTagline].filter(Boolean).join(" "));
  if (haystack.includes(normalize(coreName))) {
    return { id: "corename-coherence", status: "pass", detail: `coreName "${coreName}" appears in the core description` };
  }

  const nameTokens = normalize(coreName)
    .split(" ")
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  const coreLabel = report.signalsSnapshot?.coreLabel ?? "";
  const labelNorm = normalize(coreLabel);
  const descriptionTokens = new Set(haystack.split(" "));
  const consistent =
    nameTokens.some((t) => labelNorm.includes(t)) || nameTokens.some((t) => descriptionTokens.has(t));

  if (consistent) {
    return { id: "corename-coherence", status: "pass", detail: `coreName "${coreName}" shares terms with the core description/label` };
  }
  return {
    id: "corename-coherence",
    status: "warn",
    detail: `coreName "${coreName}" not found in core description and shares no terms with coreLabel "${coreLabel}"`,
  };
}

// ─── Check 6: exact-number log audit ─────────────────────────────────────────
// Every numeric claim in dataSignals (whose content IS the ✓ VALIDATED lines)
// must appear in what the tools actually returned. Numbers found nowhere in
// the audit log → fail.

/** Extract numeric tokens worth auditing: multi-digit numbers, decimals, and
 * numbers with thousands separators. Single digits are skipped — they appear
 * everywhere and matching them proves nothing. */
export function extractNumericTokens(text: string): string[] {
  const raw = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return raw.map((t) => t.replace(/,/g, "")).filter((t) => t.replace(/\./g, "").length >= 2);
}

/** A token "matches" the log if its digits appear directly, or — for decimal
 * shorthand like 2.4 (as in "2.4M") — a scaled variant (2400, 2400000) does. */
function tokenInLog(token: string, log: string): boolean {
  if (log.includes(token)) return true;
  if (token.includes(".")) {
    const n = Number(token);
    if (!Number.isNaN(n)) {
      for (const mult of [1e3, 1e6, 1e9]) {
        const scaled = n * mult;
        if (Number.isInteger(scaled) && log.includes(String(scaled))) return true;
      }
    }
  }
  return false;
}

/** Derivation markers: text signals that a number is arithmetic OVER tool
 * data (sums, averages, ratios, rounded ranges) rather than a quoted value.
 * The reconciliation prompt explicitly demands such derived comparisons in
 * `significance` ("2.4x the average engagement ratio"), so strict-verbatim
 * matching would flag by-design output on every run. */
const DERIVATION_MARKERS = /~|average|avg\b|combined|implying|roughly|about\s|approx|ratio|x\s+(smaller|larger|above|below|the)|-to-/i;

/** All numbers present in the audit log, for proximity comparison. */
function logNumbers(logText: string): number[] {
  return (logText.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n >= 10);
}

function nearSomeLogNumber(token: string, nums: number[]): boolean {
  const n = Number(token);
  if (Number.isNaN(n) || n === 0) return false;
  // Compare at raw scale and K/M scales (claims often use shorthand units).
  const candidates = [n, n * 1e3, n * 1e6];
  return nums.some((m) => candidates.some((c) => m > 0 && Math.abs(c - m) / m <= 0.15));
}

/** Round 9: reinforcing-evidence entries whose source declares tool or search
 * origin must trace to the tool log like dataSignals do. Lens-attributed
 * entries (named lens source) are the LLM check's domain — a lens number is
 * legitimately absent from the tool log. */
const TOOL_SOURCE_RE = /google[\s_]?trends|youtube|pinterest|reddit\s+(api|tool)|web[\s_]?search|search[-\s]sourced|serpapi|tool\s+(call|result)/i;

export function checkNumberLogAudit(report: ArchetypeReport, toolAudit?: ToolAuditEntry[]): VerifierCheck {
  if (!toolAudit || toolAudit.length === 0) {
    return { id: "number-log-audit", status: "pass", detail: "skipped — no tool audit available for this run" };
  }
  const dataSignals = report.dataSignals?.signals ?? [];
  const toolSourcedEvidence = (report.behavioralBuckets ?? []).flatMap((b) =>
    (b.reinforcingEvidence ?? [])
      .filter((ev) => TOOL_SOURCE_RE.test(ev.source ?? ""))
      .map((ev) => ({ owner: b.id, text: ev.evidence }))
  );
  if (dataSignals.length === 0 && toolSourcedEvidence.length === 0) {
    return { id: "number-log-audit", status: "pass", detail: "no dataSignals to audit" };
  }

  // Comma-normalized haystack: tokens are comma-stripped ("23,509" → "23509"),
  // and tool results quote numbers both raw (23509) and formatted ("23,509").
  const logText = toolAudit.map((e) => `${e.query} ${e.resultJson}`).join("\n").replace(/,/g, "");
  const nums = logNumbers(logText);
  const failures: string[] = [];
  const warns: string[] = [];
  let audited = 0;

  for (const d of dataSignals) {
    for (const [field, text] of [
      ["metric", d.metric],
      ["finding", d.finding],
      ["significance", d.significance],
    ] as const) {
      for (const token of extractNumericTokens(text ?? "")) {
        audited++;
        if (tokenInLog(token, logText)) continue;
        // Unmatched: derived-looking numbers (near a real log number, or
        // carrying derivation markers) downgrade to warn — the LLM
        // paraphrase check adjudicates whether the derivation truly traces.
        // Bare unmatched numbers are the invention signal: fail.
        const derivedLooking =
          nearSomeLogNumber(token, nums) || DERIVATION_MARKERS.test(text ?? "");
        const msg = `${d.id ?? d.subject}: "${token}" (${field}) not found in any tool result`;
        if (derivedLooking) warns.push(`${msg} (looks derived — see paraphrase audit)`);
        else failures.push(msg);
      }
    }
  }

  // Round 9: tool/search-sourced reinforcing evidence gets the same treatment.
  for (const { owner, text } of toolSourcedEvidence) {
    for (const token of extractNumericTokens(text ?? "")) {
      audited++;
      if (tokenInLog(token, logText)) continue;
      const derivedLooking = nearSomeLogNumber(token, nums) || DERIVATION_MARKERS.test(text ?? "");
      const msg = `${owner}: "${token}" (reinforcingEvidence) not found in any tool result`;
      if (derivedLooking) warns.push(`${msg} (looks derived — see paraphrase audit)`);
      else failures.push(msg);
    }
  }

  return check("number-log-audit", failures, warns, `${audited} numeric claims all trace to tool results`);
}

// ─── Check 7 (drift guard): exemplar leakage ─────────────────────────────────
// Round 8b embedded verbatim exemplars in the prompts as structural floors —
// this check catches a model echoing an exemplar's CONTENT instead of its
// structure. A hit in a report about a different audience is a real leak
// (fail). A hit on a same-audience re-run may be legitimate re-discovery of
// the same real-world fact (warn, not fail — visibility still matters).

export function checkExemplarLeakage(report: ArchetypeReport): VerifierCheck {
  const haystack = JSON.stringify(report).toLowerCase();
  const hits = EXEMPLAR_NGRAMS.filter((e) => haystack.includes(e.ngram.toLowerCase()));

  if (hits.length === 0) {
    return { id: "exemplar-leakage", status: "pass", detail: "no in-prompt exemplar phrases found in report content" };
  }

  // Round 10: source keywords are per-ngram — a hit only downgrades to warn
  // when the report's audience matches THAT exemplar's source audience.
  const audience = (report.audience ?? "").toLowerCase();
  const crossAudience = hits.filter((e) => !e.sourceKeywords.some((k) => audience.includes(k)));

  if (crossAudience.length > 0) {
    return {
      id: "exemplar-leakage",
      status: "fail",
      detail: `exemplar phrase(s) leaked into a different-audience report: ${crossAudience.map((e) => e.ngram).join(", ")}`,
    };
  }
  return {
    id: "exemplar-leakage",
    status: "warn",
    detail: `same-audience re-run — possible legitimate re-discovery of: ${hits.map((e) => e.ngram).join(", ")}`,
  };
}

// ─── Round 11B: plan checks ───────────────────────────────────────────────────
// The plan is synthesis-generated and FAIL-graded on two contracts: every line
// traces to existing signals (plan-traceability), and the model never writes
// reach numbers (no-invented-reach). Reports without a plan (pre-11B) skip
// both. The plan's text rides the exemplar-leakage scan automatically (it
// scans the whole report JSON) and is added to the genericity-audit excerpts
// in the verifier prompt.

/** The ids a plan line may cite — exactly the id namespaces synthesis sees. */
function planSourceIds(report: ArchetypeReport): Set<string> {
  return new Set<string>([
    ...(report.socialSignals ?? []).map((s) => s.id),
    ...(report.behavioralBuckets ?? []).map((b) => b.id),
    ...((report.dataSignals?.signals ?? []).map((d) => d.id).filter(Boolean) as string[]),
  ]);
}

/** Everything a cited source actually says, for the string-level sanity pass. */
function planSourceCorpus(report: ArchetypeReport, ids: string[]): string {
  const wanted = new Set(ids);
  const parts: string[] = [];
  for (const s of report.socialSignals ?? []) {
    if (!wanted.has(s.id)) continue;
    parts.push(s.signal, s.where ?? "", s.who ?? "", s.body, s.evidence ?? "");
    for (const t of s.targetableSignals ?? []) parts.push(t.platform, t.detail);
  }
  for (const b of report.behavioralBuckets ?? []) {
    if (!wanted.has(b.id)) continue;
    parts.push(b.signal, b.whatItSignals, b.targetableSignal ?? "");
    for (const ev of b.reinforcingEvidence ?? []) parts.push(ev.evidence, ev.source);
  }
  for (const d of report.dataSignals?.signals ?? []) {
    if (!d.id || !wanted.has(d.id)) continue;
    parts.push(d.subject ?? "", d.metric ?? "", d.finding ?? "");
  }
  return parts.join(" ");
}

export function checkPlanTraceability(report: ArchetypeReport): VerifierCheck {
  const plan = report.plan;
  if (!plan) {
    return { id: "plan-traceability", status: "pass", detail: "skipped — report has no plan (pre-11B)" };
  }
  const valid = planSourceIds(report);
  const failures: string[] = [];
  const warns: string[] = [];
  const lines = plan.lines ?? [];
  if (lines.length === 0) warns.push("plan has zero lines — honest thinness or a synthesis miss; eyeball it");

  for (const line of lines) {
    const label = line.id || line.channel || "(unlabeled line)";
    if (!line.sourceSignalIds || line.sourceSignalIds.length === 0) {
      failures.push(`${label}: empty sourceSignalIds — a line that can't name its sources doesn't exist`);
      continue;
    }
    const dangling = line.sourceSignalIds.filter((id) => !valid.has(id));
    if (dangling.length > 0) {
      failures.push(`${label}: dangling sourceSignalIds [${dangling.join(", ")}]`);
    }
    const resolved = line.sourceSignalIds.filter((id) => valid.has(id));
    if (resolved.length > 0) {
      // String-level sanity, not semantics: at least one significant token of
      // the line's channel/targeting text appears in its cited sources' text.
      const corpusTokens = new Set(significantTokens(planSourceCorpus(report, resolved)));
      const lineTokens = significantTokens(`${line.channel} ${line.targetingStack}`);
      if (!lineTokens.some((t) => corpusTokens.has(t))) {
        warns.push(`${label}: no channel/targeting token appears in its cited sources — check the citation`);
      }
    }
  }
  return check(
    "plan-traceability",
    failures,
    warns,
    `${lines.length} plan line${lines.length === 1 ? "" : "s"} — all sourceSignalIds resolve, channel/targeting consistent with sources`
  );
}

/** Reach-shaped numeric figures in a text: a number wearing a size unit
 * (K/M/million/members/subscribers/…) or any bare figure ≥1000 that isn't a
 * year. Percentages (the split band) and $-amounts (channel economics) are
 * not audience sizes and are exempt. Returns each figure's candidate digit
 * strings — the raw token plus unit-scaled variants ("40" worn with K →
 * "40000") — so "40K" never passes just because "40" appears somewhere. */
function reachLikeFigures(text: string): Array<{ display: string; candidates: string[] }> {
  const out: Array<{ display: string; candidates: string[] }> = [];
  const re = /\d[\d,]*(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const tok = m[0].replace(/,/g, "");
    if (tok.replace(/\./g, "").length < 2) continue;
    const before = text.slice(Math.max(0, m.index - 2), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 32);
    if (/\$\s?$/.test(before)) continue; // dollar figure — cost, not reach
    if (/^\s*%/.test(after)) continue; // percentage — the hypothesis band, not reach
    if (/^(19|20)\d{2}$/.test(tok)) continue; // year

    const unitMatch = after.match(/^\s*(k|m|b|million|billion|thousand)\b/i) ?? after.match(/^(k|m|b)(?=[^a-z]|$)/i);
    const sizeWord =
      /^\s*\+?\s*(members?|subscribers?|subs|visitors?|followers?|listeners?|readers?|attendees?|downloads?|impressions?|users?|owners?|people)\b/i.test(after);
    if (!unitMatch && !sizeWord && Number(tok) < 1000) continue;

    const n = Number(tok);
    const candidates = new Set<string>([tok]);
    if (unitMatch && !Number.isNaN(n)) {
      const unit = unitMatch[1].toLowerCase();
      const mult = unit.startsWith("k") || unit === "thousand" ? 1e3 : unit.startsWith("b") ? 1e9 : 1e6;
      const scaled = n * mult;
      if (Number.isInteger(scaled)) candidates.add(String(scaled));
      candidates.delete(tok); // a unit-worn figure must match at scale, not as its bare prefix
      candidates.add(`${tok}${unitMatch[1].trim()}`); // and the literal "40K" form
    } else if (tok.includes(".") && !Number.isNaN(n)) {
      for (const mult of [1e3, 1e6, 1e9]) {
        const scaled = n * mult;
        if (Number.isInteger(scaled)) candidates.add(String(scaled));
      }
    }
    out.push({ display: unitMatch ? `${tok}${unitMatch[1].trim()}` : tok, candidates: [...candidates] });
  }
  return out;
}

/** Digit-boundary containment — "40" never matches inside "2400". */
function containsFigure(haystack: string, candidate: string): boolean {
  const esc = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\d.])${esc}(?![\\d])`, "i").test(haystack);
}

export function checkNoInventedReach(report: ArchetypeReport, toolAudit?: ToolAuditEntry[]): VerifierCheck {
  const plan = report.plan;
  if (!plan) {
    return { id: "no-invented-reach", status: "pass", detail: "skipped — report has no plan (pre-11B)" };
  }

  const fields: Array<{ owner: string; text: string }> = [
    { owner: "soWhat", text: plan.soWhat ?? "" },
    { owner: "splitHypothesis.rationale", text: plan.splitHypothesis?.rationale ?? "" },
    ...(plan.sequencing ?? []).map((t, i) => ({ owner: `sequencing[${i}]`, text: t })),
    ...(plan.messagingInputs ?? []).map((t, i) => ({ owner: `messagingInputs[${i}]`, text: t })),
    ...(plan.measurementSignals ?? []).map((t, i) => ({ owner: `measurementSignals[${i}]`, text: t })),
    ...(plan.lines ?? []).flatMap((l) => [
      { owner: `${l.id || l.channel}.channel`, text: l.channel ?? "" },
      { owner: `${l.id || l.channel}.targetingStack`, text: l.targetingStack ?? "" },
      { owner: `${l.id || l.channel}.rationale`, text: l.rationale ?? "" },
      { owner: `${l.id || l.channel}.doAvoid`, text: l.doAvoid ?? "" },
    ]),
  ];

  const logText = (toolAudit ?? []).map((e) => `${e.query} ${e.resultJson}`).join("\n").replace(/,/g, "");
  // Figures carried from the reconciled data already live elsewhere in the
  // report with their attribution — the existing number audits police those.
  const { plan: _plan, manualInputs, ...rest } = report;
  const restText = JSON.stringify(rest).replace(/,/g, "");
  const manualText = JSON.stringify(manualInputs ?? {}).replace(/,/g, "");

  const failures: string[] = [];
  let audited = 0;
  for (const { owner, text } of fields) {
    for (const { display, candidates } of reachLikeFigures(text)) {
      audited++;
      const traced = candidates.some(
        (cand) => containsFigure(logText, cand) || containsFigure(restText, cand) || containsFigure(manualText, cand)
      );
      if (traced) continue;
      failures.push(`${owner}: "${display}" — reach-shaped figure with no tool, report-carried, or manual source`);
    }
  }
  return check(
    "no-invented-reach",
    failures,
    [],
    audited === 0
      ? "plan carries no reach-shaped figures — reach arrives by manual entry, as designed"
      : `${audited} reach-shaped figure${audited === 1 ? "" : "s"} in plan text all trace to tool/report/manual sources`
  );
}

// ─── Assembly ─────────────────────────────────────────────────────────────────

export function runCodeChecks(inputs: VerifierInputs): VerifierCheck[] {
  return [
    checkSchemaConformance(inputs.report),
    checkValidatedByIntegrity(inputs.report),
    checkEnrichmentZeroDrift(inputs.report, inputs.reconciliation),
    checkSnapshotTraceability(inputs.report),
    checkCoreNameCoherence(inputs.report),
    checkNumberLogAudit(inputs.report, inputs.toolAudit),
    checkExemplarLeakage(inputs.report),
    checkPlanTraceability(inputs.report),
    checkNoInventedReach(inputs.report, inputs.toolAudit),
  ];
}

const LLM_CHECK_IDS = ["paraphrase-number-audit", "basis-honesty", "targetable-groundedness", "genericity-audit"];

export async function runVerifier(
  inputs: VerifierInputs,
  llmChecks?: LLMCheckRunner
): Promise<VerifierReport> {
  const checks = runCodeChecks(inputs);

  if (llmChecks) {
    try {
      checks.push(...(await llmChecks(inputs.report, inputs.toolAudit ?? [])));
    } catch (err) {
      // LLM-check failure degrades to warns — the code checks still ship.
      const reason = err instanceof Error ? err.message : String(err);
      for (const id of LLM_CHECK_IDS) {
        checks.push({ id, status: "warn", detail: `check did not run: ${reason.slice(0, 200)}` });
      }
    }
  }

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const summary =
    failCount === 0 && warnCount === 0
      ? `All ${checks.length} integrity checks passed.`
      : `${passCount}/${checks.length} checks passed (${failCount} failed, ${warnCount} warned).`;

  return {
    ranAt: new Date().toISOString(),
    checks,
    passCount,
    totalCount: checks.length,
    summary,
  };
}
