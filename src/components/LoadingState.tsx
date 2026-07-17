"use client";

import { useEffect, useRef, useState } from "react";

interface LoadingStateProps {
  message: string;
  step: number;
}

const STEPS = [
  "Deploying three research lenses",
  "Lens research underway",
  "First lens complete",
  "Second lens complete",
  "Third lens complete",
  "Reconciling & scoring signals",
  "Reconciliation complete",
  "Synthesis & periphery mapping",
  "First of two complete",
  "Finalizing report",
];

const ACTIVITY_LINES = [
  "Audience lens: reading community threads...",
  "Brand lens: mapping credible vs. rejected brands...",
  "Context lens: scanning macro trend signals...",
  "Extracting sentiment vectors from forum threads...",
  "Identifying trusted voices and recommenders...",
  "Sampling community vocabulary clusters...",
  "Locating brand white space territories...",
  "Indexing recent cultural flashpoints...",
  "Detecting platform shifts and format changes...",
  "Mapping emotional language frequency...",
  "Scanning YouTube comment sections...",
  "Evaluating trend lifecycle stage...",
  "Tracing creator/brand partnership outcomes...",
  "Surfacing latent community tensions...",
  "Cross-checking findings between lenses...",
  "Tagging signals for emotion and intent...",
  "Scoring credibility and copyability dimensions...",
  "Flagging conflicts between research lenses...",
  "Computing composite influence scores...",
  "Isolating the influential core...",
];

export function LoadingState({ message, step }: LoadingStateProps) {
  const progress = Math.min((step / (STEPS.length - 1)) * 100, 95);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const usedRef = useRef<Set<number>>(new Set());

  // Tick elapsed time
  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add a new activity line every 3–6 seconds
  useEffect(() => {
    const addLine = () => {
      setActivityLog((prev) => {
        let idx: number;
        // pick an unused line, reset if exhausted
        if (usedRef.current.size >= ACTIVITY_LINES.length) usedRef.current.clear();
        do { idx = Math.floor(Math.random() * ACTIVITY_LINES.length); }
        while (usedRef.current.has(idx));
        usedRef.current.add(idx);
        const next = [...prev, ACTIVITY_LINES[idx]];
        return next.slice(-8); // keep last 8 lines
      });
    };

    addLine(); // immediate first line
    const interval = setInterval(addLine, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activityLog]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedStr = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, "0")}s`
    : `${secs}s`;

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center py-12">
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
      <p className="mb-1 text-sm font-semibold text-[#E8EDF2]">{message}</p>
      <p className="mb-6 text-xs text-[#6E7681]">
        Real-time web intelligence sweep · {elapsedStr} elapsed
      </p>

      {/* Progress bar */}
      <div className="mb-6 w-full max-w-sm">
        <div className="mb-2 flex justify-between text-[10px] text-[#6E7681]">
          <span className="uppercase tracking-widest">Sweep Progress</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-px w-full overflow-hidden bg-[#1C2333]">
          <div
            className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all duration-700"
            style={{ width: `${progress}%`, boxShadow: "0 0 12px #6366F1" }}
          />
        </div>
        {/* Step dots */}
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
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

      {/* Live activity log */}
      <div className="w-full max-w-sm rounded-lg border border-[#1C2333] bg-[#0D1117] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#1C2333] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6E7681]">
            Live Activity
          </span>
        </div>
        <div
          ref={logRef}
          className="h-36 overflow-hidden px-3 py-2 font-mono"
        >
          {activityLog.map((line, i) => {
            const isLatest = i === activityLog.length - 1;
            return (
              <div
                key={i}
                className="flex items-start gap-2 py-0.5 transition-opacity duration-500"
                style={{ opacity: isLatest ? 1 : 0.3 + (i / activityLog.length) * 0.5 }}
              >
                <span className="mt-0.5 shrink-0 text-[10px] text-[#6366F1]">›</span>
                <span className={`text-[11px] ${isLatest ? "text-[#8B949E]" : "text-[#6E7681]"}`}>
                  {line}
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
