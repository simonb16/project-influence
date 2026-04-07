"use client";

import { SavedReport, deleteReport } from "@/lib/storage";
import { ArchetypeReport } from "@/types";

interface PreviousReportsProps {
  reports: SavedReport[];
  onSelect: (report: ArchetypeReport) => void;
  onDelete: (id: string) => void;
}

export function PreviousReports({ reports, onSelect, onDelete }: PreviousReportsProps) {
  if (reports.length === 0) return null;

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
        {reports.map((saved) => {
          const date = new Date(saved.generatedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          return (
            <div
              key={saved.id}
              className="group flex items-center justify-between rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-3 transition-colors hover:border-[#6366F1]/30"
            >
              <button
                onClick={() => onSelect(saved.report)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <span className="text-sm text-[#6366F1]">◈</span>
                <div>
                  <p className="text-sm font-medium text-[#E8EDF2]">{saved.archetype}</p>
                  <p className="text-xs text-[#6E7681]">{date}</p>
                </div>
              </button>
              <button
                onClick={() => onDelete(saved.id)}
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
