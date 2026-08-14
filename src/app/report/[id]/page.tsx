"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchetypeReport } from "@/types";
import { ReportView } from "@/components/report/ReportView";

// Direct-linkable report route (Round 7, Part 4) — what completion emails
// point at. Fetches the report fresh from the server rather than relying on
// any client-side state, so the link works from a cold browser.
export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ArchetypeReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) setError(body.error || `Report not found (${res.status})`);
          return;
        }
        const data: ArchetypeReport = await res.json();
        if (!cancelled) setReport(data);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#080B0F]">
      <nav className="sticky top-0 z-10 border-b border-[#1C2333] bg-[#080B0F]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[#6366F1]">◈</span>
            <button
              onClick={() => router.push("/")}
              className="font-semibold tracking-tight text-[#E8EDF2] hover:text-white"
            >
              Project Sway
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {error && (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <span className="mb-4 text-4xl text-red-500">✕</span>
            <h2 className="mb-2 text-lg font-semibold text-[#E8EDF2]">Report not found</h2>
            <p className="mb-6 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#818CF8]"
            >
              Back to Project Sway
            </button>
          </div>
        )}

        {!error && !report && (
          <div className="flex min-h-[400px] items-center justify-center text-sm text-[#6E7681]">
            Loading report...
          </div>
        )}

        {report && <ReportView report={report} onReset={() => router.push("/")} />}
      </main>
    </div>
  );
}
