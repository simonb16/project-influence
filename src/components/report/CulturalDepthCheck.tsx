import { CulturalSignal } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

export function CulturalDepthCheck({ data }: { data: CulturalSignal[] }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">◇</span>
        <CardTitle>Cultural Depth Check</CardTitle>
        <InfoButton info={SECTION_INFO.culturalDepthCheck} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        Classifying each detected signal as a fleeting surface trend or an enduring structural force.
      </p>
      <div className="space-y-3">
        {data.map((signal, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="font-medium text-sm text-[#E8EDF2]">{signal.signal}</span>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={signal.classification === "structural_force" ? "structural" : "surface"}>
                  {signal.classification === "structural_force" ? "Structural Force" : "Surface Trend"}
                </Badge>
                {signal.timeframe && (
                  <span className="text-[10px] text-[#6E7681]">{signal.timeframe}</span>
                )}
              </div>
            </div>
            <p className="text-xs text-[#6E7681]">{signal.rationale}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
