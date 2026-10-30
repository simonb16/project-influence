"use client";

import { ArchetypeReport, VerifierCheck } from "@/types";
import { Card, EvidenceDisclosure, MutedNote, Row, RowGroup } from "./primitives";
import { displayTier, verifierDisplay } from "./verifierDisplay";

// Evidence & sources (utility) — absorbs the Data Signals / Signal Check
// section, research-depth metadata, the Verifier panel (Part 5 display
// tiering), the attribution-tier legend, and the research sources.

const SOURCE_LABELS: Record<string, string> = {
  google_trends: "Google Trends",
  reddit: "Reddit",
  youtube: "YouTube",
  pinterest: "Pinterest",
  web_search: "Web search",
};

const TIER_STYLE: Record<string, { color: string; mark: string }> = {
  fail: { color: "#A33D3D", mark: "✕" },
  warn: { color: "#8A6D3B", mark: "⚠" },
  note: { color: "var(--b-ink3)", mark: "·" },
  pass: { color: "var(--b-good)", mark: "✓" },
};

function CheckLine({ check }: { check: VerifierCheck }) {
  const tier = displayTier(check);
  const s = TIER_STYLE[tier];
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderTop: "1px solid var(--b-line)", fontSize: 12.5 }}>
      <span style={{ color: s.color, width: 14, flexShrink: 0, textAlign: "center" }}>{s.mark}</span>
      <span className="mono" style={{ fontSize: 10.5, width: 190, flexShrink: 0, color: "var(--b-ink2)" }}>{check.id}</span>
      <span style={{ color: tier === "fail" ? s.color : "var(--b-ink2)", fontWeight: tier === "fail" ? 600 : 400 }}>
        {check.detail}
      </span>
    </div>
  );
}

export function EvidencePage({ report }: { report: ArchetypeReport }) {
  const verifier = report.verifierReport;
  const vd = verifierDisplay(verifier);
  const checks = verifier?.checks ?? [];
  const fails = checks.filter((c) => displayTier(c) === "fail");
  const warns = checks.filter((c) => displayTier(c) === "warn");
  const notes = checks.filter((c) => displayTier(c) === "note");
  const passes = checks.filter((c) => displayTier(c) === "pass");
  const ds = report.dataSignals;
  const rd = report.researchDepth;

  return (
    <div>
      <div className="b-kicker" style={{ marginBottom: 10 }}>Utility</div>
      <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, marginBottom: 4 }}>Evidence &amp; sources</h1>
      <p className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--b-ink2)", marginBottom: 30 }}>
        What the numbers rest on — platform data, research depth, and the integrity audit.
      </p>

      {/* ── Attribution-tier legend ── */}
      <Card title="How numbers are attributed in this report">
        <ul style={{ margin: 0, padding: 0 }}>
          <li><b>Tool-API</b> — returned by a platform API call (Trends, YouTube, Reddit); traces to the run's tool log</li>
          <li><b>Search-sourced</b> — returned by web search during reconciliation; traced and labeled “per web search”</li>
          <li><b>Lens-attributed</b> — carried from lens research with a named, checkable source; the attribution is the verification</li>
        </ul>
      </Card>

      {/* ── Verifier panel (Part 5 display tiering — logic untouched) ── */}
      {verifier && vd && (
        <div style={{ marginTop: 16 }}>
          <Card title={`Integrity audit · ${vd.footer}`}>
            {fails.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#A33D3D", marginBottom: 2 }}>
                  FAILED — this report is not for external use; re-run it. Runs are cheap; the norm is absolute.
                </p>
                {fails.map((c) => <CheckLine key={c.id} check={c} />)}
              </div>
            )}
            {warns.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#8A6D3B", marginBottom: 2 }}>Integrity warnings</p>
                {warns.map((c) => <CheckLine key={c.id} check={c} />)}
              </div>
            )}
            {passes.map((c) => <CheckLine key={c.id} check={c} />)}
            {notes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11.5, color: "var(--b-ink3)", marginBottom: 2 }}>
                  Notes — known-benign categories (derivation tolerance, designed degradation); excluded from the footer count
                </p>
                {notes.map((c) => <CheckLine key={c.id} check={c} />)}
              </div>
            )}
            <p className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)", marginTop: 10 }}>
              {vd.summaryLine} · ran {new Date(verifier.ranAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </Card>
        </div>
      )}

      {/* ── Data signals ── */}
      {ds && ds.signals.length > 0 && (
        <RowGroup head="Data signals — validated platform data from the tool loop">
          {ds.collectiveFinding && (
            <p style={{ fontSize: 13.5, color: "var(--b-ink2)", marginBottom: 10, maxWidth: 640 }}>{ds.collectiveFinding}</p>
          )}
          {ds.signals.map((s, i) => (
            <Row key={i} title={s.metric} line={`${s.subject} — ${s.finding}`} strength={SOURCE_LABELS[s.source] ?? s.source}>
              <p>{s.finding}</p>
              <p style={{ marginTop: 6 }}>{s.significance}</p>
              <EvidenceDisclosure summary="What this validates" srcLine={`${SOURCE_LABELS[s.source] ?? s.source} · ${s.signalType}`}>
                {s.validates}
              </EvidenceDisclosure>
            </Row>
          ))}
          <p className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)", marginTop: 8 }}>
            sources queried: {ds.dataSources.join(", ") || "—"}
            {ds.unavailableSources.length > 0 && ` · unavailable: ${ds.unavailableSources.join(", ")}`}
          </p>
        </RowGroup>
      )}

      {/* ── Research depth metadata ── */}
      {rd && (
        <div style={{ marginTop: 26 }}>
          <Card title="Research depth">
            <ul style={{ margin: 0, padding: 0 }}>
              {rd.lensesUsed && <li><b>Lenses</b> — {rd.lensesUsed.join(", ")}</li>}
              {rd.totalSignalsScored != null && <li><b>Signals scored</b> — {rd.totalSignalsScored}</li>}
              {rd.convergedFindings != null && (
                <li><b>Convergence</b> — {rd.convergedFindings} converged · {rd.conflictedFindings ?? 0} conflicted · {rd.singleLensFindings ?? 0} single-lens</li>
              )}
              {rd.highConfidenceFindings != null && <li><b>High-confidence findings</b> — {rd.highConfidenceFindings}</li>}
              {rd.searchQueriesRun != null && <li><b>Search queries</b> — {rd.searchQueriesRun}</li>}
              <li><b>Generated</b> — {new Date(report.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</li>
            </ul>
          </Card>
        </div>
      )}

      {/* ── Research sources ── */}
      {(report.rankedSources?.length || report.sources?.length) ? (
        <RowGroup head="Research sources">
          {(report.rankedSources ?? []).map((s, i) => (
            <Row key={`r${i}`} title={s.name} line={`${s.platform} · ${s.audienceRelevance}`} strength={String(s.signalStrength)}>
              <p>
                <b>Type:</b> {s.type} · <b>Signal strength:</b> {s.signalStrength}
              </p>
              <p style={{ marginTop: 4 }}>{s.audienceRelevance}</p>
            </Row>
          ))}
          {(report.sources ?? []).map((s, i) => (
            <Row key={`s${i}`} title={s.platform} line={s.description}>
              <p>{s.description}</p>
              <p style={{ marginTop: 4 }}>{s.relevance}</p>
              {s.url && (
                <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--b-accent)", fontSize: 12.5 }}>
                  {s.url}
                </a>
              )}
            </Row>
          ))}
        </RowGroup>
      ) : null}

      {!verifier && !ds && <MutedNote>This report predates the evidence machinery.</MutedNote>}
    </div>
  );
}
