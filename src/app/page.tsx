"use client";

import { useState, useCallback, useEffect } from "react";
import { ArchetypeReport, StreamChunk } from "@/types";
import { InputForm } from "@/components/InputForm";
import { LoadingState } from "@/components/LoadingState";
import { ReportView } from "@/components/report/ReportView";
import { PreviousReports } from "@/components/PreviousReports";
import { getSavedReports, saveReport, deleteReport, SavedReport } from "@/lib/storage";

type AppState = "input" | "loading" | "report" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("input");
  const [loadingMessage, setLoadingMessage] = useState("Initializing intelligence sweep...");
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<ArchetypeReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // Load saved reports from localStorage on mount
  useEffect(() => {
    setSavedReports(getSavedReports());
  }, []);

  const handleSubmit = useCallback(async (audience: string, brand: string, context: string) => {
    setAppState("loading");
    setLoadingStep(0);
    setLoadingMessage("Initializing intelligence sweep...");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, brand, context }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;
        try {
          const chunk: StreamChunk = JSON.parse(line);
          if (chunk.type === "heartbeat") return;
          if (chunk.type === "progress") {
            setLoadingMessage(chunk.message ?? "Processing...");
            setLoadingStep((s) => Math.min(s + 1, 9));
          } else if (chunk.type === "report" && chunk.report) {
            saveReport(chunk.report);
            setSavedReports(getSavedReports());
            setReport(chunk.report);
            setAppState("report");
          } else if (chunk.type === "error") {
            throw new Error(chunk.error ?? "Unknown error");
          }
        } catch {
          // Skip malformed chunks
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = done ? "" : (lines.pop() ?? "");
        lines.forEach(processLine);
        if (done) break;
      }

      // Flush any remaining buffer content after stream ends
      if (buffer.trim()) processLine(buffer);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState("input");
    setReport(null);
    setError(null);
    setLoadingStep(0);
  }, []);

  const handleSelectReport = useCallback((selected: ArchetypeReport) => {
    setReport(selected);
    setAppState("report");
  }, []);

  const handleDeleteReport = useCallback((id: string) => {
    deleteReport(id);
    setSavedReports(getSavedReports());
  }, []);

  // A dropped stream no longer kills the server-side run — the finished report
  // is persisted and recoverable from /api/reports/latest.
  const handleRecoverLastRun = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/latest");
      if (!res.ok) {
        setError("No completed report found on the server — either the run is still in progress (wait a few minutes and retry, or check /api/logs), or a redeploy cleared the server's copy since the run finished.");
        setAppState("error");
        return;
      }
      const recovered: ArchetypeReport = await res.json();
      const alreadySaved = getSavedReports().some(
        (s) => s.report.generatedAt === recovered.generatedAt
      );
      if (!alreadySaved) {
        saveReport(recovered);
        setSavedReports(getSavedReports());
      }
      setReport(recovered);
      setAppState("report");
    } catch {
      setError("Could not reach the server to recover the report.");
      setAppState("error");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080B0F]">
      {/* Top nav bar */}
      <nav className="sticky top-0 z-10 border-b border-[#1C2333] bg-[#080B0F]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[#6366F1]">◈</span>
            <button
              onClick={handleReset}
              className="font-semibold tracking-tight text-[#E8EDF2] hover:text-white"
            >
              Project Sway
            </button>
            <span className="hidden rounded bg-[#1C2333] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6E7681] sm:block">
              Alpha
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6E7681]">
            <span className="hidden sm:block">by</span>
            <span className="font-semibold text-[#8B949E]">Significant</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {appState === "input" && (
          <>
            <InputForm onSubmit={handleSubmit} isLoading={false} />
            {/* Reachable recovery: streams can drop mid-run (Railway enforces a
                ~15-min proxy timeout) while the pipeline finishes server-side. */}
            <div className="mx-auto mt-6 max-w-2xl text-center">
              <button
                onClick={handleRecoverLastRun}
                className="text-xs text-[#6E7681] underline decoration-[#374151] underline-offset-4 transition-colors hover:text-[#8B949E]"
                title="If a run's connection dropped, the pipeline kept going — fetch the last completed report from the server"
              >
                Lost a run to a network error? Recover the last completed report
              </button>
            </div>
            <PreviousReports
              reports={savedReports}
              onSelect={handleSelectReport}
              onDelete={handleDeleteReport}
            />
          </>
        )}

        {appState === "loading" && (
          <LoadingState message={loadingMessage} step={loadingStep} />
        )}

        {appState === "report" && report && (
          <ReportView report={report} onReset={handleReset} />
        )}

        {appState === "error" && (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <span className="mb-4 text-4xl text-red-500">✕</span>
            <h2 className="mb-2 text-lg font-semibold text-[#E8EDF2]">Intelligence sweep failed</h2>
            <p className="mb-6 max-w-md text-sm text-[#8B949E]">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#818CF8]"
              >
                Try Again
              </button>
              <button
                onClick={handleRecoverLastRun}
                className="rounded-lg border border-[#1C2333] bg-[#0D1117] px-6 py-2.5 text-sm text-[#8B949E] transition-colors hover:border-[#6366F1]/50 hover:text-[#E8EDF2]"
                title="If the connection dropped mid-run, the pipeline kept going — check whether it finished"
              >
                Recover Last Run
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
