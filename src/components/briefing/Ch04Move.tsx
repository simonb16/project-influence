"use client";

import { ArchetypeReport, EmotionalDriver } from "@/types";
import { ChapterHeader, Card, EvidenceDisclosure, Featured, FeaturedStrip, MutedNote, Row, RowGroup } from "./primitives";
import { scoreWord } from "./scoreWords";

// Chapter 04: How to move them — absorbs the Motivational tab in full:
// emotional drivers (featured = top-scored driver, rest = rows, scores as
// words), key tensions, and Barriers & Frictions as the "What backfires" card.

function emotionLabel(d: EmotionalDriver): string {
  return d.emotion.charAt(0).toUpperCase() + d.emotion.slice(1);
}

function convergenceLabel(status?: string): string | null {
  if (status === "converged") return "Converged — multiple lenses";
  if (status === "single-lens") return "Single lens";
  if (status === "conflicted") return "Lenses conflicted";
  return null;
}

function DriverEvidence({ d }: { d: EmotionalDriver }) {
  return (
    <EvidenceDisclosure srcLine={`driver score ${d.score} · ${d.convergenceStatus ?? "lens evidence"}`}>
      <p>{d.evidence}</p>
      {d.coreVsBase && (
        <p style={{ marginTop: 6 }}>
          <b>Core:</b> {d.coreVsBase.core} · <b>Base:</b> {d.coreVsBase.base}
        </p>
      )}
    </EvidenceDisclosure>
  );
}

export function Ch04Move({ report }: { report: ArchetypeReport }) {
  const drivers = [...(report.emotionalDrivers ?? [])].sort((a, b) => b.score - a.score);
  const featured = drivers[0];
  const rest = drivers.slice(1);
  const tensions = report.influentialCore?.keyTensions ?? [];
  const barriers = [...(report.barriers ?? [])].sort((a, b) => b.intensity - a.intensity);

  return (
    <div>
      <ChapterHeader
        num="04"
        title="How to move them"
        tagline="The emotional drivers, motivations, tensions and triggers most likely to change behavior."
        useIt="brief creative and messaging — what to lean on, and what will get you rejected."
        absorbs="Motivational tab (drivers · tensions · barriers)"
      />

      {featured && (
        <Featured eyebrow="Primary driver" title={emotionLabel(featured)} why={featured.mechanism}>
          <p style={{ fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.55, maxWidth: 600 }}>{featured.evidence}</p>
          <FeaturedStrip
            items={[
              { label: "Signal", value: scoreWord(featured.score) },
              ...(convergenceLabel(featured.convergenceStatus)
                ? [{ label: "Confidence", value: convergenceLabel(featured.convergenceStatus)! }]
                : []),
            ]}
          />
          <DriverEvidence d={featured} />
        </Featured>
      )}

      {rest.length > 0 && (
        <RowGroup head="The full driver set — expand any row">
          {rest.map((d, i) => (
            <Row key={i} title={emotionLabel(d)} line={d.mechanism ?? d.evidence} strength={scoreWord(d.score)}>
              <p>{d.mechanism ?? ""}</p>
              <DriverEvidence d={d} />
            </Row>
          ))}
        </RowGroup>
      )}

      {tensions.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Card title="Key tensions — the frictions that explain why they act">
            <ul style={{ margin: 0, padding: 0 }}>
              {tensions.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {barriers.length > 0 && (
        <RowGroup head="What backfires — barriers and frictions">
          {barriers.map((b, i) => (
            <Row key={i} title={b.name} line={b.description} strength={scoreWord(b.intensity)}>
              <p>{b.description}</p>
              <p style={{ marginTop: 6, fontSize: 13 }}>
                <b>Type:</b> {b.type} · <b>What would lower it:</b> {b.implication}
              </p>
              <EvidenceDisclosure srcLine={`barrier intensity ${b.intensity}`}>{b.evidence}</EvidenceDisclosure>
            </Row>
          ))}
        </RowGroup>
      )}

      {drivers.length === 0 && <MutedNote>No motivational data in this report.</MutedNote>}
    </div>
  );
}
