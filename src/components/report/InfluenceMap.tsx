import { Influencer } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1.5 text-[10px] text-[#6366F1]/50 transition-colors hover:text-[#6366F1]"
      title="View source"
    >
      ↗
    </a>
  );
}

function UnverifiedTag() {
  return (
    <span className="ml-1.5 rounded border border-dashed border-[#3D444D] px-1 py-px text-[9px] text-[#6E7681]">
      unverified
    </span>
  );
}

export function InfluenceMap({ data }: { data: Influencer[] }) {
  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">◈</span>
        <CardTitle>Influence Map</CardTitle>
        <InfoButton info={SECTION_INFO.influenceMap} />
      </CardHeader>
      <div className="space-y-4">
        {data.map((influencer, i) => (
          <div
            key={i}
            className={[
              "group relative rounded-lg border p-4 transition-colors",
              influencer.unverified
                ? "border-dashed border-[#2A3040] bg-[#080B0F] opacity-80"
                : "border-[#1C2333] bg-[#080B0F] hover:border-[#6366F1]/30",
            ].join(" ")}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-mono text-xs text-[#6E7681]">#{i + 1}</span>
                <span className="font-semibold text-[#E8EDF2]">{influencer.name}</span>
                {influencer.sourceUrl && <SourceLink url={influencer.sourceUrl} />}
                {influencer.unverified && <UnverifiedTag />}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={influencer.type === "initiator" ? "initiator" : "amplifier"}>
                  {influencer.type}
                </Badge>
                <span className="rounded bg-[#1C2333] px-2 py-0.5 font-mono text-xs text-[#8B949E]">
                  {influencer.platform}
                </span>
              </div>
            </div>
            <p className="mb-2 text-sm text-[#8B949E]">{influencer.description}</p>
            {influencer.behavioralRole && (
              <p className="mb-3 text-xs text-[#6366F1]/80 italic">
                ↳ {influencer.behavioralRole}
              </p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ScoreBar score={influencer.intensityScore} label="Influence Intensity" />
              </div>
              {influencer.reach && (
                <span className="shrink-0 text-xs text-[#6E7681]">{influencer.reach}</span>
              )}
            </div>
            {influencer.funnelStage && influencer.funnelStage.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {influencer.funnelStage.map((stage) => (
                  <span key={stage} className="rounded bg-[#1C2333] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6E7681]">
                    {stage}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
