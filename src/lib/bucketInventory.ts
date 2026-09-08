import { ArchetypeReport, BehavioralBucket } from "@/types";

// Round 10 Part 0: the inventory layer. Maps existing report data (findability,
// in-market behavior, real-world habitat) into its home behavioral bucket —
// pure rendering support, no new agent output. Retroactive to every
// post-Round-9 report because the data already exists on each.

export interface InventoryEntry {
  label: string;
  /** The layer analysis that came with the item — never dropped when present. */
  note?: string;
  /** Compact trailing metadata, e.g. "demonstration · 68". */
  meta?: string;
}

export type BucketInventory = Record<BehavioralBucket, InventoryEntry[]>;

// Physical-vs-digital boundary for platformConcentrations — same rule the
// buckets already use: digital = Consume, physical = Go. Classified on the
// platform name alone; notes often mention offline context for digital venues.
const PHYSICAL_PLATFORM_RE =
  /\b(store|shop|caf[eé]s?|roaster(y|ies)?|event|expo|festival|meetup|market|venue|in[-\s]?person|irl|fair|convention|studio|class(es)?|gym|competition)\b/i;

// targetableInterests split: purchase-relevant → Buy, the rest → Consume.
const PURCHASE_INTEREST_RE =
  /\b(equipment|gear|machines?|appliances?|upgrades?|kits?|tools?|purchase|buying|shopping|deals?|marketplace|resale|used|secondhand|second[-\s]hand)\b/i;

export function buildBucketInventory(report: ArchetypeReport): BucketInventory {
  const inventory: BucketInventory = { search: [], consume: [], buy: [], go: [] };
  const f = report.findability;

  for (const q of f?.searchBehaviors ?? []) {
    if (q?.trim()) inventory.search.push({ label: q.trim() });
  }

  for (const pc of f?.platformConcentrations ?? []) {
    if (!pc?.platform?.trim()) continue;
    const entry: InventoryEntry = {
      label: pc.platform.trim(),
      note: pc.note?.trim() || undefined,
      meta: pc.spaces?.length ? pc.spaces.join(" · ") : undefined,
    };
    (PHYSICAL_PLATFORM_RE.test(pc.platform) ? inventory.go : inventory.consume).push(entry);
  }

  for (const interest of f?.targetableInterests ?? []) {
    if (!interest?.trim()) continue;
    (PURCHASE_INTEREST_RE.test(interest) ? inventory.buy : inventory.consume).push({
      label: interest.trim(),
    });
  }

  for (const trigger of report.inMarketBehavior?.decisionTriggers ?? []) {
    if (trigger?.trim()) inventory.buy.push({ label: trigger.trim() });
  }

  for (const h of report.realWorldHabitat ?? []) {
    if (!h?.context?.trim()) continue;
    inventory.go.push({
      label: h.context.trim(),
      meta: [h.influenceType, typeof h.strength === "number" ? String(h.strength) : null]
        .filter(Boolean)
        .join(" · ") || undefined,
    });
  }

  return inventory;
}

export function isInventoryEmpty(inventory: BucketInventory): boolean {
  return Object.values(inventory).every((entries) => entries.length === 0);
}
