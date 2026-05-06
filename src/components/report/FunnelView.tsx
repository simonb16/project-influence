"use client";

import { useState } from "react";
import { Influencer, EmotionalDriver, BehavioralSignal } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";
import { cn } from "@/lib/utils";

type Stage = "awareness" | "consideration" | "conversion" | "retention";

const STAGES: { key: Stage; label: string; description: string }[] = [
  { key: "awareness", label: "Awareness", description: "What pulls them in" },
  { key: "consideration", label: "Consideration", description: "What makes them evaluate" },
  { key: "conversion", label: "Conversion", description: "What pushes them to act" },
  { key: "retention", label: "Retention", description: "What keeps them coming back" },
];

interface FunnelItem {
  label: string;
  subLabel?: string;
  type: "influencer" | "emotion" | "signal";
  role?: string;
}

function getItems(stage: Stage, influencers: Influencer[], emotionalDrivers: EmotionalDriver[], behavioralSignals: BehavioralSignal[]): FunnelItem[] {
  const items: FunnelItem[] = [];

  influencers.forEach((inf) => {
    if (inf.funnelStage?.includes(stage)) {
      items.push({ label: inf.name, subLabel: inf.platform, type: "influencer", role: inf.behavioralRole });
    }
  });

  emotionalDrivers.forEach((em) => {
    if (em.funnelStage?.includes(stage)) {
      items.push({ label: em.emotion.toUpperCase(), subLabel: `score ${em.score}`, type: "emotion", role: em.mechanism });
    }
  });

  behavioralSignals.forEach((sig) => {
    if (sig.funnelStage?.includes(stage)) {
      items.push({ label: sig.signal, subLabel: sig.intensity + " intensity", type: "signal", role: sig.trigger });
    }
  });

  return items;
}

const typeStyle: Record<FunnelItem["type"], string> = {
  influencer: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  emotion: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  signal: "text-sky-400 bg-sky-400/10 border-sky-400/20",
};

const typeLabel: Record<FunnelItem["type"], string> = {
  influencer: "Influencer",
  emotion: "Emotion",
  signal: "Signal",
};

interface FunnelViewProps {
  influencers: Influencer[];
  emotionalDrivers: EmotionalDriver[];
  behavioralSignals: BehavioralSignal[];
}

export function FunnelView({ influencers, emotionalDrivers, behavioralSignals }: FunnelViewProps) {
  const [activeStage, setActiveStage] = useState<Stage>("awareness");

  // Only render if at least some funnel stage data exists
  const hasData =
    influencers.some((i) => i.funnelStage && i.funnelStage.length > 0) ||
    emotionalDrivers.some((e) => e.funnelStage && e.funnelStage.length > 0) ||
    behavioralSignals.some((s) => s.funnelStage && s.funnelStage.length > 0);

  if (!hasData) return null;

  const items = getItems(activeStage, influencers, emotionalDrivers, behavioralSignals);
  const activeStageInfo = STAGES.find((s) => s.key === activeStage)!;

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">⟿</span>
        <CardTitle>Purchase Funnel View</CardTitle>
        <InfoButton info={SECTION_INFO.funnelView} />
      </CardHeader>

      {/* Stage tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STAGES.map((stage) => {
          const count = getItems(stage.key, influencers, emotionalDrivers, behavioralSignals).length;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveStage(stage.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                activeStage === stage.key
                  ? "bg-[#6366F1] text-white"
                  : "bg-[#1C2333] text-[#6E7681] hover:text-[#E8EDF2]"
              )}
            >
              {stage.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                activeStage === stage.key ? "bg-white/20 text-white" : "bg-[#0D1117] text-[#6E7681]"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-[#6E7681] italic">{activeStageInfo.description}</p>

      {/* Items */}
      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#6E7681]">No items mapped to this stage in this report.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0", typeStyle[item.type])}>
                  {typeLabel[item.type]}
                </span>
                <span className="text-sm font-medium text-[#E8EDF2]">{item.label}</span>
                {item.subLabel && (
                  <span className="text-[11px] text-[#6E7681]">· {item.subLabel}</span>
                )}
              </div>
              {item.role && (
                <p className="text-xs text-[#8B949E] italic">↳ {item.role}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
