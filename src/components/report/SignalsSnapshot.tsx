"use client";

import { SignalsSnapshot as SignalsSnapshotType, SnapshotEntry } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

// At-a-glance summary of the four Signals of Influence: the influential core
// circle at center (inside a faint "growth audience" ring), the four signal
// boxes around it. Every entry is derived from a scored section of the report;
// each box clicks through to its signal tab.

export type SignalTabTarget = "motivational" | "behavioral" | "trust" | "social";

interface SignalsSnapshotProps {
  data: SignalsSnapshotType;
  onNavigate?: (tab: SignalTabTarget) => void;
  /** Round 6a: the memorable core name supersedes coreLabel when present. */
  coreNameOverride?: string;
}

function EntryLine({ entry }: { entry: SnapshotEntry }) {
  return (
    <li className="text-[11px] leading-snug text-[#8B949E]">
      <span className="text-[#E8EDF2]">{entry.label}</span>
      {entry.detail && <span className="text-[#6E7681]"> — {entry.detail}</span>}
      {(entry.score != null || entry.rating) && (
        <span className="font-mono font-semibold text-[#818CF8]">
          {" · "}
          {entry.score != null ? entry.score : entry.rating}
        </span>
      )}
    </li>
  );
}

function SignalBox({
  label,
  entries,
  target,
  onNavigate,
}: {
  label: string;
  entries: SnapshotEntry[];
  target: SignalTabTarget;
  onNavigate?: (tab: SignalTabTarget) => void;
}) {
  if (!entries || entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (
    <button
      onClick={() => onNavigate?.(target)}
      className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3.5 text-left transition-colors hover:border-[#6366F1]/40"
      style={{ gridArea: target }}
    >
      <p className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-[#6366F1]">
        {label}
        <span className="text-[#3D444D]">→</span>
      </p>
      <ul className="space-y-1.5">
        {sorted.map((entry, i) => (
          <EntryLine key={i} entry={entry} />
        ))}
      </ul>
    </button>
  );
}

export function SignalsSnapshot({ data, onNavigate, coreNameOverride }: SignalsSnapshotProps) {
  const centerName = coreNameOverride ?? data.coreLabel;
  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">✳</span>
        <CardTitle>Signals Snapshot</CardTitle>
        <InfoButton info={SECTION_INFO.signalsSnapshot} />
      </CardHeader>
      <p className="mb-5 text-xs text-[#6E7681]">
        The four Signals of Influence at a glance — every entry traces to a scored finding in the
        full report. Click a signal to go deeper.
      </p>

      <div
        className="signals-snapshot-grid grid gap-4"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateAreas: `"motivational circle behavioral" "trust circle social"`,
        }}
      >
        {/* Center: growth audience ring + core circle */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-2" style={{ gridArea: "circle" }}>
          <div className="flex h-44 w-44 items-center justify-center rounded-full border border-dashed border-[#2A3040] sm:h-52 sm:w-52">
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#6366F1]/60 bg-[#0D1117] text-center shadow-[0_0_32px_rgba(99,102,241,0.15)] sm:h-40 sm:w-40">
              <span className="px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6366F1]">
                Influential Core
              </span>
              <span className="mt-1 px-3 text-xs font-semibold leading-snug text-[#E8EDF2]">
                {centerName}
              </span>
            </div>
          </div>
          <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-[#3D444D]">
            Growth Audience
          </span>
        </div>

        <SignalBox label="Motivational" entries={data.motivational} target="motivational" onNavigate={onNavigate} />
        <SignalBox label="Behavioral" entries={data.behavioral} target="behavioral" onNavigate={onNavigate} />
        <SignalBox label="Trust" entries={data.trust} target="trust" onNavigate={onNavigate} />
        <SignalBox label="Social" entries={data.social} target="social" onNavigate={onNavigate} />
      </div>

      {/* Narrow-viewport stacking */}
      <style>{`
        @media (max-width: 640px) {
          .signals-snapshot-grid {
            grid-template-columns: 1fr !important;
            grid-template-areas: "circle" "motivational" "behavioral" "trust" "social" !important;
          }
        }
      `}</style>
    </Card>
  );
}
