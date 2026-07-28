"use client";

import { useState } from "react";
import type { NormalizedAdjacency, NormalizedPeriphery } from "@/lib/periphery";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";

// ─── SVG layout ───────────────────────────────────────────────────────────────

const CX = 300;
const CY = 275;
const CENTER_R = 65;
const INNER_R1 = 75;
const INNER_R2 = 155;
const OUTER_R1 = 165;
const OUTER_R2 = 250;
const LABEL_R = 270;

type SegmentKey = "mindset" | "lifestyle" | "interest" | "entertainment";

const SEGMENTS = [
  { key: "mindset" as SegmentKey,       label: "MINDSET",       color: "#6366F1", start: -85, end: -5  },
  { key: "lifestyle" as SegmentKey,     label: "LIFESTYLE",     color: "#10B981", start:   5, end:  85  },
  { key: "interest" as SegmentKey,      label: "INTEREST",      color: "#F59E0B", start:  95, end: 175  },
  { key: "entertainment" as SegmentKey, label: "ENTERTAINMENT", color: "#EC4899", start: 185, end: 265  },
] as const;

const SEGMENT_MAP = Object.fromEntries(SEGMENTS.map(s => [s.key, s])) as Record<SegmentKey, typeof SEGMENTS[number]>;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polar(r: number, deg: number) {
  return { x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) };
}

function arcPath(r1: number, r2: number, a1: number, a2: number) {
  const os = polar(r2, a1);
  const oe = polar(r2, a2);
  const is = polar(r1, a2);
  const ie = polar(r1, a1);
  return `M ${os.x} ${os.y} A ${r2} ${r2} 0 0 1 ${oe.x} ${oe.y} L ${is.x} ${is.y} A ${r1} ${r1} 0 0 0 ${ie.x} ${ie.y} Z`;
}

