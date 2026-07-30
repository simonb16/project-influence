import { RealWorldHabitatItem } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const influenceIcons: Record<RealWorldHabitatItem["influenceType"], string> = {
  discovery: "✦",
  recommendation: "☞",
  demonstration: "✎",
  validation: "✓",
  gathering: "◌",
};

// Mirrors DigitalHabitat styling — they render as a pair on the Social tab.
export function RealWorldHabitat({ data }: { data: RealWorldHabitatItem[] }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.strength - a.strength);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⌂</span>
        <CardTitle>Real World Habitat</CardTitle>
        <InfoButton info={SECTION_INFO.realWorldHabitat} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">Where the core is influenced offline.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((item, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] p-3.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#6366F1]">{influenceIcons[item.influenceType] ?? "◌"}</span>
                <span className="font-medium text-sm text-[#E8EDF2]">{item.context}</span>
              </div>
              <span className="shrink-0 rounded bg-[#1C2333] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#8B949E]">
                {item.influenceType}
              </span>
            </div>
            <p className="mb-2 text-xs text-[#6E7681]">{item.description}</p>
            <p className="mb-3 text-[11px] italic text-[#3D444D]">“{item.evidence}”</p>
            <ScoreBar score={item.strength} label="Influence Strength" height={3} />
          </div>
        ))}
      </div>
    </Card>
  );
}
