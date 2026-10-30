// Punchlist 3: the Go bucket and real-world habitat describe the same venues
// from two pipeline paths, phrased differently ("EO Forum / Vistage / TAB
// monthly peer meetings" vs "Vistage/EO/TAB monthly peer-group sessions").
// Entity match = token-overlap coefficient over the two titles: tokens are
// lowercased alphanumeric runs minus function words; a pair is the same venue
// when the smaller title's tokens are ≥60% contained in the larger's.
//
// Initialism bridge (punchlist follow-up): an acronym spelled by consecutive
// significant words in one title ("local yarn stores" → "lys") counts as a
// shared token when it appears literally in the other title ("LYS knit
// nights"). Only word↔acronym matches count — acronym↔acronym coincidences
// (shared word prefixes) never do. Minimum 3 letters to avoid noise.

const FUNCTION_WORDS = new Set(["and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "with", "for", "their", "its"]);

function significantWords(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !FUNCTION_WORDS.has(t));
}

/** Acronyms of every run of 3–5 consecutive significant words. */
function initialisms(words: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    let acc = "";
    for (let j = i; j < words.length && j < i + 5; j++) {
      acc += words[j][0];
      if (acc.length >= 3) out.add(acc);
    }
  }
  return out;
}

export function sameEntity(a: string, b: string): boolean {
  const wa = significantWords(a);
  const wb = significantWords(b);
  const ta = new Set(wa);
  const tb = new Set(wb);
  if (ta.size === 0 || tb.size === 0) return false;

  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  for (const acr of initialisms(wa)) if (tb.has(acr) && !ta.has(acr)) shared++;
  for (const acr of initialisms(wb)) if (ta.has(acr) && !tb.has(acr)) shared++;

  return shared / Math.min(ta.size, tb.size) >= 0.6;
}