function truncate(s: string, max = 18) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Place N items radially stacked at midAngle — clean diagonal visual in each quadrant
function getTextPositions(items: NormalizedAdjacency[], r1: number, r2: number, midAngle: number) {
  const midR = (r1 + r2) / 2;
  const span = r2 - r1;
  const offsets =
    items.length === 1 ? [0] :
    items.length === 2 ? [-span * 0.22, span * 0.22] :
    items.length === 3 ? [-span * 0.28, 0, span * 0.28] :
                         [-span * 0.34, -span * 0.11, span * 0.11, span * 0.34];

  return items.map((item, i) => {
    const r = midR + (offsets[i] ?? 0);
    return { ...polar(r, midAngle), item };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PeripheryMapProps {
  archetype: string;
  data: NormalizedPeriphery;
}

export function PeripheryMap({ archetype, data }: PeripheryMapProps) {
  const [selected, setSelected] = useState<SegmentKey | null>(null);

  const selectedSegment = selected ? SEGMENT_MAP[selected] : null;
  const selectedAdjacencies = selected
    ? [...(data[selected] ?? [])].sort((a, b) => b.overlapPct - a.overlapPct)
    : [];

  // Wrap archetype name for center circle — split at ~16 chars
  const arcWords = archetype.split(" ");
  const centerLines: string[] = [];
  let line = "";
  for (const word of arcWords) {
    if ((line + " " + word).trim().length > 16 && line.length > 0) {
      centerLines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) centerLines.push(line);
  const cLineCount = Math.min(centerLines.length, 3);
  const cStartY = CY - (cLineCount - 1) * 8;

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">◎</span>
        <CardTitle>Adjacency Map</CardTitle>
      </CardHeader>

      <p className="mb-6 text-xs text-[#6E7681]">
        Adjacent territories where this audience over-indexes beyond the core topic.
        Inner ring = very high overlap (80–100%). Outer ring = moderate overlap (50–80%).
        Click any segment to explore.
      </p>

      {/* Concentric rings */}
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox="0 0 600 550"
          className="w-full max-w-[600px]"
          style={{ minWidth: 320 }}
        >
          {/* Subtle ring separators */}
          <circle cx={CX} cy={CY} r={OUTER_R2} fill="none" stroke="#1C2333" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={OUTER_R1 - 1} fill="none" stroke="#1C2333" strokeWidth="0.5" strokeDasharray="3 4" />
          <circle cx={CX} cy={CY} r={INNER_R2 + 1} fill="none" stroke="#1C2333" strokeWidth="0.5" strokeDasharray="3 4" />
          <circle cx={CX} cy={CY} r={INNER_R1 - 1} fill="none" stroke="#1C2333" strokeWidth="1" />

          {/* Ring depth labels — placed in the east gap between segments */}
          <text x={CX + INNER_R1 + 6} y={CY + 4} fill="#3D444D" fontSize="7" fontWeight="500" letterSpacing="0.5">INNER</text>
          <text x={CX + OUTER_R1 + 6} y={CY + 4} fill="#3D444D" fontSize="7" fontWeight="500" letterSpacing="0.5">OUTER</text>

          {/* Segment arcs */}
          {SEGMENTS.map(seg => {
            const isSelected = selected === seg.key;
            const isOther = selected !== null && !isSelected;
            const midAngle = (seg.start + seg.end) / 2;

            const innerAdjs = (data[seg.key] ?? []).filter(a => a.ring === "inner");
            const outerAdjs = (data[seg.key] ?? []).filter(a => a.ring === "outer");

            const lp = polar(LABEL_R, midAngle);
            // midAngle between -90° and 90° = right side
            const isRight = midAngle > -90 && midAngle < 90;

            return (
              <g
                key={seg.key}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(prev => prev === seg.key ? null : seg.key)}
              >
                {/* Inner arc */}
                <path
                  d={arcPath(INNER_R1, INNER_R2, seg.start, seg.end)}
                  fill={seg.color}
                  fillOpacity={isSelected ? 0.32 : isOther ? 0.06 : 0.16}
                  stroke={seg.color}
                  strokeOpacity={isSelected ? 0.65 : isOther ? 0.15 : 0.38}
                  strokeWidth="1"
                />
                {/* Outer arc */}
                <path
                  d={arcPath(OUTER_R1, OUTER_R2, seg.start, seg.end)}
                  fill={seg.color}
                  fillOpacity={isSelected ? 0.2 : isOther ? 0.04 : 0.09}
                  stroke={seg.color}
                  strokeOpacity={isSelected ? 0.45 : isOther ? 0.1 : 0.25}
                  strokeWidth="1"
                />

                {/* Inner ring adjacency names */}
                {!isOther && getTextPositions(innerAdjs, INNER_R1, INNER_R2, midAngle).map((tp, i) => (
                  <text
                    key={i}
                    x={tp.x} y={tp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#E8EDF2"
                    fillOpacity={isSelected ? 0.92 : 0.72}
                    fontSize="7.5"
                    fontWeight={isSelected ? "600" : "400"}
                    style={{ cursor: "default" }}
                  >
                    <title>{tp.item.name}</title>
                    {truncate(tp.item.name, 18)}
                  </text>
                ))}

                {/* Outer ring adjacency names */}
                {!isOther && getTextPositions(outerAdjs, OUTER_R1, OUTER_R2, midAngle).map((tp, i) => (
                  <text
                    key={i}
                    x={tp.x} y={tp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#E8EDF2"
                    fillOpacity={isSelected ? 0.88 : 0.62}
                    fontSize="7.5"
                    fontWeight={isSelected ? "600" : "400"}
                    style={{ cursor: "default" }}
                  >
                    <title>{tp.item.name}</title>
                    {truncate(tp.item.name, 18)}
                  </text>
                ))}

                {/* Segment label outside rings */}
                <text
                  x={lp.x}
                  y={lp.y}
                  textAnchor={isRight ? "start" : "end"}
                  dominantBaseline="middle"
                  fill={seg.color}
                  fillOpacity={isSelected ? 1 : isOther ? 0.25 : 0.65}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Center circle */}
          <circle cx={CX} cy={CY} r={CENTER_R} fill="#080B0F" stroke="#1C2333" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r={CENTER_R} fill="none" stroke="#6366F1" strokeWidth="0.5" strokeOpacity="0.3" />

          {/* Center text — archetype name */}
          {centerLines.slice(0, 3).map((ln, i) => (
            <text
              key={i}
              x={CX}
              y={cStartY + i * 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#E8EDF2"
              fontSize="10"
              fontWeight="600"
            >
              {ln}
            </text>
          ))}
          <text
            x={CX}
            y={cStartY + cLineCount * 14 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6E7681"
            fontSize="7"
            letterSpacing="0.5"
          >
            CORE ARCHETYPE
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            onClick={() => setSelected(prev => prev === seg.key ? null : seg.key)}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider transition-opacity"
            style={{
              color: seg.color,
              opacity: selected === null || selected === seg.key ? 1 : 0.35,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </button>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] text-[#3D444D]">
          <span className="inline-block h-3 w-5 rounded-sm bg-[#1C2333]" />
          inner = 80–100%
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#3D444D]">
          <span className="inline-block h-3 w-5 rounded-sm bg-[#1C2333] opacity-50" />
          outer = 50–80%
        </span>
      </div>

      {/* Detail panel */}
      {selected && selectedSegment && selectedAdjacencies.length > 0 && (
        <div className="mt-6 border-t border-[#1C2333] pt-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedSegment.color }} />
              <h4
                className="text-sm font-semibold uppercase tracking-widest"
                style={{ color: selectedSegment.color }}
              >
                {selectedSegment.label}
              </h4>
              <span className="text-xs text-[#6E7681]">— Adjacent Territories</span>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-[#6E7681] transition-colors hover:text-[#E8EDF2]"
            >
              ✕ close
            </button>
          </div>

          <div className="space-y-4">
            {selectedAdjacencies.map((adj, i) => (
              <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#E8EDF2]">{adj.name}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${selectedSegment.color}1A`,
                        color: selectedSegment.color,
                      }}
                    >
                      {adj.ring} ring
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-[#8B949E]">
                    {adj.overlapLabel ?? `${adj.overlapPct}%`}
                  </span>
                </div>

                <div className="mb-3">
                  <ScoreBar score={adj.overlapPct} label="Overlap Strength" />
                </div>

                {adj.description && <p className="mb-2 text-xs text-[#E8EDF2]">{adj.description}</p>}
                <p className="mb-3 text-xs text-[#8B949E]">{adj.evidence}</p>

                {adj.topInfluences && adj.topInfluences.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6E7681]">
                      Top Influences in This Space
                    </p>
                    <div className="space-y-2">
                      {adj.topInfluences.map((inf, j) => (
                        <div
                          key={j}
                          className={[
                            "rounded border bg-[#0D1117] p-2.5",
                            inf.unverified ? "border-dashed border-[#2A3040] opacity-80" : "border-[#1C2333]",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#E8EDF2]">{inf.name}</span>
                              {inf.sourceUrl && (
                                <a
                                  href={inf.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#6366F1]/50 transition-colors hover:text-[#6366F1]"
                                  title="View source"
                                >
                                  ↗
                                </a>
                              )}
                              {inf.unverified && (
                                <span className="rounded border border-dashed border-[#3D444D] px-1 py-px text-[9px] text-[#6E7681]">
                                  unverified
                                </span>
                              )}
                            </div>
                            <span className="rounded bg-[#1C2333] px-1.5 py-0.5 font-mono text-[10px] text-[#8B949E]">
                              {inf.platform}
                            </span>
                          </div>
                          {inf.reach && (
                            <p className="mt-1 text-[10px] text-[#6E7681]">{inf.reach}</p>
                          )}
                          {inf.role && (
                            <p className="mt-1 text-[10px] italic text-[#6366F1]/70">↳ {inf.role}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
