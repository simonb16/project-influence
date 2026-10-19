import { VerifierCheck, VerifierReport } from "@/types";

// Round 11A Part 5: verifier DISPLAY recalibration — a render-side mapping
// over existing check IDs. The Verifier itself is untouched; severities in
// report_json are unchanged.
//
// The mapping (by check id):
//   Known-benign WARN categories → neutral "Notes" tier, excluded from the
//   footer count:
//     - number-log-audit    (derivation-tolerance warns are by design: the
//                            code check defers near-miss numbers to the LLM
//                            paraphrase audit rather than failing them)
//     - snapshot-traceability (label-match-miss warns are by design since the
//                            Round 10 fix: the score traces, the short label
//                            matched a sibling)
//     - schema-conformance  (its warn is the designed enrichment-outage
//                            degradation: all targetables empty)
//   Every other WARN stays integrity-relevant (leakage, genericity,
//   attribution/paraphrase gaps, basis honesty, targetable groundedness,
//   validatedby integrity, corename coherence, enrichment drift).
//   FAIL: unchanged — prominent, absolute, any FAIL = not for external use.

const BENIGN_WARN_IDS = new Set(["number-log-audit", "snapshot-traceability", "schema-conformance"]);

export type DisplayTier = "pass" | "note" | "warn" | "fail";

export function displayTier(check: VerifierCheck): DisplayTier {
  if (check.status === "fail") return "fail";
  if (check.status === "warn") return BENIGN_WARN_IDS.has(check.id) ? "note" : "warn";
  return "pass";
}

export interface VerifierDisplay {
  verified: boolean; // no FAIL and no integrity-relevant WARN
  failCount: number;
  warnCount: number; // integrity-relevant warns only
  noteCount: number;
  totalCount: number;
  footer: string; // sidebar/footer line
}

export function verifierDisplay(report: VerifierReport | undefined): VerifierDisplay | null {
  if (!report) return null;
  const tiers = report.checks.map(displayTier);
  const failCount = tiers.filter((t) => t === "fail").length;
  const warnCount = tiers.filter((t) => t === "warn").length;
  const noteCount = tiers.filter((t) => t === "note").length;
  const verified = failCount === 0 && warnCount === 0;
  const footer = verified
    ? `✓ Verified · ${report.totalCount} integrity checks`
    : failCount > 0
      ? `✕ ${failCount} failed check${failCount > 1 ? "s" : ""} — re-run before external use`
      : `⚠ ${warnCount} integrity warn${warnCount > 1 ? "s" : ""} · ${report.totalCount} checks`;
  return { verified, failCount, warnCount, noteCount, totalCount: report.totalCount, footer };
}
