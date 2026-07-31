import { CulturalConnector } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const typeColors: Record<CulturalConnector["type"], string> = {
  voice: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  space: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  format: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  moment: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export function CulturalConnectors({ data }: { data: CulturalConnector[] }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.bridgeStrength - a.bridgeStrength);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⋈</span>
        <CardTitle>Cultural Connectors</CardTitle>
        <InfoButton info={SECTION_INFO.culturalConnectors} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        The bridges that carry influence between the core and broader culture.
      </p>
      <div className="space-y-3">
        {sorted.map((connector, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#E8EDF2]">{connector.connector}</span>
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  typeColors[connector.type]
                )}
              >
                {connector.type}
              </span>
            </div>
            <p className="mb-2 font-mono text-[11px] text-[#818CF8]">{connector.bridges}</p>
            <p className="mb-2 text-xs text-[#8B949E]">{connector.mechanism}</p>
            <p className="mb-3 text-[11px] text-[#6E7681]">
              <span className="font-semibold uppercase tracking-wider text-[#3D444D]">Evidence · </span>
              {connector.evidence}
            </p>
            <ScoreBar score={connector.bridgeStrength} label="Bridge Strength" height={3} />
          </div>
        ))}
      </div>
    </Card>
  );
}
