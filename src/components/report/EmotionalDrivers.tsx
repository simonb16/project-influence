"use client";

import { EmotionalDriver } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { scoreColor, emotionEmoji } from "@/lib/utils";

const emotionLabels: Record<string, string> = {
  guilt: "Guilt",
  envy: "Envy",
  pride: "Pride",
  fomo: "FOMO",
  belonging: "Belonging",
  competition: "Competition",
  fear: "Fear",
  disgust: "Disgust",
  reward: "Reward",
  scarcity: "Scarcity",
};

export function EmotionalDrivers({ data }: { data: EmotionalDriver[] }) {
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">◎</span>
        <CardTitle>Emotional Driver Dashboard</CardTitle>
      </CardHeader>

      {/* Dominant drivers highlight */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {top3.map((driver) => {
          const color = scoreColor(driver.score);
          return (
            <div
              key={driver.emotion}
              className="flex flex-col items-center rounded-lg border border-[#1C2333] bg-[#080B0F] p-3 text-center"
              style={{ borderColor: `${color}30` }}
            >
              <span className="mb-1 text-lg" style={{ color }}>{emotionEmoji(driver.emotion)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B949E]">
                {emotionLabels[driver.emotion]}
              </span>
              <span className="mt-1 font-mono text-xl font-bold" style={{ color }}>
                {driver.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* All 10 emotions */}
      <div className="space-y-3">
        {sorted.map((driver) => {
          const color = scoreColor(driver.score);
          return (
            <div key={driver.emotion}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center text-sm" style={{ color }}>{emotionEmoji(driver.emotion)}</span>
                  <span className="text-sm text-[#E8EDF2]">{emotionLabels[driver.emotion]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6E7681]">{driver.evidence.slice(0, 60)}{driver.evidence.length > 60 ? "…" : ""}</span>
                  <span className="w-8 text-right font-mono text-sm font-semibold" style={{ color }}>{driver.score}</span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#1C2333]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${driver.score}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}60`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
