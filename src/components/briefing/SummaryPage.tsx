"use client";

import { ArchetypeReport } from "@/types";
import type { BriefingPageId } from "./BriefingView";
import { BlockHead, Card, Chip, ChipRow, Cols2, StatBox } from "./primitives";
import {
  deriveAdjacencyChips,
  deriveBackfires,
  deriveBaseSummary,
  deriveCorePercent,
  deriveEngagementChips,
  deriveEstReach,
  deriveInTheWorld,
  deriveOnline,
  deriveSignalChips,
  deriveTagline,
  deriveWhatWorks,
  extractLever,
  strongestContrast,
  SummaryLine,
} from "./summaryDerive";
import { verifierDisplay } from "./verifierDisplay";

// The Summary page (Part 3): one page a stranger can read and say "okay, I
// got it." Assembled entirely from existing report data — deterministic
// template assembly, no LLM calls. Same JSON, same Summary.

function LineList({ lines }: { lines: SummaryLine[] }) {
  return (
    <ul style={{ margin: 0, padding: 0 }}>
      {lines.map((l, i) => (
        <li key={i} className={l.hot ? "hot" : undefined}>
          <b>{l.label}</b>
          {l.detail ? ` — ${l.detail}` : ""}
        </li>
      ))}
    </ul>
  );
}

