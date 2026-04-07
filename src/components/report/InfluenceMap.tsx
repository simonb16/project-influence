import { Influencer } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";

export function InfluenceMap({ data }: { data: Influencer[] }) {
  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">◈</span>
        <CardTitle>Influence Map</CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {data.map((influencer, i) => (
          <div key={i} className="group relative rounded-lg border border-[#1C2333] bg-[#080B0F] p-4 transition-colors hover:border-[#6366F1]/30">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#6E7681]">#{i + 1}</span>
                <span className="font-semibold text-[#E8EDF2]">{influencer.name}</span>
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
            <p className="mb-3 text-sm text-[#8B949E]">{influencer.description}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ScoreBar score={influencer.intensityScore} label="Influence Intensity" />
              </div>
              {influencer.reach && (
                <span className="shrink-0 text-xs text-[#6E7681]">{influencer.reach}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
