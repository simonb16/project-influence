import { RankedSource } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const typeLabel: Record<RankedSource["type"], string> = {
  community: "Community",
  creator_channel: "Creator",
  publication: "Publication",
  academic: "Academic",
};

const typeColor: Record<RankedSource["type"], string> = {
  community: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  creator_channel: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  publication: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  academic: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export function SourceRanking({ data }: { data?: RankedSource[] }) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.signalStrength - a.signalStrength);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">◈</span>
        <CardTitle>Top Signal Sources</CardTitle>
        <InfoButton info={SECTION_INFO.sourceRanking} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        Communities ranked by how much behavioral signal they yielded for this specific archetype — not by size.
      </p>
      <div className="space-y-4">
        {sorted.map((source, i) => (
          <div key={i} className="group rounded-lg border border-[#1C2333] bg-[#080B0F] p-4 transition-colors hover:border-[#6366F1]/30">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#6E7681]">#{i + 1}</span>
                <span className="font-semibold text-sm text-[#E8EDF2]">{source.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeColor[source.type]}`}>
                  {typeLabel[source.type]}
                </span>
                <span className="rounded bg-[#1C2333] px-2 py-0.5 font-mono text-xs text-[#8B949E]">
                  {source.platform}
                </span>
              </div>
            </div>
            <p className="mb-3 text-xs text-[#8B949E]">{source.audienceRelevance}</p>
            <ScoreBar score={source.signalStrength} label="Signal Strength" />
          </div>
        ))}
      </div>
    </Card>
  );
}
