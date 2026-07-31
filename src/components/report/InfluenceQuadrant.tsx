"use client";

import { useState } from "react";
import { Influencer, ReachLevel } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

// 2D map of influence items: reach (x) vs composite score (y).
// The top-left zone — high score, low reach — is where SWAY's value lives.

const W = 680;
const H = 420;
const PAD = { top: 36, right: 24, bottom: 44, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const REACH_ORDER: ReachLevel[] = ["micro", "niche", "significant", "mainstream"];
const REACH_LABELS: Record<ReachLevel, string> = {
  micro: "Micro",
  niche: "Niche",
  significant: "Significant",
  mainstream: "Mainstream",
};

const MID_X = PAD.left + PLOT_W / 2; // between niche and significant
const MID_Y = PAD.top + PLOT_H / 2; // composite = 5

interface PlottedItem {
  item: Influencer;
  x: number;
  y: number;
}

function plot(items: Influencer[]): PlottedItem[] {
  const plottable = items.filter(
    (i): i is Influencer & { reachLevel: ReachLevel } =>
      !!i.scores && !!i.reachLevel && REACH_ORDER.includes(i.reachLevel)
  );
  // Deterministic jitter within each reach column so same-cell dots don't stack
  const perColumn: Record<string, number> = {};
  return plottable.map((item) => {
    const col = REACH_ORDER.indexOf(item.reachLevel);
    const n = (perColumn[item.reachLevel] = (perColumn[item.reachLevel] ?? 0) + 1);
    const jitter = ((n % 5) - 2) * (PLOT_W / 4 / 7);
    const x = PAD.left + ((col + 0.5) / 4) * PLOT_W + jitter;
    const composite = Math.max(1, Math.min(10, item.scores!.composite));
    const y = PAD.top + (1 - composite / 10) * PLOT_H;
    return { item, x, y };
  });
}

function dotStyle(item: Influencer): { fill: string; fillOpacity: number; stroke: string; strokeWidth: number } {
  if (item.convergenceStatus === "conflicted") {
    return { fill: "#0D1117", fillOpacity: 1, stroke: "#F59E0B", strokeWidth: 1.5 };
  }
  if (item.convergenceStatus === "converged") {
    return { fill: "#6366F1", fillOpacity: 1, stroke: "#818CF8", strokeWidth: 0.5 };
  }
  return { fill: "#6E7681", fillOpacity: 0.55, stroke: "#6E7681", strokeWidth: 0 };
}

interface InfluenceQuadrantProps {
  items: Influencer[];
  onSelectItem?: (name: string) => void;
}

export function InfluenceQuadrant({ items, onSelectItem }: InfluenceQuadrantProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const plotted = plot(items);
  if (plotted.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">◫</span>
        <CardTitle>Influence Quadrant</CardTitle>
        <InfoButton info={SECTION_INFO.influenceQuadrant} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        Reach vs. composite influence score. The Hidden Core — high influence, low reach — is where
        under-priced influence lives. Click a dot to jump to that item in the Influence Map tab.
      </p>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }}>
          {/* Hidden Core zone highlight (top-left) */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W / 2}
            height={PLOT_H / 2}
            fill="#6366F1"
            fillOpacity={0.06}
            stroke="#6366F1"
            strokeOpacity={0.25}
            strokeWidth={1}
            strokeDasharray="4 4"
            rx={4}
          />

          {/* Plot border + quadrant dividers */}
          <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} fill="none" stroke="#1C2333" strokeWidth={1} />
          <line x1={MID_X} y1={PAD.top} x2={MID_X} y2={PAD.top + PLOT_H} stroke="#1C2333" strokeWidth={1} />
          <line x1={PAD.left} y1={MID_Y} x2={PAD.left + PLOT_W} y2={MID_Y} stroke="#1C2333" strokeWidth={1} />

          {/* Zone labels */}
          <text x={PAD.left + 10} y={PAD.top + 16} fill="#818CF8" fontSize="10" fontWeight="700" letterSpacing="1">
            THE HIDDEN CORE
          </text>
          <text x={PAD.left + PLOT_W - 10} y={PAD.top + 16} fill="#6E7681" fontSize="10" fontWeight="600" letterSpacing="1" textAnchor="end">
            THE OBVIOUS
          </text>
          <text x={PAD.left + 10} y={PAD.top + PLOT_H - 8} fill="#3D444D" fontSize="10" fontWeight="600" letterSpacing="1">
            THE PERIPHERY
          </text>
          <text x={PAD.left + PLOT_W - 10} y={PAD.top + PLOT_H - 8} fill="#3D444D" fontSize="10" fontWeight="600" letterSpacing="1" textAnchor="end">
            THE NOISE
          </text>

          {/* X-axis reach labels */}
          {REACH_ORDER.map((level, i) => (
            <text
              key={level}
              x={PAD.left + ((i + 0.5) / 4) * PLOT_W}
              y={PAD.top + PLOT_H + 18}
              fill="#6E7681"
              fontSize="9"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              {REACH_LABELS[level].toUpperCase()}
            </text>
          ))}
          <text x={PAD.left + PLOT_W / 2} y={H - 6} fill="#3D444D" fontSize="9" textAnchor="middle" letterSpacing="1">
            REACH →
          </text>

          {/* Y-axis score labels */}
          {[10, 7.5, 5, 2.5].map((score) => (
            <text
              key={score}
              x={PAD.left - 8}
              y={PAD.top + (1 - score / 10) * PLOT_H + 3}
              fill="#6E7681"
              fontSize="9"
              textAnchor="end"
            >
              {score}
            </text>
          ))}
          <text
            x={14}
            y={PAD.top + PLOT_H / 2}
            fill="#3D444D"
            fontSize="9"
            textAnchor="middle"
            letterSpacing="1"
            transform={`rotate(-90 14 ${PAD.top + PLOT_H / 2})`}
          >
            COMPOSITE SCORE →
          </text>

          {/* Dots — labels are hover-only (HTML tooltip overlay below) */}
          {plotted.map(({ item, x, y }, i) => {
            const style = dotStyle(item);
            const isHovered = hovered === i;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isHovered ? 8 : 6}
                {...style}
                style={{ cursor: onSelectItem ? "pointer" : "default", transition: "r 120ms" }}
                onClick={() => onSelectItem?.(item.name)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {/* Hover tooltip — positioned as % of the viewBox so it tracks the scaled SVG */}
        {hovered !== null && plotted[hovered] && (() => {
          const { item, x, y } = plotted[hovered];
          const preferAbove = y > H * 0.3;
          const nearRight = x > W * 0.72;
          const nearLeft = x < W * 0.28;
          return (
            <div
              className="pointer-events-none absolute z-10 w-56 rounded-lg border border-[#1C2333] bg-[#0D1117] p-3 shadow-xl"
              style={{
                left: `${(x / W) * 100}%`,
                top: `${(y / H) * 100}%`,
                transform: `translate(${nearRight ? "-100%" : nearLeft ? "0%" : "-50%"}, ${preferAbove ? "calc(-100% - 12px)" : "12px"})`,
              }}
            >
              <p className="text-xs font-semibold text-[#E8EDF2]">{item.name}</p>
              <p className="mt-1 font-mono text-[11px] text-[#818CF8]">
                composite {item.scores?.composite.toFixed(1)} · {item.reachLevel} reach
              </p>
              {item.convergenceStatus && (
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6E7681]">
                  {item.convergenceStatus}
                </p>
              )}
              {item.behavioralRole && (
                <p className="mt-1.5 text-[11px] italic leading-snug text-[#8B949E]">
                  ↳ {item.behavioralRole}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-[10px] text-[#6E7681]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" /> converged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-amber-400 bg-transparent" /> conflicted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6E7681] opacity-60" /> single-lens
        </span>
      </div>
    </Card>
  );
}
