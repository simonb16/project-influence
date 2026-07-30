import { DataSignalsSynthesis, DataSignal } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const sourceLabels: Record<DataSignal["source"], string> = {
  google_trends: "Google Trends",
  reddit: "Reddit",
  youtube: "YouTube",
  pinterest: "Pinterest",
};

// Signal-type colors match the badge palette used across the four signal sections
const signalTypeColors: Record<DataSignal["signalType"], string> = {
  motivational: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  behavioral: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  trust: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  social: "text-pink-400 bg-pink-400/10 border-pink-400/20",
};

export function SignalCheck({ data }: { data: DataSignalsSynthesis }) {
  if (!data.signals || data.signals.length === 0) return null;

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">◉</span>
        <CardTitle>Signal Check</CardTitle>
        <InfoButton info={SECTION_INFO.signalCheck} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">Platform data validating the signals.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.signals.map((signal, i) => (
          <div key={i} className="flex flex-col rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-[#1C2333] px-1.5 py-0.5 text-[10px] font-semibold text-[#8B949E]">
                {sourceLabels[signal.source] ?? signal.source}
              </span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  signalTypeColors[signal.signalType]
                )}
              >
                {signal.signalType}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold text-[#E8EDF2]">{signal.metric}</p>
            <p className="mt-0.5 text-xs font-medium text-[#818CF8]">{signal.subject}</p>
            <p className="mt-2 text-xs text-[#8B949E]">{signal.finding}</p>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[#6E7681]">{signal.significance}</p>
            {signal.validates && (
              <p className="mt-2 border-t border-[#1C2333] pt-2 text-[10px] text-[#3D444D]">
                <span className="font-semibold uppercase tracking-wider">validates · </span>
                {signal.validates}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Collective finding — the conclusion, visually set apart */}
      {data.collectiveFinding && (
        <div className="mt-4 rounded-lg border border-[#6366F1]/25 bg-[#6366F1]/5 p-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6366F1]">
            What the data collectively shows
          </p>
          <p className="text-sm leading-relaxed text-[#8B949E]">{data.collectiveFinding}</p>
        </div>
      )}

      {data.unavailableSources && data.unavailableSources.length > 0 && (
        <p className="mt-3 text-[10px] text-[#3D444D]">
          Data from {data.unavailableSources.join(", ")} was not available for this analysis.
        </p>
      )}
    </Card>
  );
}
