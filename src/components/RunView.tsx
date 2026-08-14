"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RunStatus } from "@/types";

interface RunViewProps {
  runId: string;
  email: string;
  onComplete: (reportId: string) => void;
  onReset: () => void;
}

const POLL_INTERVAL_MS = 4000;
const MAX_CONSECUTIVE_FAILURES = 5;
const EXPECTED_STEPS = 9; // matches the pipeline's 6 agent-complete + a few interim progress messages

export function RunView({ runId, email, onComplete, onReset }: RunViewProps) {
  const [run, setRun] = useState<RunStatus | null>(null);
  const [pollWarning, setPollWarning] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const failuresRef = useRef(0);
  const completedRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setNoticeDismissed(false);
    setPollWarning(false);
    setRun(null);
    failuresRef.current = 0;
    completedRef.current = false;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: RunStatus = await res.json();
        if (cancelled) return;
        failuresRef.current = 0;
        setPollWarning(false);
        setRun(data);
        if (data.status === "complete" && data.reportId && !completedRef.current) {
          completedRef.current = true;
          clearInterval(interval);
          onCompleteRef.current(data.reportId);
        }
      } catch {
        if (cancelled) return;
        failuresRef.current += 1;
        if (failuresRef.current >= MAX_CONSECUTIVE_FAILURES) setPollWarning(true);
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [runId]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [run?.progress]);

  const dismiss = useCallback(() => setNoticeDismissed(true), []);

  const events = run?.progress ?? [];
  const latestMessage = events[events.length - 1]?.message ?? "Initializing intelligence sweep...";
  const step = Math.min(events.length, EXPECTED_STEPS);
  const progressPct = Math.min((step / EXPECTED_STEPS) * 100, 95);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedStr = mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;

  if (run?.status === "failed") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <span className="mb-4 text-4xl text-red-500">✕</span>
        <h2 className="mb-2 text-lg font-semibold text-[#E8EDF2]">Intelligence sweep failed</h2>
        <p className="mb-6 max-w-md text-sm text-[#8B949E]">{run.error || "Unknown error"}</p>
        {events.length > 0 && (
          <div className="mb-6 w-full max-w-md rounded-lg border border-[#1C2333] bg-[#0D1117] p-3 text-left">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">Run history</p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {events.map((e, i) => (
                <p key={i} className="text-[11px] text-[#6E7681]">
                  <span className="text-[#374151]">{new Date(e.at).toLocaleTimeString()}</span> — {e.message}
                </p>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={onReset}
          className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#818CF8]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const showEmailVariant = Boolean(run?.emailEnabled) && email.trim().length > 0;

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center py-12">
      {!noticeDismissed && (
        <div className="mb-6 flex w-full max-w-lg items-start justify-between gap-3 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-3 text-xs text-[#C7D2FE]">
          <p>
            {showEmailVariant
              ? `Reports take around 20 minutes. You can close this window — we'll email ${email} when it's ready.`
              : "Reports take around 20 minutes. Your report will appear in Previous Reports when complete — you can close this window and come back."}
          </p>
          <button onClick={dismiss} className="shrink-0 text-[#8B949E] hover:text-white" title="Dismiss">
            ✕
          </button>
        </div>
      )}

      {pollWarning && (
        <div className="mb-6 w-full max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
          Having trouble reaching the server — still watching. The run itself is unaffected.
        </div>
      )}

      {/* Animated logo mark */}
      <div className="relative mb-8">
        <div className="h-16 w-16 rounded-full border border-[#6366F1]/20 animate-pulse-glow" />
        <div
          className="absolute inset-2 rounded-full border border-[#6366F1]/50"
          style={{ animation: "spin 3s linear infinite" }}
        />
        <div
          className="absolute inset-4 rounded-full border border-[#818CF8]/30"
          style={{ animation: "spin 5s linear infinite reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl text-[#6366F1]">◈</span>
        </div>
      </div>

      {/* Status message */}
      <p className="mb-1 text-sm font-semibold text-[#E8EDF2]">{latestMessage}</p>
      <p className="mb-6 text-xs text-[#6E7681]">
        Real-time web intelligence sweep · {elapsedStr} elapsed
      </p>

      {/* Progress bar */}
      <div className="mb-6 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-[10px] text-[#6E7681]">
          <span className="uppercase tracking-widest">Sweep Progress</span>
          <span className="font-mono">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-px w-full overflow-hidden bg-[#1C2333]">
          <div
            className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all duration-700"
            style={{ width: `${progressPct}%`, boxShadow: "0 0 12px #6366F1" }}
          />
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: EXPECTED_STEPS + 1 }).map((_, i) => (
            <div
              key={i}
              className="h-px flex-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i <= step ? "#6366F1" : "#1C2333",
                boxShadow: i === step ? "0 0 6px #6366F1" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Live activity log — real progress events from the server */}
      <div className="w-full max-w-sm rounded-lg border border-[#1C2333] bg-[#0D1117] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#1C2333] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">
            Live Activity
          </span>
        </div>
        <div ref={logRef} className="h-36 overflow-y-auto px-3 py-2 font-mono">
          {events.slice(-8).map((e, i, arr) => {
            const isLatest = i === arr.length - 1;
            return (
              <div
                key={`${e.at}-${i}`}
                className="flex items-start gap-2 py-0.5 transition-opacity duration-500"
                style={{ opacity: isLatest ? 1 : 0.3 + (i / arr.length) * 0.5 }}
              >
                <span className="mt-0.5 shrink-0 text-[10px] text-[#6366F1]">›</span>
                <span className={`text-[11px] ${isLatest ? "text-[#8B949E]" : "text-[#6E7681]"}`}>
                  {e.message}
                  {isLatest && <span className="ml-1 inline-block animate-pulse-glow text-[#6366F1]">_</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
