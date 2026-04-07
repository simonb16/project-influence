import { ArchetypeReport } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { scoreColor } from "@/lib/utils";

const channelIcons: Record<string, string> = {
  peer: "○",
  creator: "◈",
  brand: "◆",
  algorithm: "◎",
};

export function InfluenceSusceptibility({ data }: { data: ArchetypeReport["influenceSusceptibility"] }) {
  const initiatorColor = scoreColor(data.initiatorScore);
  const overallColor = scoreColor(data.overallScore);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">▼</span>
        <CardTitle>Influence Susceptibility</CardTitle>
      </CardHeader>

      {/* Overall + Initiator/Imitator scores */}
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4 text-center">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-[#6E7681]">Overall Susceptibility</p>
          <p className="font-mono text-3xl font-bold" style={{ color: overallColor }}>{data.overallScore}</p>
        </div>
        <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4 text-center">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-[#6E7681]">Initiator Score</p>
          <p className="font-mono text-3xl font-bold" style={{ color: initiatorColor }}>{data.initiatorScore}</p>
          <p className="mt-1 text-[10px] text-[#6E7681]">
            {data.initiatorScore >= 60 ? "Trendsetter" : data.initiatorScore >= 40 ? "Early Adopter" : "Imitator"}
          </p>
        </div>
      </div>

      {/* Initiator / Imitator spectrum bar */}
      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-[10px] text-[#6E7681]">
          <span>IMITATOR</span>
          <span>INITIATOR</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-[#1C2333] to-[#6366F1]">
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_8px_white]"
            style={{ left: `${data.initiatorScore}%` }}
          />
        </div>
      </div>

      {/* Channel breakdown */}
      <div className="space-y-3">
        {data.channels.map((channel) => (
          <div key={channel.channel}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm text-[#6366F1]">{channelIcons[channel.channel]}</span>
              <span className="text-sm capitalize text-[#E8EDF2]">{channel.channel} Influence</span>
              <span className="ml-auto text-xs text-[#6E7681]">{channel.description}</span>
            </div>
            <ScoreBar score={channel.score} height={3} />
          </div>
        ))}
      </div>
    </Card>
  );
}
