"use client";

import { useState } from "react";
import { ArchetypeReport, ManualInputs, ManualPlanReach, PlanLine } from "@/types";
import { getEmail } from "@/lib/storage";
import { ChapterHeader, EvidenceDisclosure, MutedNote, Row, RowGroup } from "./primitives";

// Round 11B Parts 2/4/5: chapter 07 — the media-plan scaffold. Everything on
// this page renders existing plan/report JSON; the only writes are the manual
// per-line reach values and the split override (the 11A slot-not-plumbing
// pattern). Authorship boundary: no budget dollars, no flighting dates, no
// creative copy anywhere on this page.

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Resolve a sourceSignalId to a human-readable evidence excerpt. */
function resolveSource(report: ArchetypeReport, id: string): { title: string; excerpt: string } | null {
  const sig = (report.socialSignals ?? []).find((s) => s.id === id);
  if (sig) return { title: sig.signal, excerpt: sig.evidence || sig.body };
  const bucket = (report.behavioralBuckets ?? []).find((b) => b.id === id);
  if (bucket) return { title: bucket.signal, excerpt: bucket.whatItSignals };
  const ds = (report.dataSignals?.signals ?? []).find((d) => d.id === id);
  if (ds) return { title: ds.subject ?? id, excerpt: `${ds.metric ?? ""} — ${ds.finding ?? ""}`.trim() };
  return null;
}

function RoleChip({ role }: { role: PlanLine["role"] }) {
  const core = role === "core-seed";
  return (
    <span
      className="mono"
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.13em",
        padding: "3px 7px",
        borderRadius: 4,
        border: `1px solid ${core ? "var(--b-accent)" : "var(--b-line)"}`,
        background: core ? "var(--b-accent-soft)" : "var(--b-paper)",
        color: core ? "var(--b-accent)" : "var(--b-ink3)",
      }}
    >
      {core ? "CORE SEED" : "REACH"}
    </span>
  );
}

/** Per-line manual reach: value + basis + date when entered; a dashed
 * "add from platform" affordance with an inline form when not. */
