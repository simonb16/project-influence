import { InfluentialCore as InfluentialCoreType } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

// The influential core's fields render across several tabs in the
// Signals-of-Influence layout: the description here (The Influential Core tab),
// and the list fields via CoreListCard on the Social / Trust / Behavioral /
// Motivational tabs.

export function InfluentialCoreDescription({ data }: { data: InfluentialCoreType }) {
  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">⦿</span>
        <CardTitle>The Influential Core</CardTitle>
        <InfoButton info={SECTION_INFO.influentialCore} />
      </CardHeader>
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-[#E8EDF2]">{data.definition}</p>
        {data.profile && (
          <p className="border-l-2 border-[#6366F1]/40 pl-3 text-sm leading-relaxed text-[#8B949E]">
            {data.profile}
          </p>
        )}
      </div>
    </Card>
  );
}

interface CoreListCardProps {
  title: string;
  icon?: string;
  intro?: string;
  items?: string[];
}

/** Generic list card for the influential core's list fields (language codes,
 * trust signals, habitual behaviors, key tensions). */
export function CoreListCard({ title, icon = "▪", intro, items }: CoreListCardProps) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">{icon}</span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {intro && <p className="mb-3 text-xs text-[#6E7681]">{intro}</p>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-lg border border-[#1C2333] bg-[#080B0F] p-3 text-sm text-[#8B949E]">
            <span className="mt-0.5 shrink-0 text-xs text-[#6366F1]">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
