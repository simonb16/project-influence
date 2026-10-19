// Round 11A Part 4: scores as words. One monotonic mapping used identically
// everywhere a 0-100 score renders in the briefing view. Thresholds chosen
// from the observed score distributions across the stored post-R9 reports
// (social strengths 50-85, driver scores 55-90, barrier intensities 40-85):
//   ≥75 → Strong · 55-74 → Moderate · <55 → Emerging
// Numbers stay available inside evidence disclosures — words outside.

export type ScoreWord = "Strong" | "Moderate" | "Emerging";

export function scoreWord(score: number): ScoreWord {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Moderate";
  return "Emerging";
}

/** Bucket items carry "high" | "medium" instead of a number. */
export function bucketStrengthWord(strength: "high" | "medium"): ScoreWord {
  return strength === "high" ? "Strong" : "Moderate";
}

/** Periphery overlap already speaks in words — fold into the same three. */
export function overlapWord(overlap: "near-universal" | "strong" | "moderate" | "emerging"): ScoreWord {
  if (overlap === "near-universal" || overlap === "strong") return "Strong";
  if (overlap === "moderate") return "Moderate";
  return "Emerging";
}

/** Scale words render as-is, title-cased ("niche" → "Niche"). */
export function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