function ReachBlock({
  line,
  reach,
  reportId,
  onSaved,
}: {
  line: PlanLine;
  reach?: ManualPlanReach;
  reportId: string;
  onSaved: (m: ManualInputs) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(reach?.value ?? "");
  const [date, setDate] = useState(reach?.dateChecked ?? todayIso());
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planReach: { lineId: line.id, value, dateChecked: date, enteredBy: getEmail() || undefined },
        }),
      });
      if (res.ok) {
        const body = await res.json();
        onSaved(body.manualInputs);
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 8, fontSize: 13 }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.13em", color: "var(--b-ink3)" }}>
        REACH ·{" "}
      </span>
      {reach && !editing ? (
        <>
          <b style={{ color: "var(--b-ink)" }}>{reach.value}</b>{" "}
          <span style={{ color: "var(--b-ink3)" }}>
            {line.reachBasis} · {reach.dateChecked}
          </span>{" "}
          <button
            onClick={() => setEditing(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--b-ink3)", padding: 0 }}
            title="Edit reach"
          >
            ✎
          </button>
        </>
      ) : editing ? (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 1.2M"
            style={{ width: 90, fontSize: 12.5, padding: "2px 6px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-paper)" }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ fontSize: 12.5, padding: "2px 6px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-paper)" }}
          />
          <button onClick={save} disabled={busy} style={{ fontSize: 12, color: "var(--b-accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            {busy ? "…" : "save"}
          </button>
          <button onClick={() => setEditing(false)} style={{ fontSize: 12, color: "var(--b-ink3)", background: "none", border: "none", cursor: "pointer" }}>
            cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{
            fontSize: 12.5,
            color: "var(--b-ink3)",
            background: "none",
            border: "1px dashed var(--b-line)",
            borderRadius: 4,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          add from platform · {line.reachBasis}
        </button>
      )}
    </div>
  );
}

function PlanLineRow({
  line,
  report,
  reportId,
  reach,
  onSaved,
}: {
  line: PlanLine;
  report: ArchetypeReport;
  reportId: string;
  reach?: ManualPlanReach;
  onSaved: (m: ManualInputs) => void;
}) {
  const sources = line.sourceSignalIds.map((id) => ({ id, resolved: resolveSource(report, id) }));
  return (
    <Row title={line.channel} line={line.targetingStack} strength={reach?.value ?? "—"}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <RoleChip role={line.role} />
      </div>
      <p>{line.rationale}</p>
      <p style={{ marginTop: 6, fontSize: 13 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.13em", color: "var(--b-ink3)" }}>TARGETING · </span>
        {line.targetingStack}
      </p>
      {line.doAvoid && (
        <p style={{ marginTop: 6, fontSize: 13 }}>
          <b>Do / avoid:</b> {line.doAvoid}
        </p>
      )}
      <ReachBlock line={line} reach={reach} reportId={reportId} onSaved={onSaved} />
      <EvidenceDisclosure srcLine={`${sources.length} source signal${sources.length === 1 ? "" : "s"} — the traceability contract`}>
        {sources.map(({ id, resolved }) =>
          resolved ? (
            <p key={id} style={{ marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--b-ink3)" }}>{id}</span> <b>{resolved.title}</b> — {resolved.excerpt}
            </p>
          ) : (
            <p key={id} style={{ marginTop: 4, color: "#A33D3D" }}>
              <span className="mono" style={{ fontSize: 10.5 }}>{id}</span> — does not resolve (the Verifier flags this)
            </p>
          )
        )}
      </EvidenceDisclosure>
    </Row>
  );
}

/** Part 4: the split hypothesis as the plan's thesis. The system's proposal
 * is never silently overwritten — an override renders beside it, attributed. */
function SplitBlock({
  report,
  reportId,
  manual,
  onSaved,
}: {
  report: ArchetypeReport;
  reportId: string;
  manual?: ManualInputs;
  onSaved: (m: ManualInputs) => void;
}) {
  const split = report.plan!.splitHypothesis;
  const override = manual?.splitOverride;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(override?.value ?? "");
  const [note, setNote] = useState(override?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splitOverride: { value, note: note || undefined, dateChecked: todayIso(), enteredBy: getEmail() || undefined },
        }),
      });
      if (res.ok) {
        const body = await res.json();
        onSaved(body.manualInputs);
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{ background: "var(--b-paper)", border: "1px solid var(--b-line)", borderLeft: "3px solid var(--b-accent)", borderRadius: "0 10px 10px 0", padding: "18px 22px", margin: "24px 0 30px" }}
    >
      <div className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>
        {split.coreSharePct.low}–{split.coreSharePct.high}% of spend to core-seeding
      </div>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "var(--b-ink3)", margin: "6px 0 10px" }}>
        A STARTING HYPOTHESIS — RESOLVED BY TESTING, NOT ASSERTED
      </div>
      <p style={{ fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.55, maxWidth: 620 }}>{split.rationale}</p>

      {override && (
        <p style={{ marginTop: 10, fontSize: 13.5, color: "var(--b-ink)" }}>
          <b>Adjusted to {override.value}</b>
          {override.note ? ` — ${override.note}` : ""}{" "}
          <span style={{ color: "var(--b-ink3)" }}>
            · adjusted by {override.enteredBy ?? "unattributed"} · {override.dateChecked}
          </span>
        </p>
      )}

      {editing ? (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 20–30%"
            style={{ width: 100, fontSize: 12.5, padding: "3px 7px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-bg)" }}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="note (why the adjustment)"
            style={{ width: 260, fontSize: 12.5, padding: "3px 7px", border: "1px solid var(--b-line)", borderRadius: 4, background: "var(--b-bg)" }}
          />
          <button onClick={save} disabled={busy} style={{ fontSize: 12.5, color: "var(--b-accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            {busy ? "…" : "save"}
          </button>
          <button onClick={() => setEditing(false)} style={{ fontSize: 12.5, color: "var(--b-ink3)", background: "none", border: "none", cursor: "pointer" }}>
            cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ marginTop: 10, fontSize: 12.5, color: "var(--b-ink3)", background: "none", border: "1px dashed var(--b-line)", borderRadius: 4, padding: "3px 9px", cursor: "pointer" }}
        >
          ✎ {override ? "re-adjust" : "adjust the split"} (attributed, original stays visible)
        </button>
      )}
    </div>
  );
}

