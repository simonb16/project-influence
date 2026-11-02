"use client";

import { useEffect, useState } from "react";
import { ArchetypeReport } from "@/types";
import { verifierDisplay } from "./verifierDisplay";
import { SummaryPage } from "./SummaryPage";
import { Ch01Who } from "./Ch01Who";
import { Ch02Media } from "./Ch02Media";
import { Ch03Where } from "./Ch03Where";
import { Ch04Move } from "./Ch04Move";
import { Ch05Engage } from "./Ch05Engage";
import { Ch06Adjacent } from "./Ch06Adjacent";
import { EvidencePage } from "./EvidencePage";
import { RetiredPage } from "./RetiredPage";
import { InputsPage } from "./InputsPage";
import { CulturalPage } from "./CulturalPage";
import { PlanPage } from "./PlanPage";

// Round 11A: the briefing view — the six-question restructure over the same
// pipeline output. Post-Round-9 reports render here; pre-Round-9 reports keep
// the legacy dark ReportView untouched. Page-per-chapter: each chapter is its
// own view, switch scrolls to top, Summary is the landing view.

export type BriefingPageId =
  | "summary"
  | "ch1"
  | "ch2"
  | "ch3"
  | "ch4"
  | "ch5"
  | "ch6"
  | "ch7"
  | "evidence"
  | "retired"
  | "inputs"
  | "cultural";

const CHAPTERS: Array<{ id: BriefingPageId; num: string; label: string }> = [
  { id: "summary", num: "S", label: "Summary" },
  { id: "ch1", num: "01", label: "Who are they" },
  { id: "ch2", num: "02", label: "How to find them in media" },
  { id: "ch3", num: "03", label: "Where to find them" },
  { id: "ch4", num: "04", label: "How to move them" },
  { id: "ch5", num: "05", label: "How to engage them" },
  { id: "ch6", num: "06", label: "Who they're next to" },
  { id: "ch7", num: "07", label: "The plan" },
];

// "Cultural context" is a provisional utility home: the Cultural tab's
// sections (culturalDiscourse, culturalDepthCheck) are not covered by the
// Round 11A mapping table — parked here rather than dropped or force-fit,
// flagged for the next brief.
const UTILITIES: Array<{ id: BriefingPageId; label: string }> = [
  { id: "evidence", label: "Evidence & sources" },
  { id: "cultural", label: "Cultural context" },
  { id: "retired", label: "Retired sections" },
  { id: "inputs", label: "Report inputs" },
];

export function BriefingView({
  report,
  reportId,
  onReset,
}: {
  report: ArchetypeReport;
  reportId: string;
  onReset: () => void;
}) {
  const [page, setPage] = useState<BriefingPageId>("summary");
  const vd = verifierDisplay(report.verifierReport);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="briefing-root" style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Sidebar spine ── */}
      <nav
        style={{
          width: 250,
          flexShrink: 0,
          borderRight: "1px solid var(--b-line)",
          padding: "26px 20px",
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={onReset}
          style={{
            font: "600 13px var(--font-hanken)",
            letterSpacing: "0.2em",
            marginBottom: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--b-ink)",
            textAlign: "left",
            padding: 0,
          }}
        >
          SWAY
        </button>
        <div className="serif" style={{ fontSize: 17, fontStyle: "italic", color: "var(--b-ink2)", marginBottom: 26 }}>
          {report.archetype}
        </div>
        <ul style={{ listStyle: "none", flex: 1, margin: 0, padding: 0 }}>
          {CHAPTERS.map((ch) => {
            const on = page === ch.id;
            return (
              <li key={ch.id} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => setPage(ch.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    color: on ? "var(--b-accent)" : "var(--b-ink2)",
                    background: on ? "var(--b-accent-soft)" : "transparent",
                    fontWeight: on ? 600 : 400,
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                >
                  <span className="mono" style={{ fontSize: 10.5, marginRight: 8, color: "var(--b-ink3)" }}>
                    {ch.num}
                  </span>
                  {ch.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div style={{ borderTop: "1px solid var(--b-line)", paddingTop: 14, fontSize: 12.5, color: "var(--b-ink3)" }}>
          {UTILITIES.map((u) => (
            <button
              key={u.id}
              onClick={() => setPage(u.id)}
              style={{
                color: page === u.id ? "var(--b-accent)" : "var(--b-ink3)",
                display: "block",
                padding: "3px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12.5,
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              {u.label}
            </button>
          ))}
          {vd && (
            <div
              style={{
                color: vd.verified ? "var(--b-good)" : vd.failCount > 0 ? "#A33D3D" : "#8A6D3B",
                fontWeight: 600,
                fontSize: 12,
                marginTop: 8,
              }}
            >
              {vd.footer}
            </div>
          )}
        </div>
      </nav>

      {/* ── Active page ── */}
      <main style={{ flex: 1, maxWidth: 920, padding: "44px 56px 90px" }}>
        {page === "summary" && <SummaryPage report={report} onNavigate={setPage} />}
        {page === "ch1" && <Ch01Who report={report} />}
        {page === "ch2" && <Ch02Media report={report} onNavigate={setPage} />}
        {page === "ch3" && <Ch03Where report={report} />}
        {page === "ch4" && <Ch04Move report={report} />}
        {page === "ch5" && <Ch05Engage report={report} />}
        {page === "ch6" && <Ch06Adjacent report={report} />}
        {page === "ch7" && <PlanPage report={report} reportId={reportId} />}
        {page === "evidence" && <EvidencePage report={report} />}
        {page === "retired" && <RetiredPage report={report} />}
        {page === "inputs" && <InputsPage report={report} reportId={reportId} />}
        {page === "cultural" && <CulturalPage report={report} />}
      </main>
    </div>
  );
}