export function SummaryPage({
  report,
  onNavigate,
}: {
  report: ArchetypeReport;
  onNavigate: (p: BriefingPageId) => void;
}) {
  const core = report.influentialCore;
  const tagline = deriveTagline(report);
  const estReach = deriveEstReach(report);
  const corePercent = deriveCorePercent(report);
  const reach = report.manualInputs?.platformReach;
  const baseSummary = deriveBaseSummary(report);
  const contrast = strongestContrast(report);
  const chips = deriveSignalChips(report);
  const world = deriveInTheWorld(report);
  const online = deriveOnline(report);
  const works = deriveWhatWorks(report);
  const backfires = deriveBackfires(report);
  const engage = deriveEngagementChips(report);
  const adjacent = deriveAdjacencyChips(report);
  const lever = extractLever(report);
  const vd = verifierDisplay(report.verifierReport);
  const date = new Date(report.generatedAt).toLocaleDateString("en-US", { dateStyle: "medium" });

  return (
    <div>
      {/* ── Header ── */}
      <div className="b-kicker" style={{ marginBottom: 10 }}>
        Audience report · {date} {vd?.verified ? "· ✓ verified " : ""}· by Significant
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div className="serif" style={{ fontWeight: 500, fontSize: 36, lineHeight: 1.05, marginBottom: 4 }}>
            {report.archetype}
          </div>
          {tagline && (
            <div className="serif" style={{ fontStyle: "italic", color: "var(--b-ink2)", fontSize: 17 }}>{tagline}</div>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexShrink: 0 }}>
          <StatBox n={estReach ?? "—"} label="Est. reach" basis={estReach ? "triangulated" : "no size evidence"} empty={!estReach} />
          <StatBox n={corePercent ?? "—"} label="Influential core" basis="evidence-based" core empty={!corePercent} />
          <StatBox
            n={reach?.value ?? "—"}
            label="Platform reach"
            basis={reach ? `${reach.platform} · ${reach.dateChecked}` : "add from Ads Manager"}
            empty={!reach}
          />
        </div>
      </div>

      {/* ── Intent router ── */}
      <div
        className="b-card"
        style={{ padding: "10px 16px", margin: "20px 0 30px", fontSize: 12.5, color: "var(--b-ink3)", display: "flex", flexWrap: "wrap", gap: "6px 18px", alignItems: "baseline" }}
      >
        <b style={{ color: "var(--b-ink2)", fontWeight: 600 }}>Reading this as a brief?</b>
        {(
          [
            ["Prospecting", "ch2", "02"],
            ["Awareness & placement", "ch3", "03"],
            ["Messaging & creative", "ch4", "04"],
            ["Content & participation", "ch5", "05"],
            ["Partnerships", "ch6", "06"],
          ] as Array<[string, BriefingPageId, string]>
        ).map(([label, page, num]) => (
          <span key={page} style={{ whiteSpace: "nowrap" }}>
            {label} →{" "}
            <button
              onClick={() => onNavigate(page)}
              style={{ color: "var(--b-accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5 }}
            >
              {num}
            </button>
          </span>
        ))}
      </div>

      {/* ── 01 ── */}
      <div style={{ marginBottom: 28 }}>
        <BlockHead num="01" title="Who are they" link="full chapter →" onNavigate={() => onNavigate("ch1")} />
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ flex: 1, fontSize: 14.5, color: "var(--b-ink2)", lineHeight: 1.6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, color: "var(--b-ink3)" }}>
              The audience
            </div>
            {baseSummary ?? report.audience ?? report.query ?? ""}
          </div>
          <div
            style={{ flex: 1.2, background: "var(--b-paper)", border: "1px solid var(--b-line)", borderLeft: "3px solid var(--b-accent)", borderRadius: "0 10px 10px 0", padding: "16px 20px" }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, color: "var(--b-accent)" }}>
              The influential core · who moves them
            </div>
            <div className="serif" style={{ fontSize: 23, fontWeight: 500, lineHeight: 1.1 }}>
              {core?.coreName ?? report.signalsSnapshot?.coreLabel ?? "The Influential Core"}
            </div>
            {core?.coreTagline && (
              <div className="serif" style={{ fontStyle: "italic", fontSize: 15, color: "var(--b-ink2)", margin: "4px 0 10px" }}>
                {core.coreTagline}
              </div>
            )}
            <div style={{ fontSize: 13, color: "var(--b-ink2)", lineHeight: 1.5 }}>
              {contrast ? (
                <>
                  <b style={{ color: "var(--b-ink)" }}>{contrast.core}</b>{" "}
                </>
              ) : null}
              The base copies this group's recommendations — <b style={{ color: "var(--b-ink)" }}>reach them and the audience follows</b>.
            </div>
          </div>
        </div>
      </div>

      {/* ── 02 ── */}
      {chips.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <BlockHead num="02" title="How to find them in media" link="full chapter →" onNavigate={() => onNavigate("ch2")} />
          <ChipRow>
            {chips.map((c, i) => (
              <Chip key={i} core={c.core}>
                <b>{c.label}</b>
                {c.detail ? ` ${c.detail}` : ""}
              </Chip>
            ))}
          </ChipRow>
          <div style={{ fontSize: 11.5, color: "var(--b-ink3)", marginTop: 9 }}>
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, verticalAlign: -1, background: "var(--b-accent-soft)", border: "1px solid var(--b-accent)", marginRight: 4 }} />
            core signals — precise, trusted, cheap
            <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, verticalAlign: -1, background: "var(--b-paper)", border: "1px solid var(--b-line)", margin: "0 4px 0 10px" }} />
            reach signals — broad, scaled
          </div>
        </div>
      )}

      {/* ── 03 ── */}
      {(world.length > 0 || online.length > 0) && (
        <div style={{ marginBottom: 28 }}>
          <BlockHead num="03" title="Where to find them" link="full chapter →" onNavigate={() => onNavigate("ch3")} />
          <Cols2>
            <Card title="In the world"><LineList lines={world} /></Card>
            <Card title="Online"><LineList lines={online} /></Card>
          </Cols2>
        </div>
      )}

      {/* ── 04 ── */}
      {(works.length > 0 || backfires.length > 0) && (
        <div style={{ marginBottom: 28 }}>
          <BlockHead num="04" title="How to move them" link="full chapter →" onNavigate={() => onNavigate("ch4")} />
          <Cols2>
            <Card title="What works"><LineList lines={works} /></Card>
            <Card title="What backfires"><LineList lines={backfires} /></Card>
          </Cols2>
        </div>
      )}

      {/* ── 05 ── */}
      {engage.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <BlockHead num="05" title="How to engage them" link="full chapter →" onNavigate={() => onNavigate("ch5")} />
          <ChipRow>
            {engage.map((c, i) => (
              <Chip key={i}><b>{c.label}</b></Chip>
            ))}
          </ChipRow>
        </div>
      )}

      {/* ── 06 ── */}
      {adjacent.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <BlockHead num="06" title="Who they're next to" link="full chapter →" onNavigate={() => onNavigate("ch6")} />
          <ChipRow>
            {adjacent.map((c, i) => (
              <Chip key={i}>
                <b>{c.label}</b>
                {c.detail ? ` — ${c.detail}` : ""}
              </Chip>
            ))}
          </ChipRow>
        </div>
      )}

      {/* ── Verdict strip — the Story's strategic lever, extracted verbatim.
            Extraction failure → omitted entirely, never synthesized. ── */}
      {lever && (
        <div
          className="serif"
          style={{ background: "var(--b-ink)", color: "var(--b-paper)", borderRadius: 12, padding: "18px 24px", fontSize: 17.5, lineHeight: 1.5, margin: "34px 0" }}
        >
          {lever}
        </div>
      )}
    </div>
  );
}