export function PlanPage({ report, reportId }: { report: ArchetypeReport; reportId: string }) {
  const [manual, setManual] = useState<ManualInputs | undefined>(report.manualInputs);
  const plan = report.plan;

  const onSaved = (m: ManualInputs) => {
    report.manualInputs = m; // keep the in-memory report consistent (11A pattern)
    setManual({ ...m });
  };

  if (!plan) {
    return (
      <div>
        <ChapterHeader
          num="07"
          title="The plan"
          tagline="From signals to spend — where to show up first, and why."
          useIt="take the report to your platforms."
        />
        <MutedNote>The plan is generated at run time — re-run this audience to produce one.</MutedNote>
      </div>
    );
  }

  const coreLines = plan.lines.filter((l) => l.role === "core-seed");
  const reachLines = plan.lines.filter((l) => l.role === "reach");

  return (
    <div>
      <ChapterHeader
        num="07"
        title="The plan"
        tagline="From signals to spend — where to show up first, and why."
        useIt="take the report to your platforms."
        absorbs="plan object (synthesis, 11B) · drivers/backfires as messaging inputs · targetables as targeting stacks"
      />

      <p className="serif" style={{ fontSize: 21, fontStyle: "italic", color: "var(--b-ink)", lineHeight: 1.4, maxWidth: 680, marginBottom: 4 }}>
        {plan.soWhat}
      </p>

      <SplitBlock report={report} reportId={reportId} manual={manual} onSaved={onSaved} />

      {coreLines.length > 0 && (
        <RowGroup head="Core-seed lines — precise, cheap to saturate, where the core actually lives">
          {coreLines.map((l) => (
            <PlanLineRow key={l.id} line={l} report={report} reportId={reportId} reach={manual?.planReach?.[l.id]} onSaved={onSaved} />
          ))}
        </RowGroup>
      )}

      <RowGroup head="Reach lines — the broad inventory">
        {reachLines.map((l) => (
          <PlanLineRow key={l.id} line={l} report={report} reportId={reportId} reach={manual?.planReach?.[l.id]} onSaved={onSaved} />
        ))}
        {reachLines.length === 0 && (
          <MutedNote>No reach lines — the reach side ships honestly thin; it thickens in the base-reach round.</MutedNote>
        )}
      </RowGroup>
      {reachLines.length > 0 && reachLines.length <= 2 && (
        <p style={{ fontSize: 12.5, color: "var(--b-ink3)", marginTop: 6 }}>
          The reach side ships honestly thin — it thickens in the base-reach round.
        </p>
      )}

      {plan.sequencing.length > 0 && (
        <RowGroup head="Sequencing">
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.7 }}>
            {plan.sequencing.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </RowGroup>
      )}

      {plan.messagingInputs.length > 0 && (
        <RowGroup head="Messaging inputs — inputs for creative, not copy">
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.7 }}>
            {plan.messagingInputs.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </RowGroup>
      )}

      {plan.measurementSignals.length > 0 && (
        <RowGroup head="Measurement signals — what to watch per line class">
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--b-ink2)", lineHeight: 1.7 }}>
            {plan.measurementSignals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </RowGroup>
      )}
    </div>
  );
}
