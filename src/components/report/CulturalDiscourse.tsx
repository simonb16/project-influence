import { DiscourseItem } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const sentimentStyles = {
  positive: "border-l-emerald-500 bg-emerald-500/5",
  negative: "border-l-red-500 bg-red-500/5",
  mixed: "border-l-amber-500 bg-amber-500/5",
  neutral: "border-l-[#374151] bg-[#080B0F]",
};

const sentimentDot = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  mixed: "bg-amber-500",
  neutral: "bg-[#374151]",
};

export function CulturalDiscourse({ data }: { data: DiscourseItem[] }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">◆</span>
        <CardTitle>Cultural Discourse</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {data.map((item, i) => (
          <div
            key={i}
            className={cn(
              "rounded-r-lg border-l-2 p-4",
              sentimentStyles[item.sentiment]
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", sentimentDot[item.sentiment])} />
              <span className="font-semibold text-sm text-[#E8EDF2]">{item.topic}</span>
              {item.source && (
                <span className="ml-auto text-[10px] text-[#6E7681]">{item.source}</span>
              )}
            </div>
            {item.tension && (
              <p className="mb-2 text-xs text-[#8B949E]">
                <span className="text-[#6366F1]">Tension:</span> {item.tension}
              </p>
            )}
            {item.exampleQuote && (
              <blockquote className="border-l border-[#1C2333] pl-3 text-xs italic text-[#6E7681]">
                &ldquo;{item.exampleQuote}&rdquo;
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
