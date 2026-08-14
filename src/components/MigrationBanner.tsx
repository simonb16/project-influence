"use client";

import { useState } from "react";
import { SavedReport } from "@/lib/storage";

interface MigrationBannerProps {
  unimported: SavedReport[];
  runBy: string;
  onImported: (ids: string[]) => void;
}

export function MigrationBanner({ unimported, runBy, onImported }: MigrationBannerProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unimported.length === 0) return null;

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runBy,
          reports: unimported.map((r) => ({ id: r.id, report: r.report })),
        }),
      });
      if (!res.ok) throw new Error(`Import failed (${res.status})`);
      const { imported, skipped }: { imported: string[]; skipped: string[] } = await res.json();
      onImported([...imported, ...skipped]);
    } catch {
      setError("Import failed — try again in a moment.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto mb-8 max-w-2xl rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#C7D2FE]">
          You have {unimported.length} report{unimported.length === 1 ? "" : "s"} stored locally — import
          {unimported.length === 1 ? " it" : " them"} to the shared library?
        </p>
        <button
          onClick={handleImport}
          disabled={importing}
          className="shrink-0 rounded-lg bg-[#6366F1] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#818CF8] disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
