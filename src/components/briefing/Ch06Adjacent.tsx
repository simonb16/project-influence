"use client";

import { ArchetypeReport } from "@/types";
import { normalizePeriphery } from "@/lib/periphery";
import { PeripheryMap } from "@/components/report/PeripheryMap";
import { ChapterHeader, Card, Cols2, EvidenceDisclosure, MutedNote, Row, RowGroup } from "./primitives";
import { overlapWord, scoreWord } from "./scoreWords";

// Chapter 06: Who they're next to — absorbs the Periphery in full: adjacency
// graph (dark plate), adjacent territories as rows — each with its bridge
// rationale and, where the data supports one, a partnership-angle line
// (existing bridge/evidence content rephrased in render, not newly
// generated) — Cultural Connectors, periphery insights, and the affinity
// adjacencies (the mockup's absorbs note names them here explicitly).

export function Ch06Adjacent({ report }: { report: ArchetypeReport }) {
  const periphery = normalizePeriphery(report);
  const insights = report.peripheryData?.insights;
  const connectors = report.peripheryData?.culturalConnectors ?? [];
  const inner = report.peripheryData?.peripheryMap?.innerRing ?? [];
  const outer = report.peripheryData?.peripheryMap?.outerRing ?? [];
  const affinities = report.findability?.affinityAdjacencies ?? [];

  return (
    <div>
      <ChapterHeader
        num="06"
        title="Who they're next to"
        tagline="The adjacent audiences and cultural territories they already overlap with."
        useIt="find expansion audiences and partnership territory — where someone else's audience is already half yours."
        absorbs="Periphery / adjacencies · cultural connectors · affinity adjacencies"
      />

      {periphery && (
        <section style={{ margin: "22px 0 26px" }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", color: "var(--b-ink3)", marginBottom: 10 }}>
            PERIPHERY MAP
          </div>
          <PeripheryMap archetype={report.archetype} data={periphery} variant="light" />
        </section>
      )}

      {(inner.length > 0 || outer.length > 0) && (
        <RowGroup head="Adjacent territories — expand any row">
          {[...inner, ...outer].map((p, i) => (
            <Row key={i} title={p.name} line={p.description} strength={overlapWord(p.overlapStrength)}>
              <p>{p.description}</p>
              <p style={{ marginTop: 6, fontSize: 13 }}>
                <b>Segment:</b> {p.segment} · <b>Angle:</b> {p.evidence}
              </p>
            </Row>
          ))}
        </RowGroup>
      )}

      {connectors.length > 0 && (
        <RowGroup head="Cultural connectors — how influence crosses the bridge">
          {connectors.map((c, i) => (
            <Row key={i} title={c.connector} line={c.bridges} strength={scoreWord(c.bridgeStrength)}>
              <p>
                <b>Bridges:</b> {c.bridges} · <b>Type:</b> {c.type}
              </p>
              <p style={{ marginTop: 6 }}>{c.mechanism}</p>
              <EvidenceDisclosure srcLine={`bridge strength ${c.bridgeStrength}`}>{c.evidence}</EvidenceDisclosure>
            </Row>
          ))}
        </RowGroup>
      )}

      {affinities.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Card title="Affinity adjacencies — for lookalike and affinity targeting">
            <ul style={{ margin: 0, padding: 0 }}>
              {affinities.map((a, i) => (
                <li key={i}>
                  <b>{a.interest}</b> — {a.rationale}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {insights && (
        <div style={{ marginTop: 16 }}>
          <Cols2>
            <Card title="Surprising overlaps">
              <ul style={{ margin: 0, padding: 0 }}>
                {insights.surprisingOverlaps?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
            <Card title="Bridge opportunities">
              <ul style={{ margin: 0, padding: 0 }}>
                {insights.bridgeOpportunities?.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </Card>
          </Cols2>
          {insights.expansionPaths?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Card title="Expansion paths">
                <ul style={{ margin: 0, padding: 0 }}>
                  {insights.expansionPaths.map((p, i) => (
                    <li key={i}>
                      <b>{p.direction}</b> — {p.rationale}{" "}
                      <span style={{ color: "var(--b-ink3)" }}>Risk: {p.risk}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      )}

      {!periphery && <MutedNote>No adjacency data available in this report.</MutedNote>}
    </div>
  );
}
