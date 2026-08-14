"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArchetypeReport, ReportSummary, RunSummary } from "@/types";
import { InputForm } from "@/components/InputForm";
import { RunView } from "@/components/RunView";
import { ReportView } from "@/components/report/ReportView";
import { ReportsList } from "@/components/ReportsList";
import { MigrationBanner } from "@/components/MigrationBanner";
import { getEmail, setEmail as persistEmail, getUnimportedReports, markMigrated, SavedReport } from "@/lib/storage";

type AppState = "input" | "run" | "report" | "error";

const LIST_REFRESH_MS = 10000;

export default function Home() {
  const [appState, setAppState] = useState<AppState>("input");
  const [runId, setRunId] = useState<string | null>(null);
  const [report, setReport] = useState<ArchetypeReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmailState] = useState("");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [activeRuns, setActiveRuns] = useState<RunSummary[]>([]);
  const [unimported, setUnimported] = useState<SavedReport[]>([]);

  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const fetchLists = useCallback(async () => {
    try {
      const [reportsRes, runsRes] = await Promise.all([fetch("/api/reports"), fetch("/api/runs")]);
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (runsRes.ok) setActiveRuns(await runsRes.json());
    } catch {
      // Homepage list refresh is best-effort — a transient failure here
      // shouldn't interrupt anything the user is doing.
    }
  }, []);

  // Initial load
  useEffect(() => {
    setEmailState(getEmail());
    setUnimported(getUnimportedReports());
    fetchLists();
  }, [fetchLists]);

  // Keep the shared list fresh while sitting on the homepage, so a
  // colleague's run shows up without a manual refresh.
  useEffect(() => {
    if (appState !== "input") return;
    const interval = setInterval(() => {
      if (appStateRef.current === "input") fetchLists();
    }, LIST_REFRESH_MS);
    return () => clearInterval(interval);
  }, [appState, fetchLists]);

  const handleSubmit = useCallback(async (audience: string, brand: string, context: string, formEmail: string) => {
    setError(null);
    if (formEmail) persistEmail(formEmail);
    setEmailState(formEmail);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, brand, context, email: formEmail || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Server error: ${res.status}`);
        setAppState("error");
        return;
      }

      const { runId: newRunId } = await res.json();
      setRunId(newRunId);
      setAppState("run");
    } catch {
      setError("Could not reach the server.");
      setAppState("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState("input");
    setReport(null);
    setError(null);
    setRunId(null);
    fetchLists();
  }, [fetchLists]);

  const handleRunComplete = useCallback(async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        setReport(await res.json());
        setAppState("report");
      }
    } finally {
      fetchLists();
    }
  }, [fetchLists]);

  const handleWatchRun = useCallback((id: string) => {
    setRunId(id);
    setAppState("run");
  }, []);

  const handleSelectReport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) return;
      setReport(await res.json());
      setAppState("report");
    } catch {
      // leave the user on whatever screen they were on
    }
  }, []);

  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
    } finally {
      fetchLists();
    }
  }, [fetchLists]);

  const handleImported = useCallback((ids: string[]) => {
    markMigrated(ids);
    setUnimported(getUnimportedReports());
    fetchLists();
  }, [fetchLists]);

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
            <MigrationBanner unimported={unimported} runBy={email} onImported={handleImported} />
            <ReportsList
              reports={reports}
              activeRuns={activeRuns}
              onSelectReport={handleSelectReport}
              onWatchRun={handleWatchRun}
              onDeleteReport={handleDeleteReport}
            />
          </>
        )}

        {appState === "run" && runId && (
          <RunView runId={runId} email={email} onComplete={handleRunComplete} onReset={handleReset} />
        )}

        {appState === "report" && report && (
          <ReportView report={report} onReset={handleReset} />
        )}

        {appState === "error" && (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <span className="mb-4 text-4xl text-red-500">✕</span>
            <h2 className="mb-2 text-lg font-semibold text-[#E8EDF2]">Couldn&apos;t start the sweep</h2>
            <p className="mb-6 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              onClick={handleReset}
              className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#818CF8]"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
