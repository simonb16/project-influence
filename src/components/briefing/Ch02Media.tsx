"use client";

import { ArchetypeReport, BucketedBehavioralSignal } from "@/types";
import type { BriefingPageId } from "./BriefingView";
import { ChapterHeader, Card, EvidenceDisclosure, Featured, FeaturedStrip, MutedNote, Row, RowGroup } from "./primitives";
import { buildBucketInventory, InventoryEntry } from "@/lib/bucketInventory";
import { bucketStrengthWord } from "./scoreWords";

// Chapter 02: How to find them in media — absorbs the Behavioral buckets
// Search / Consume / Buy (Go lives in Chapter 03: physical world is placement,
// not targeting), the full Round 10 inventory layer with every
// platformConcentration note preserved, targetable signals, and In-Market
// Behavior (→ Buy).
//
// Featured selection here (documented adaptation of Part 4 — bucket items
// carry no whyOnlyThisAudience): the first strength-high item per bucket in
// Search → Consume → Buy order, cap 2. Everything else renders as rows
// grouped by bucket, inventory beneath each group.

const MEDIA_BUCKETS = [
  { key: "search" as const, label: "What they search", intro: "Queries and query clusters the audience actually types." },
  { key: "consume" as const, label: "What they consume", intro: "Channels, creators, formats, and platforms they return to." },
  { key: "buy" as const, label: "What they buy", intro: "Purchases, considerations, and deliberate avoidances." },
];

function selectBucketFeatured(buckets: BucketedBehavioralSignal[]): BucketedBehavioralSignal[] {
  const featured: BucketedBehavioralSignal[] = [];
  for (const { key } of MEDIA_BUCKETS) {
    if (featured.length >= 2) break;
    const top = buckets.find((b) => b.bucket === key && b.strength === "high");
    if (top) featured.push(top);
  }
  return featured;
}

function BucketEvidence({ item }: { item: BucketedBehavioralSignal }) {
  if (!item.reinforcingEvidence?.length) return null;
  return (
    <EvidenceDisclosure srcLine={`${item.reinforcingEvidence.length} reinforcing item${item.reinforcingEvidence.length > 1 ? "s" : ""} · attributed per the three source tiers`}>
      {item.reinforcingEvidence.map((ev, i) => (
        <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>
          {ev.evidence} <span className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)" }}>— {ev.source}</span>
        </p>
      ))}
    </EvidenceDisclosure>
  );
}

function Targetable({ value }: { value?: string }) {
  if (!value?.trim()) return null;
  return (
    <p style={{ fontSize: 13, marginTop: 8 }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.13em", color: "var(--b-ink3)" }}>TARGETABLE · </span>
      <span style={{ color: "var(--b-ink2)" }}>{value}</span>
    </p>
  );
}

function InventoryRows({ entries }: { entries: InventoryEntry[] }) {
  if (!entries.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 12, color: "var(--b-ink3)", marginBottom: 4, fontStyle: "italic" }}>
        The full inventory — what the research surfaced:
      </p>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderTop: "1px solid var(--b-line)", fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: "var(--b-ink)", flexShrink: 0, maxWidth: 220 }}>{e.label}</span>
          <span style={{ color: "var(--b-ink2)" }}>
            {e.meta && <span className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)" }}>{e.meta} · </span>}
            {e.note}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Round 11B Part 2: the compact plan-preview table from the mockup — top
 * 3–4 lines (core-seed first), role chips, reach column, linking to 07. */
