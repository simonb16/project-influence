"use client";

import { ArchetypeReport, SocialSignal } from "@/types";
import { SignalMap, nativeCards } from "@/components/report/SocialSignals";
import { ChapterHeader, EvidenceDisclosure, Featured, FeaturedStrip, MutedNote, Row, RowGroup } from "./primitives";
import { selectFeaturedSignals } from "./featured";
import { scoreWord, bucketStrengthWord, titleCase } from "./scoreWords";
import { sameEntity } from "./dedupe";

// Chapter 03: Where to find them — absorbs the Social tab in full (Signal Map
// in the light briefing theme, social signals as featured/rows with validatedBy
// receipts),
// the Behavioral "Go" bucket + Real World Habitat (physical world = placement),
// digital habitat material, and the core's language codes (rendered on Social
// since Round 9).

const SOURCE_LABELS: Record<string, string> = {
  google_trends: "Google Trends",
  reddit: "Reddit",
  youtube: "YouTube",
  pinterest: "Pinterest",
  web_search: "Web search",
};

function SignalEvidence({ signal, report }: { signal: SocialSignal; report: ArchetypeReport }) {
  const dataSignals = report.dataSignals?.signals ?? [];
  const receipts = (signal.validatedBy ?? [])
    .map((ref) => dataSignals.find((d) => d.id === ref))
    .filter((d): d is NonNullable<typeof d> => !!d);
  return (
    <EvidenceDisclosure
      srcLine={`strength ${signal.strength} · scale ${signal.scale} · ${receipts.length ? `${receipts.length} validated receipt${receipts.length > 1 ? "s" : ""}` : "evidence-attributed"}`}
    >
      <p>{signal.evidence}</p>
      <p style={{ marginTop: 6 }}>
        <b>Strength basis:</b> {signal.strengthBasis}
      </p>
      {signal.scaleBasis && (
        <p style={{ marginTop: 4 }}>
          <b>Scale basis:</b> {signal.scaleBasis}
        </p>
      )}
      {receipts.map((d, i) => (
        <p key={i} className="mono" style={{ fontSize: 11, color: "var(--b-good)", marginTop: 6 }}>
          ✓ {SOURCE_LABELS[d.source] ?? d.source}: {d.metric} — {d.finding}
        </p>
      ))}
      {signal.targetableSignals?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {signal.targetableSignals.map((t, i) => (
            <p key={i} style={{ fontSize: 12.5 }}>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--b-accent)" }}>{t.platform}</span> — {t.detail}
            </p>
          ))}
        </div>
      )}
    </EvidenceDisclosure>
  );
}

