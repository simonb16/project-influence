"use client";

import { ArchetypeReport } from "@/types";
import { ChapterHeader, Card, EvidenceDisclosure, MutedNote, Row, RowGroup } from "./primitives";

// Chapter 05: How to engage them — absorbs the Activation tab: Entry Points
// (with approach/avoid) and the activation outline. This is the report's
// thinnest layer by design: render what exists, honestly — padding forbidden.
// The deeper activation layer arrives with the plan round (11B); depth is a
// Maria-checkpoint question.

export function Ch05Engage({ report }: { report: ArchetypeReport }) {
  const entryPoints = report.entryPoints ?? [];
  const plays = report.influentialCore?.activationRecommendations ?? [];

  return (
    <div>
      <ChapterHeader
        num="05"
        title="How to engage them"
        tagline="The content, experiences, partnerships and participation mechanics most likely to get them to act."
        useIt="choose formats and mechanics — the ways in that this audience actually accepts."
        absorbs="Activation tab (entry points · activation plays)"
      />

      {entryPoints.length > 0 && (
        <RowGroup head="Entry points — the on-ramps the audience accepts">
          {entryPoints.map((e, i) => (
            <Row key={i} title={e.type} line={e.description} strength={e.confidence ? e.confidence : undefined}>
              <p>{e.description}</p>
              {e.approach && (
                <p style={{ marginTop: 8 }}>
                  <b>Approach:</b> {e.approach}
                </p>
              )}
              {e.avoid && (
                <p style={{ marginTop: 4 }}>
                  <b>Avoid:</b> {e.avoid}{" "}
                  <span style={{ color: "var(--b-ink3)" }}>(the full what-backfires set lives in Chapter 04)</span>
                </p>
              )}
              {e.examples?.length > 0 && (
                <EvidenceDisclosure
                  summary="Show examples"
                  srcLine={e.rationale ? `rationale: ${e.rationale}` : undefined}
                >
                  {e.examples.map((ex, j) => (
                    <p key={j} style={{ margin: j ? "6px 0 0" : 0 }}>
                      <b>{ex.title}</b> ({ex.platform}){ex.unverified ? " · unverified" : ""} — {ex.why}
                      {ex.url && (
                        <>
                          {" "}
                          <a href={ex.url} target="_blank" rel="noreferrer" style={{ color: "var(--b-accent)" }}>
                            ↗
                          </a>
                        </>
                      )}
                    </p>
                  ))}
                </EvidenceDisclosure>
              )}
            </Row>
          ))}
        </RowGroup>
      )}

      {plays.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Card title="Activation plays">
            <ul style={{ margin: 0, padding: 0 }}>
              {plays.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {entryPoints.length === 0 && plays.length === 0 && (
        <MutedNote>No activation recommendations in this report.</MutedNote>
      )}

      <MutedNote>
        This is the report's thinnest layer by design — the deeper activation layer arrives with the plan round.
      </MutedNote>
    </div>
  );
}
