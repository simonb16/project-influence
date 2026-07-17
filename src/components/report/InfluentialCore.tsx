import { InfluentialCore as InfluentialCoreType } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

interface ListGroupProps {
  label: string;
  items?: string[];
  accent?: boolean;
}

function ListGroup({ label, items, accent }: ListGroupProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6E7681]">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#8B949E]">
            <span className={`mt-0.5 shrink-0 text-xs ${accent ? "text-[#6366F1]" : "text-[#3D444D]"}`}>
              {accent ? "▸" : "·"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InfluentialCore({ data }: { data: InfluentialCoreType }) {
  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">⦿</span>
        <CardTitle>The Influential Core</CardTitle>
        <InfoButton info={SECTION_INFO.influentialCore} />
      </CardHeader>

      {/* Definition + profile */}
      <div className="mb-5 space-y-3">
        <p className="text-sm leading-relaxed text-[#E8EDF2]">{data.definition}</p>
        {data.profile && (
          <p className="border-l-2 border-[#6366F1]/40 pl-3 text-sm leading-relaxed text-[#8B949E]">
            {data.profile}
          </p>
        )}
      </div>

      {/* Detail groups — activation recommendations render in the Entry Points tab */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ListGroup label="Key Behaviors" items={data.keyBehaviors} />
        <ListGroup label="Key Tensions" items={data.keyTensions} />
        <ListGroup label="Language Codes" items={data.languageCodes} accent />
        <ListGroup label="Trust Signals" items={data.trustSignals} accent />
      </div>
    </Card>
  );
}
