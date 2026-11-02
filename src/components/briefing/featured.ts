import { SocialSignal } from "@/types";

// Round 11A Part 4: deterministic featured-vs-row selection. Within a
// chapter's signal list: items with whyOnlyThisAudience populated, ordered by
// strength, cap 2 featured — 3 only if a third is equal-strength distinctive.
// Everything else renders as collapsed rows. Same JSON, same selection.

export function selectFeaturedSignals(signals: SocialSignal[]): {
  featured: SocialSignal[];
  rows: SocialSignal[];
} {
  const distinctive = signals
    .filter((s) => (s.whyOnlyThisAudience ?? "").trim().length > 0)
    .sort((a, b) => b.strength - a.strength);

  const featured = distinctive.slice(0, 2);
  if (distinctive.length > 2 && distinctive[2].strength === distinctive[1]?.strength) {
    featured.push(distinctive[2]);
  }

  const featuredIds = new Set(featured.map((s) => s.id));
  const rows = [...signals]
    .filter((s) => !featuredIds.has(s.id))
    .sort((a, b) => b.strength - a.strength);

  return { featured, rows };
}
