import { ArchetypeReport } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { scoreColor } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

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
        <InfoButton info={SECTION_INFO.influenceSusceptibility} />
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

      {/* Susceptibility profile (three-lens reports) */}
      {(data.highSusceptibility?.length || data.lowSusceptibility?.length || data.trustTransferPaths?.length) ? (
        <div className="mt-5 space-y-3 border-t border-[#1C2333] pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.highSusceptibility && data.highSusceptibility.length > 0 && (
              <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Most Open To
                </p>
                <ul className="space-y-1">
                  {data.highSusceptibility.map((item, i) => (
                    <li key={i} className="text-xs text-[#8B949E]">▸ {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.lowSusceptibility && data.lowSusceptibility.length > 0 && (
              <div className="rounded-lg border border-red-400/15 bg-red-400/5 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-400/80">
                  Resists / Rejects
                </p>
                <ul className="space-y-1">
                  {data.lowSusceptibility.map((item, i) => (
                    <li key={i} className="text-xs text-[#8B949E]">▸ {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {data.trustTransferPaths && data.trustTransferPaths.length > 0 && (
            <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6366F1]">
                Trust Transfer Paths
              </p>
              <ul className="space-y-1">
                {data.trustTransferPaths.map((path, i) => (
                  <li key={i} className="font-mono text-xs text-[#8B949E]">{path}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
