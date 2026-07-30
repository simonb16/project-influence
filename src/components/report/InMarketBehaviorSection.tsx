import { InMarketBehavior } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CoreVsBase } from "./CoreVsBase";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

function Block({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6366F1]">{label}</p>
      <p className="text-sm leading-relaxed text-[#8B949E]">{text}</p>
    </div>
  );
}

export function InMarketBehaviorSection({ data }: { data: InMarketBehavior }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⇢</span>
        <CardTitle>In-Market Behavior</CardTitle>
        <InfoButton info={SECTION_INFO.inMarketBehavior} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">How the core researches, compares and chooses.</p>

      <div className="space-y-3">
        <Block label="Research Pattern" text={data.researchPattern} />
        <Block label="Comparison Behavior" text={data.comparisonBehavior} />

        {data.decisionTriggers && data.decisionTriggers.length > 0 && (
          <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6366F1]">
              Decision Triggers
            </p>
            <ul className="space-y-1.5">
              {data.decisionTriggers.map((trigger, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#8B949E]">
                  <span className="mt-0.5 shrink-0 text-xs text-[#6366F1]">▸</span>
                  {trigger}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Block label="Post-Purchase Behavior" text={data.postPurchaseBehavior} />
        <CoreVsBase note={data.coreVsBase} />
      </div>
    </Card>
  );
}
