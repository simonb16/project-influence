"use client";

import { scoreColor } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  label?: string;
  showValue?: boolean;
  height?: number;
  animate?: boolean;
}

export function ScoreBar({ score, label, showValue = true, height = 4, animate = true }: ScoreBarProps) {
  const color = scoreColor(score);

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1.5 flex justify-between text-xs">
          {label && <span className="text-[#8B949E]">{label}</span>}
          {showValue && (
            <span className="font-mono font-semibold" style={{ color }}>
              {score}
            </span>
          )}
        </div>
      )}
      <div className="w-full rounded-full bg-[#1C2333]" style={{ height }}>
        <div
          className="rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${score}%`,
            height,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
