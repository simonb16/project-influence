"use client";

import { ArchetypeReport } from "@/types";
import { ChapterHeader, Card, Cols2, EvidenceDisclosure, Featured, MutedNote } from "./primitives";
import { collectContrasts, deriveCorePercent, deriveEstReach } from "./summaryDerive";
import { scoreWord } from "./scoreWords";

// Chapter 01: Who are they — absorbs the Influential Core tab in full:
// core hero (name, tagline, size ring + sizing derivation disclosure),
// the four-beat Story as the chapter narrative, coreVsBase contrasts as
// side-by-side base/core cards, susceptibility/initiator content, and the
// base description (lens base material; raw audience input renders on the
// Report inputs page only — punchlist 4).

function susceptibilityTier(score: number): string {
  if (score >= 70) return "Receptive";
  if (score >= 40) return "Moderate";
  return "Resistant";
}

function initiatorTier(score: number): string {
  if (score >= 60) return "Trendsetter";
  if (score >= 40) return "Early Adopter";
  return "Imitator";
}

function CoreRing({ percentLabel, reachLabel }: { percentLabel: string | null; reachLabel: string | null }) {
  return (
    <div style={{ flexShrink: 0, margin: "6px 18px 0 0" }}>
      <div style={{ width: 110, height: 110, border: "1px dashed var(--b-ink3)", borderRadius: "50%", position: "relative" }}>
        <div style={{ position: "absolute", width: 46, height: 46, background: "var(--b-accent)", borderRadius: "50%", left: 32, top: 32 }} />
      </div>
      <div style={{ marginTop: 6, width: 110, textAlign: "center", fontSize: 10.5, color: "var(--b-ink3)" }}>
        {percentLabel ?? "core"}
        {reachLabel ? ` of ${reachLabel}` : ""}
      </div>
    </div>
  );
}

export function Ch01Who({ report }: { report: ArchetypeReport }) {
  const core = report.influentialCore;
  const sus = report.influenceSusceptibility;
  const contrasts = collectContrasts(report).slice(0, 3);
  const percentLabel = deriveCorePercent(report);
  const reachLabel = deriveEstReach(report);
  const name = core?.coreName ?? report.signalsSnapshot?.coreLabel ?? "The Influential Core";

  return (
    <div>
      <ChapterHeader
        num="01"
        title="Who are they"
        tagline="A human description of who they are, what they care about, and what makes them influential."
        useIt="brief anyone — creative, client, or planner — on who this audience actually is."
        absorbs="Influential Core tab · Snapshot core summary"
      />

      {/* ── The core hero ── */}
      <Featured eyebrow="The influential core" title={name} why={core?.coreTagline}>
        <div style={{ display: "flex", gap: 8 }}>
          <CoreRing percentLabel={percentLabel} reachLabel={reachLabel} />
          <div style={{ flex: 1 }}>
            {core?.definition && (
              <p style={{ fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.55 }}>{core.definition}</p>
            )}
            {report.coreSize && (
              <EvidenceDisclosure
                summary="How we sized the core"
                srcLine={`derivation · confidence: ${report.coreSize.confidence} · verified against the tool log`}
              >
                {report.coreSize.basis}
              </EvidenceDisclosure>
            )}
          </div>
        </div>
      </Featured>

      {/* ── The Story — the chapter's narrative block (four-beat spec) ── */}
      {report.summary && (
        <div style={{ margin: "26px 0" }}>
          <h5 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--b-ink3)", marginBottom: 8 }}>
            The story
          </h5>
          <p className="serif" style={{ fontSize: 17.5, lineHeight: 1.6, color: "var(--b-ink)", maxWidth: 640 }}>
            {report.summary}
          </p>
        </div>
      )}

      {/* ── Base vs core — side-by-side cards from the lens contrasts ── */}
      <Cols2>
        <Card title="The base — how they behave">
          {/* Punchlist 4: raw run input never renders as report prose — it
              lives on Report inputs only. No lens base-description field
              exists in report_json, so the lens contrast bullets stand alone. */}
          <ul style={{ margin: 0, padding: 0 }}>
            {contrasts.map((c, i) => (
              <li key={i}>{c.note.base}</li>
            ))}
          </ul>
        </Card>
        <Card title="How the core differs">
          {core?.profile && (
            <p style={{ fontSize: 13, color: "var(--b-ink2)", lineHeight: 1.5, marginBottom: contrasts.length ? 8 : 0 }}>
              {core.profile}
            </p>
          )}
          <ul style={{ margin: 0, padding: 0 }}>
            {contrasts.map((c, i) => (
              <li key={i} className="hot">
                <b>{c.note.core}</b>
              </li>
            ))}
          </ul>
        </Card>
      </Cols2>

      {/* ── Susceptibility / initiator ── */}
      {sus && (
        <div style={{ marginTop: 16 }}>
          <Cols2>
            <Card title="How open they are to influence">
              <p style={{ fontSize: 13, color: "var(--b-ink2)", marginBottom: 8 }}>
                <b style={{ color: "var(--b-ink)" }}>{susceptibilityTier(sus.overallScore)}</b> ({scoreWord(sus.overallScore).toLowerCase()} susceptibility) ·{" "}
                <b style={{ color: "var(--b-ink)" }}>{initiatorTier(sus.initiatorScore)}</b> on the imitator–initiator spectrum
              </p>
              <ul style={{ margin: 0, padding: 0 }}>
                {(sus.channels ?? []).map((ch, i) => (
                  <li key={i}>
                    <b>{ch.channel}</b> — {scoreWord(ch.score)} · {ch.description}
                  </li>
                ))}
              </ul>
              <EvidenceDisclosure srcLine="influence susceptibility scores · reconciliation agent">
                Susceptibility {sus.overallScore}/100 · initiator {sus.initiatorScore}/100.
              </EvidenceDisclosure>
            </Card>
            <Card title="What they respond to / resist">
              <ul style={{ margin: 0, padding: 0 }}>
                {(sus.highSusceptibility ?? []).map((h, i) => (
                  <li key={`h${i}`} className="hot">
                    <b>Open:</b> {h}
                  </li>
                ))}
                {(sus.lowSusceptibility ?? []).map((l, i) => (
                  <li key={`l${i}`}>
                    <b>Resists:</b> {l}
                  </li>
                ))}
              </ul>
            </Card>
          </Cols2>
        </div>
      )}

      {!core && <MutedNote>This report predates the influential core analysis.</MutedNote>}
    </div>
  );
}
