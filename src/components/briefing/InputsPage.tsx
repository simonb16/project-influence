"use client";

import { useState } from "react";
import { ArchetypeReport, ManualInputs, ManualPlatformReach, PlanLine } from "@/types";
import { getEmail } from "@/lib/storage";
import { Card, MutedNote } from "./primitives";

// Report inputs (utility) — the run's inputs plus the Part 6 manual-entry
// field: platform reach (platform + value + date checked). Persisted inside
// report_json via the minimal update endpoint; rendered in the Summary header
// stat with its basis label and date.

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--b-line)",
  background: "var(--b-paper)",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 13.5,
  color: "var(--b-ink)",
  fontFamily: "inherit",
  width: "100%",
};

export function InputsPage({ report, reportId }: { report: ArchetypeReport; reportId: string }) {
  const [reach, setReach] = useState<ManualPlatformReach | undefined>(report.manualInputs?.platformReach);
  const [platform, setPlatform] = useState(reach?.platform ?? "");
  const [value, setValue] = useState(reach?.value ?? "");
  const [dateChecked, setDateChecked] = useState(reach?.dateChecked ?? new Date().toISOString().slice(0, 10));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch(`/api/reports/${reportId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformReach: { platform, value, dateChecked } }),
      });
      if (!res.ok) throw new Error();
      const body = await res.json();
      // Keep the in-memory report consistent so the Summary stat reflects the
      // save without a reload.
      report.manualInputs = body.manualInputs;
      setReach(body.manualInputs.platformReach);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <div className="b-kicker" style={{ marginBottom: 10 }}>Utility</div>
      <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, marginBottom: 4 }}>Report inputs</h1>
      <p className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--b-ink2)", marginBottom: 30 }}>
        What this report was asked, and the hand-entered values it carries.
      </p>

      <Card title="Run inputs">
        <ul style={{ margin: 0, padding: 0 }}>
          <li><b>Audience</b> — {report.audience ?? report.query ?? "—"}</li>
          {report.brand && <li><b>Brand</b> — {report.brand}</li>}
          {report.context && <li><b>Context</b> — {report.context}</li>}
          <li><b>Generated</b> — {new Date(report.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</li>
        </ul>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Card title="Platform reach — manual entry">
          <p style={{ fontSize: 12.5, color: "var(--b-ink3)", marginBottom: 12 }}>
            Read the audience-size estimate off the platform (e.g. Ads Manager) and record it here. It renders in the
            Summary header with its basis label and date — no validation, stored as entered.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <label style={{ fontSize: 11, color: "var(--b-ink3)" }}>
              Platform
              <input style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Meta Ads Manager" />
            </label>
            <label style={{ fontSize: 11, color: "var(--b-ink3)" }}>
              Value
              <input style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)} placeholder="~4.2M" />
            </label>
            <label style={{ fontSize: 11, color: "var(--b-ink3)" }}>
              Date checked
              <input style={inputStyle} type="date" value={dateChecked} onChange={(e) => setDateChecked(e.target.value)} />
            </label>
            <button
              onClick={save}
              disabled={state === "saving" || !platform.trim() || !value.trim() || !dateChecked.trim()}
              style={{
                background: "var(--b-accent)",
                color: "var(--b-paper)",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {state === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          {state === "saved" && <p style={{ fontSize: 12.5, color: "var(--b-good)", marginTop: 8 }}>Saved — the Summary header stat now carries it.</p>}
          {state === "error" && <p style={{ fontSize: 12.5, color: "#A33D3D", marginTop: 8 }}>Save failed — try again.</p>}
          {reach && state !== "saved" && (
            <p className="mono" style={{ fontSize: 11, color: "var(--b-ink3)", marginTop: 10 }}>
              current: {reach.value} · {reach.platform} · checked {reach.dateChecked}
            </p>
          )}
        </Card>
      </div>

      {(report.plan?.lines?.length ?? 0) > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card title="Plan-line reach — manual entry (Round 11B)">
            <p style={{ fontSize: 12.5, color: "var(--b-ink3)", marginBottom: 12 }}>
              One value per plan line, rendered on the Plan page with the line's reach-basis label and date.
              Values from different platforms never aggregate — they count overlapping humans.
            </p>
            {report.plan!.lines.map((line) => (
              <PlanReachEntry key={line.id} line={line} report={report} reportId={reportId} />
            ))}
          </Card>
        </div>
      )}

      <MutedNote>Slot, not plumbing — if this field earns its keep by hand, Round 11C automates it.</MutedNote>
    </div>
  );
}

function PlanReachEntry({ line, report, reportId }: { line: PlanLine; report: ArchetypeReport; reportId: string }) {
  const [current, setCurrent] = useState(report.manualInputs?.planReach?.[line.id]);
  const [value, setValue] = useState(current?.value ?? "");
  const [date, setDate] = useState(current?.dateChecked ?? new Date().toISOString().slice(0, 10));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch(`/api/reports/${reportId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planReach: { lineId: line.id, value, dateChecked: date, enteredBy: getEmail() || undefined },
        }),
      });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { manualInputs: ManualInputs };
      report.manualInputs = body.manualInputs;
      setCurrent(body.manualInputs.planReach?.[line.id]);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--b-line)", fontSize: 13 }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ color: "var(--b-ink)" }}>{line.channel}</b>{" "}
        <span className="mono" style={{ fontSize: 10, color: "var(--b-ink3)" }}>· {line.reachBasis}</span>
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="value"
        style={{ width: 90, fontSize: 12.5, padding: "3px 7px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-paper)", fontFamily: "inherit" }}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ fontSize: 12.5, padding: "3px 7px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-paper)", fontFamily: "inherit" }}
      />
      <button
        onClick={save}
        disabled={state === "saving" || !value.trim()}
        style={{ fontSize: 12.5, color: "var(--b-accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        {state === "saving" ? "…" : state === "saved" ? "saved ✓" : current ? "update" : "save"}
      </button>
      {state === "error" && <span style={{ fontSize: 12, color: "#A33D3D" }}>failed</span>}
    </div>
  );
}
