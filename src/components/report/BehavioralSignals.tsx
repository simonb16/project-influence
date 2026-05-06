import { BehavioralSignal } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const categoryColors: Record<string, string> = {
  purchase: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  content: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  subscription: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  brand: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  habit: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

const intensityDot: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-[#374151]",
};

export function BehavioralSignals({ data }: { data: BehavioralSignal[] }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">△</span>
        <CardTitle>Behavioral Signals</CardTitle>
        <InfoButton info={SECTION_INFO.behavioralSignals} />
      </CardHeader>
      <div className="space-y-2">
        {data.map((signal, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
            <span className={cn(
              "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              categoryColors[signal.category]
            )}>
              {signal.category}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#E8EDF2]">{signal.signal}</span>
                <span className={cn("h-1.5 w-1.5 rounded-full", intensityDot[signal.intensity])} />
                <span className="text-xs text-[#6E7681] capitalize">{signal.intensity}</span>
              </div>
              <p className="mt-0.5 text-xs text-[#6E7681]">{signal.detail}</p>
              {signal.trigger && (
                <p className="mt-1 text-[11px] text-[#6366F1]/70 italic">↳ triggered by: {signal.trigger}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
