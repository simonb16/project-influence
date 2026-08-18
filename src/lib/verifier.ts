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
import { EXEMPLAR_NGRAMS, EXEMPLAR_SOURCE_AUDIENCE_KEYWORDS } from "@/lib/prompt";

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

  return check(
    "schema-conformance",
    failures,
    warns,
    `${signals.length} signals, all types present, WHERE/WHO/strength/scale valid`
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
        failures.push(`${box}: "${e.label}" score ${e.score} does not match source (${scored.map((m) => m.score).join("/")})`);
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

export function checkNumberLogAudit(report: ArchetypeReport, toolAudit?: ToolAuditEntry[]): VerifierCheck {
  if (!toolAudit || toolAudit.length === 0) {
    return { id: "number-log-audit", status: "pass", detail: "skipped — no tool audit available for this run" };
  }
  const dataSignals = report.dataSignals?.signals ?? [];
  if (dataSignals.length === 0) {
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
  const hits = EXEMPLAR_NGRAMS.filter((ng) => haystack.includes(ng.toLowerCase()));

  if (hits.length === 0) {
    return { id: "exemplar-leakage", status: "pass", detail: "no in-prompt exemplar phrases found in report content" };
  }

  const audience = (report.audience ?? "").toLowerCase();
  const sameAudience = EXEMPLAR_SOURCE_AUDIENCE_KEYWORDS.some((k) => audience.includes(k));

  if (sameAudience) {
    return {
      id: "exemplar-leakage",
      status: "warn",
      detail: `same-audience re-run — possible legitimate re-discovery of: ${hits.join(", ")}`,
    };
  }
  return {
    id: "exemplar-leakage",
    status: "fail",
    detail: `exemplar phrase(s) leaked into a different-audience report: ${hits.join(", ")}`,
  };
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
  ];
}

const LLM_CHECK_IDS = ["paraphrase-number-audit", "basis-honesty", "targetable-groundedness"];

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
