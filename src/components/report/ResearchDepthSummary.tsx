"use client";

import { useState } from "react";
import { ArchetypeReport, VerifierCheck } from "@/types";

// One-line report provenance: "6 agents · X web searches · analyzed [date]".
// Search counts aren't tracked by the three-lens pipeline (legacy reports
// carried searchQueriesRun), so the middle segment is conditional.
// Round 8: reports carrying a verifierReport append "· ✓ N/M integrity
// checks" — clicking expands a compact per-check panel. Quiet infrastructure:
// no banner, no badge anywhere else. Old reports render the line unchanged.

const STATUS_STYLES: Record<VerifierCheck["status"], { row: string; mark: string }> = {
  pass: { row: "text-[#6E7681]", mark: "✓" },
  warn: { row: "text-amber-400/90", mark: "⚠" },
  fail: { row: "text-red-400", mark: "✕" },
};

export function ResearchDepthSummary({ report }: { report: ArchetypeReport }) {
  const [expanded, setExpanded] = useState(false);

  const isThreeLens = !!report.researchDepth?.lensesUsed;
  const verifier = report.verifierReport;
  // Round 8 pipeline runs 8 agents (3 lenses + reconciliation + synthesis +
  // periphery + enrichment + verifier); earlier three-lens reports ran 6.
  const agentCount = verifier ? 8 : isThreeLens ? 6 : 7;
  const searchCount = report.researchDepth?.searchQueriesRun;

  const analyzed = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const parts = [
    `${agentCount} agents`,
    ...(searchCount ? [`${searchCount} web searches`] : []),
    `analyzed ${analyzed}`,
  ];

  if (!verifier) {
    return <p className="px-1 text-[11px] text-[#6E7681]">{parts.join(" · ")}</p>;
  }

  const allClean = verifier.passCount === verifier.totalCount;

  return (
    <div className="px-1">
      <p className="text-[11px] text-[#6E7681]">
        {parts.join(" · ")}
        {" · "}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`underline decoration-dotted underline-offset-2 transition-colors hover:text-[#8B949E] ${allClean ? "" : "text-amber-400/80"}`}
          title={verifier.summary}
        >
          {allClean ? "✓" : "⚠"} {verifier.passCount}/{verifier.totalCount} integrity checks
        </button>
      </p>

      {expanded && (
        <div className="mt-2 max-w-2xl rounded-lg border border-[#1C2333] bg-[#0D1117] p-3">
          <div className="space-y-1">
            {verifier.checks.map((c) => {
              const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.pass;
              return (
                <div key={c.id} className={`flex items-baseline gap-2 text-[11px] ${s.row}`}>
                  <span className="w-3 shrink-0 text-center">{s.mark}</span>
                  <span className="w-44 shrink-0 font-mono text-[10px] tracking-wide">{c.id}</span>
                  <span className="min-w-0">{c.detail}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 border-t border-[#1C2333] pt-2 text-[10px] text-[#3D444D]">
            {verifier.summary} Ran {new Date(verifier.ranAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
          </p>
        </div>
      )}
    </div>
  );
}
