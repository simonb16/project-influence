import { PeripheryInsights as PeripheryInsightsType } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

function InsightList({ label, icon, items }: { label: string; icon: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6366F1]">
        <span>{icon}</span> {label}
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#8B949E]">
            <span className="mt-0.5 shrink-0 text-xs text-[#3D444D]">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PeripheryInsights({ insights }: { insights: PeripheryInsightsType }) {
  const hasExpansionPaths = insights.expansionPaths && insights.expansionPaths.length > 0;

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⌘</span>
        <CardTitle>Periphery Insights</CardTitle>
      </CardHeader>

      <div className="grid gap-3 lg:grid-cols-2">
        <InsightList label="Surprising Overlaps" icon="✦" items={insights.surprisingOverlaps} />
        <InsightList label="Bridge Opportunities" icon="⇄" items={insights.bridgeOpportunities} />
      </div>

      {hasExpansionPaths && (
        <div className="mt-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6E7681]">
            Audience Expansion Paths
          </p>
          <div className="space-y-3">
            {insights.expansionPaths.map((path, i) => (
              <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
                <div className="mb-2 flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-[#6366F1]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold text-[#E8EDF2]">{path.direction}</span>
                </div>
                <p className="mb-2 pl-7 text-sm text-[#8B949E]">{path.rationale}</p>
                <p className="pl-7 text-xs text-amber-400/70">
                  <span className="font-semibold uppercase tracking-wider">Risk:</span> {path.risk}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
