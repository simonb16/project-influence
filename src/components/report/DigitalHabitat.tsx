import { DigitalHabitat as DigitalHabitatType } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { platformIcon } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

export function DigitalHabitat({ data }: { data: DigitalHabitatType[] }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">◉</span>
        <CardTitle>Digital Habitat</CardTitle>
        <InfoButton info={SECTION_INFO.digitalHabitat} />
      </CardHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((place, i) => (
          <div
            key={i}
            className={[
              "rounded-lg border p-3.5",
              place.unverified
                ? "border-dashed border-[#2A3040] opacity-80"
                : "border-[#1C2333]",
            ].join(" ")}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[#6366F1]">{platformIcon(place.category)}</span>
                  <span className="font-medium text-sm text-[#E8EDF2]">{place.community}</span>
                  {place.sourceUrl && (
                    <a
                      href={place.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#6366F1]/50 transition-colors hover:text-[#6366F1]"
                      title="View source"
                    >
                      ↗
                    </a>
                  )}
                  {place.unverified && (
                    <span className="rounded border border-dashed border-[#3D444D] px-1 py-px text-[9px] text-[#6E7681]">
                      unverified
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#6E7681]">{place.platform}</span>
              </div>
              <span className="shrink-0 rounded bg-[#1C2333] px-1.5 py-0.5 font-mono text-[10px] text-[#8B949E] uppercase">
                {place.category}
              </span>
            </div>
            <p className="mb-3 text-xs text-[#6E7681]">{place.description}</p>
            <ScoreBar score={place.engagementIntensity} label="Engagement" height={3} />
          </div>
        ))}
      </div>
    </Card>
  );
}