function PlanPreview({ report, onNavigate }: { report: ArchetypeReport; onNavigate?: (p: BriefingPageId) => void }) {
  const plan = report.plan;
  if (!plan || plan.lines.length === 0) return null;
  const lines = [...plan.lines].sort((a, b) => (a.role === b.role ? 0 : a.role === "core-seed" ? -1 : 1)).slice(0, 4);
  const reachFor = (id: string) => report.manualInputs?.planReach?.[id]?.value;
  return (
    <div className="b-card" style={{ padding: "14px 18px", margin: "0 0 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: "var(--b-ink3)", textTransform: "uppercase" }}>
          The plan — top lines
        </span>
        {onNavigate && (
          <button
            onClick={() => onNavigate("ch7")}
            style={{ fontSize: 12.5, color: "var(--b-accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            full plan → 07
          </button>
        )}
      </div>
      {lines.map((l) => (
        <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderTop: "1px solid var(--b-line)", fontSize: 13 }}>
          <span
            className="mono"
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              flexShrink: 0,
              color: l.role === "core-seed" ? "var(--b-accent)" : "var(--b-ink3)",
            }}
          >
            {l.role === "core-seed" ? "CORE SEED" : "REACH"}
          </span>
          <span style={{ fontWeight: 600, color: "var(--b-ink)", flex: 1 }}>{l.channel}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--b-ink3)", flexShrink: 0 }}>
            {reachFor(l.id) ?? `— ${l.reachBasis}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Ch02Media({ report, onNavigate }: { report: ArchetypeReport; onNavigate?: (p: BriefingPageId) => void }) {
  const buckets = report.behavioralBuckets ?? [];
  const inventory = buildBucketInventory(report);
  const featured = selectBucketFeatured(buckets);
  const featuredIds = new Set(featured.map((f) => f.id));
  const imb = report.inMarketBehavior;
  const inventoryEmpty = MEDIA_BUCKETS.every(({ key }) => inventory[key].length === 0);

  return (
    <div>
      <ChapterHeader
        num="02"
        title="How to find them in media"
        tagline="Targetable signals: interests, behaviors, affinities, and platform signals."
        useIt="build targeting stacks — core lines for precision, reach lines for scale."
        absorbs="Behavioral tab (Search · Consume · Buy + inventory layer) · targetable signals · In-Market Behavior"
      />

      <PlanPreview report={report} onNavigate={onNavigate} />

      {featured.map((item) => (
        <Featured key={item.id} eyebrow={`Core signal · ${item.bucket}`} title={item.signal} why={item.whatItSignals}>
          <Targetable value={item.targetableSignal} />
          <FeaturedStrip
            items={[
              { label: "Bucket", value: item.bucket.charAt(0).toUpperCase() + item.bucket.slice(1) },
              { label: "Signal", value: bucketStrengthWord(item.strength) },
            ]}
          />
          <BucketEvidence item={item} />
        </Featured>
      ))}

      {MEDIA_BUCKETS.map(({ key, label, intro }) => {
        const items = buckets.filter((b) => b.bucket === key && !featuredIds.has(b.id));
        const inv = inventory[key];
        if (items.length === 0 && inv.length === 0 && key !== "buy") {
          return (
            <RowGroup key={key} head={label}>
              <MutedNote>No evidenced signals in this bucket this run — thin beats padded.</MutedNote>
            </RowGroup>
          );
        }
        return (
          <RowGroup key={key} head={label}>
            <p style={{ fontSize: 12.5, color: "var(--b-ink3)", marginBottom: 8 }}>{intro}</p>
            {items.map((item) => (
              <Row key={item.id} title={item.signal} line={item.whatItSignals} strength={bucketStrengthWord(item.strength)}>
                <p>{item.whatItSignals}</p>
                <Targetable value={item.targetableSignal} />
                <BucketEvidence item={item} />
              </Row>
            ))}
            <InventoryRows entries={inv} />

            {/* In-Market Behavior lives under Buy per the mapping table */}
            {key === "buy" && imb && (
              <div style={{ marginTop: 14 }}>
                <Card title="In-market behavior">
                  <ul style={{ margin: 0, padding: 0 }}>
                    <li><b>Research pattern</b> — {imb.researchPattern}</li>
                    <li><b>Comparison behavior</b> — {imb.comparisonBehavior}</li>
                    {imb.decisionTriggers?.map((t, i) => (
                      <li key={i} className="hot"><b>Decision trigger</b> — {t}</li>
                    ))}
                    <li><b>Post-purchase</b> — {imb.postPurchaseBehavior}</li>
                    {imb.coreVsBase && (
                      <li><b>Core vs base</b> — core: {imb.coreVsBase.core} · base: {imb.coreVsBase.base}</li>
                    )}
                  </ul>
                </Card>
              </div>
            )}
          </RowGroup>
        );
      })}

      <RowGroup head="Where they go">
        <p style={{ fontSize: 13, color: "var(--b-ink3)" }}>
          → lives in Chapter 03 — physical world is placement, not targeting.
        </p>
      </RowGroup>

      {inventoryEmpty && (
        <MutedNote>Inventory unavailable this run (enrichment stage failed) — re-run for the full layer.</MutedNote>
      )}
    </div>
  );
}