export function Ch03Where({ report }: { report: ArchetypeReport }) {
  const { featured, rows } = selectFeaturedSignals(report.socialSignals ?? []);
  const cards = nativeCards(report);
  const goItems = (report.behavioralBuckets ?? []).filter((b) => b.bucket === "go");
  // Punchlist 3: Go bucket and real-world habitat often describe the same
  // venue from two pipeline paths — render it once. A matching habitat item
  // folds its notes into the Go row (union of notes, inventory-note rule);
  // only unmatched habitat items render as their own rows.
  const habitatAll = report.realWorldHabitat ?? [];
  const habitatFor = (signal: string) => habitatAll.find((h) => sameEntity(signal, h.context));
  const habitat = habitatAll.filter((h) => !goItems.some((g) => sameEntity(g.signal, h.context)));
  const digital = report.digitalHabitat ?? [];
  const languageCodes = report.influentialCore?.languageCodes ?? [];

  return (
    <div>
      <ChapterHeader
        num="03"
        title="Where to find them"
        tagline="The communities, platforms and spaces where influence actually moves."
        useIt="pick the right voices, communities and environments to show up in."
        absorbs="Social tab (signals + signal map) · Behavioral “Go” bucket · real-world habitat · digital habitat · language codes"
      />

      {cards && cards.length > 0 && (
        <section style={{ margin: "22px 0 26px" }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", color: "var(--b-ink3)", marginBottom: 10 }}>
            SIGNAL MAP
          </div>
          <SignalMap
            cards={cards}
            variant="light"
            onSelect={(id) => document.getElementById(`b-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
        </section>
      )}

      {featured.map((s) => (
        <div key={s.id} id={`b-${s.id}`}>
          <Featured eyebrow="Distinctive · only this audience" title={s.signal} why={s.whyOnlyThisAudience}>
            <p style={{ fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.55, maxWidth: 600 }}>{s.body}</p>
            <FeaturedStrip
              items={[
                { label: "Strength", value: scoreWord(s.strength) },
                { label: "Reach", value: titleCase(s.scale) },
                { label: "", value: titleCase(s.type) },
              ]}
            />
            <SignalEvidence signal={s} report={report} />
          </Featured>
        </div>
      ))}

      <RowGroup head="Also in this audience's social fabric — expand any row">
        {rows.map((s) => (
          <div key={s.id} id={`b-${s.id}`}>
            <Row title={s.signal} line={s.body} strength={scoreWord(s.strength)}>
              <p>{s.body}</p>
              <p style={{ marginTop: 6, fontSize: 13 }}>
                <b>Where:</b> {s.where} · <b>Who:</b> {s.who}
              </p>
              {s.whyOnlyThisAudience && (
                <p className="serif" style={{ fontStyle: "italic", marginTop: 6 }}>{s.whyOnlyThisAudience}</p>
              )}
              <SignalEvidence signal={s} report={report} />
            </Row>
          </div>
        ))}
      </RowGroup>

      {(goItems.length > 0 || habitat.length > 0) && (
        <RowGroup head="In the world — placement, not targeting">
          {goItems.map((item) => {
            const merged = habitatFor(item.signal);
            return (
              <Row key={item.id} title={item.signal} line={item.whatItSignals} strength={bucketStrengthWord(item.strength)}>
                <p>{item.whatItSignals}</p>
                {merged && (
                  <p style={{ marginTop: 6 }}>
                    {merged.description} <b>Influence type:</b> {merged.influenceType}
                  </p>
                )}
                {item.targetableSignal?.trim() && (
                  <p style={{ marginTop: 6, fontSize: 13 }}>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: "0.13em", color: "var(--b-ink3)" }}>TARGETABLE · </span>
                    {item.targetableSignal}
                  </p>
                )}
                {item.reinforcingEvidence?.length > 0 && (
                  <EvidenceDisclosure srcLine="attributed per the three source tiers">
                    {item.reinforcingEvidence.map((ev, i) => (
                      <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>
                        {ev.evidence} <span className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)" }}>— {ev.source}</span>
                      </p>
                    ))}
                  </EvidenceDisclosure>
                )}
                {merged?.evidence && <EvidenceDisclosure srcLine="lens evidence">{merged.evidence}</EvidenceDisclosure>}
              </Row>
            );
          })}
          {habitat.map((h, i) => (
            <Row key={`h${i}`} title={h.context} line={h.description} strength={scoreWord(h.strength)}>
              <p>{h.description}</p>
              <p style={{ marginTop: 6, fontSize: 13 }}>
                <b>Influence type:</b> {h.influenceType}
              </p>
              {h.evidence && <EvidenceDisclosure srcLine="lens evidence">{h.evidence}</EvidenceDisclosure>}
            </Row>
          ))}
        </RowGroup>
      )}

      {digital.length > 0 && (
        <RowGroup head="Digital habitat — the underlying community map">
          {digital.map((d, i) => (
            <Row key={i} title={d.community} line={`${d.platform} · ${d.description}`} strength={scoreWord(d.engagementIntensity)}>
              <p>{d.description}</p>
              <p style={{ marginTop: 6, fontSize: 13 }}>
                <b>Platform:</b> {d.platform} · <b>Category:</b> {d.category}
              </p>
            </Row>
          ))}
        </RowGroup>
      )}

      {languageCodes.length > 0 && (
        <RowGroup head="Insider language — fluency signals belonging">
          {languageCodes.map((code, i) => (
            <div key={i} style={{ padding: "7px 4px", borderTop: "1px solid var(--b-line)", fontSize: 13.5, color: "var(--b-ink2)" }}>
              {code}
            </div>
          ))}
        </RowGroup>
      )}

      {(!report.socialSignals || report.socialSignals.length === 0) && (
        <MutedNote>No social signal data in this report.</MutedNote>
      )}
    </div>
  );
}
