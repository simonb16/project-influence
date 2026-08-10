"use client";

import { useEffect } from "react";
import { ArchetypeReport } from "@/types";
import { ReportInputs } from "./ReportInputs";

// Round 6a: Report Inputs live behind the header "Inputs" button.
export function InputsModal({
  report,
  open,
  onClose,
}: {
  report: ArchetypeReport;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-9 right-0 text-xs text-[#6E7681] transition-colors hover:text-[#E8EDF2]"
          >
            ✕ close
          </button>
          <ReportInputs report={report} />
        </div>
      </div>
    </div>
  );
}
