"use client";

import { ReportSummary, RunSummary } from "@/types";

interface ReportsListProps {
  reports: ReportSummary[];
  activeRuns: RunSummary[];
  onSelectReport: (id: string) => void;
  onWatchRun: (id: string) => void;
  onDeleteReport: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function attribution(runBy?: string): string {
  if (!runBy) return "—";
  return runBy.includes("@") ? runBy.split("@")[0] : runBy;
}

export function ReportsList({ reports, activeRuns, onSelectReport, onWatchRun, onDeleteReport }: ReportsListProps) {
  const inProgress = activeRuns.filter((r) => r.status === "queued" || r.status === "running");
  const failed = activeRuns.filter((r) => r.status === "failed");

  const rest = [
    ...failed.map((r) => ({ kind: "failed" as const, run: r })),
    ...reports.map((r) => ({ kind: "report" as const, report: r })),
  ].sort((a, b) => {
    const aTime = a.kind === "failed" ? a.run.createdAt : a.report.createdAt;
    const bTime = b.kind === "failed" ? b.run.createdAt : b.report.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  if (inProgress.length === 0 && rest.length === 0) return null;

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This removes it for everyone.`)) {
      onDeleteReport(id);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#1C2333]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E7681]">
          Previous Reports
        </span>
        <span className="h-px flex-1 bg-[#1C2333]" />
      </div>

      <div className="space-y-2">
        {inProgress.map((run) => (
          <button
            key={run.id}
            onClick={() => onWatchRun(run.id)}
            className="group flex w-full items-center gap-4 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/5 px-4 py-3 text-left transition-colors hover:border-[#6366F1]/60"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366F1] animate-pulse-glow" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#E8EDF2]">{run.title}</p>
              <p className="text-xs text-[#6E7681]">
                {run.status === "queued" ? "Queued" : "In progress"} · {formatDate(run.createdAt)} · {attribution(run.runBy)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#6366F1]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#818CF8]">
              {run.status}
            </span>
          </button>
        ))}

        {rest.map((item) => {
          if (item.kind === "failed") {
            const run = item.run;
            return (
              <button
                key={run.id}
                onClick={() => onWatchRun(run.id)}
                className="group flex w-full items-center gap-4 rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-3 text-left opacity-60 transition-colors hover:border-red-500/30 hover:opacity-100"
              >
                <span className="text-sm text-red-500">✕</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#E8EDF2]">{run.title}</p>
                  <p className="truncate text-xs text-[#6E7681]">
                    Failed · {formatDate(run.createdAt)} · {attribution(run.runBy)}
                    {run.error ? ` — ${run.error}` : ""}
                  </p>
                </div>
              </button>
            );
          }

          const report = item.report;
          return (
            <div
              key={report.id}
              className="group flex items-center justify-between rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-3 transition-colors hover:border-[#6366F1]/30"
            >
              <button
                onClick={() => onSelectReport(report.id)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <span className="text-sm text-[#6366F1]">◈</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#E8EDF2]">{report.title}</p>
                  <p className="text-xs text-[#6E7681]">
                    {formatDate(report.createdAt)} · {attribution(report.runBy)}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleDelete(report.id, report.title)}
                className="ml-4 shrink-0 text-[#374151] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                title="Delete report"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
