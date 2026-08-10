"use client";

import { useMemo, useState } from "react";
import { ArchetypeReport, ReachLevel } from "@/types";

// Round 6a Social tab: Signal Map scatter + unified signal cards, per Maria's
// `Influential Core + Influence Signals.html` mockup.
//
// TRANSITIONAL: replaced by native socialSignals in Round 6b. Until then, the
// card list is derived from existing report data (Digital Habitat, Real World
// Habitat, Influence Map, Findability) via mapReportToSignals below.

export type SignalType = "content" | "digital" | "physical";

export interface SocialSignalCard {
  id: string;
  type: SignalType;
  title: string;
  where?: string;
  who?: string;
  body: string;
  strength: number; // 0-100
  scale: ReachLevel;
  targets: Array<{ platform: string; detail: string }>;
}

const TYPE_META: Record<SignalType, { label: string; color: string; border: string }> = {
  content: { label: "CONTENT TYPE", color: "#818CF8", border: "rgba(129,140,248,.3)" },
  digital: { label: "DIGITAL SPACES", color: "#38BDF8", border: "rgba(56,189,248,.3)" },
  physical: { label: "PHYSICAL SPACES", color: "#FBBF24", border: "rgba(251,191,36,.3)" },
};

const SCALE_ORDER: ReachLevel[] = ["micro", "niche", "significant", "mainstream"];

// ─── TRANSITIONAL mapping (Round 6b replaces this with native data) ──────────

function findabilityTargetsFor(
  report: ArchetypeReport,
  where: string | undefined
): Array<{ platform: string; detail: string }> {
  const f = report.findability;
  if (!f?.platformConcentrations || !where) return [];
  const w = where.toLowerCase();
  return f.platformConcentrations
    .filter((pc) => w.includes(pc.platform.toLowerCase()) || pc.platform.toLowerCase().includes(w))
    .slice(0, 3)
    .map((pc) => ({
      platform: pc.platform,
      detail: pc.spaces?.length ? pc.spaces.join(", ") : pc.note,
    }));
}

export function mapReportToSignals(report: ArchetypeReport): SocialSignalCard[] {
  const cards: SocialSignalCard[] = [];
  const influenceByName = report.influenceMap ?? [];

  // Influence Map items → CONTENT TYPE
  influenceByName.forEach((item, i) => {
    cards.push({
      id: `sig-content-${i}`,
      type: "content",
      title: item.name,
      where: item.platform,
      body: [item.description, item.behavioralRole ? `↳ ${item.behavioralRole}` : ""]
        .filter(Boolean)
        .join(" "),
      strength: item.intensityScore,
      scale: item.reachLevel ?? "niche",
      targets: findabilityTargetsFor(report, item.platform),
    });
  });

  // Digital Habitat items → DIGITAL SPACES
  (report.digitalHabitat ?? []).forEach((place, i) => {
    // reachLevel from a loosely-matching influence item, else NICHE
    const match = influenceByName.find(
      (inf) =>
        inf.name.toLowerCase().includes(place.community.toLowerCase()) ||
        place.community.toLowerCase().includes(inf.name.toLowerCase())
    );
    cards.push({
      id: `sig-digital-${i}`,
      type: "digital",
      title: place.community,
      where: place.platform,
      body: place.description,
      strength: place.engagementIntensity,
      scale: match?.reachLevel ?? "niche",
      targets: findabilityTargetsFor(report, place.platform),
    });
  });

  // Real World Habitat items → PHYSICAL SPACES (inherently local → micro/niche)
  (report.realWorldHabitat ?? []).forEach((ctx, i) => {
    cards.push({
      id: `sig-physical-${i}`,
      type: "physical",
      title: ctx.context,
      where: ctx.context,
      body: `${ctx.description} ${ctx.evidence ? `Evidence: “${ctx.evidence}”` : ""}`.trim(),
      strength: ctx.strength,
      scale: "niche",
      targets: [],
    });
  });

  // Suppress WHERE when it just repeats the card title (common for physical
  // contexts, where the place IS the title)
  for (const card of cards) {
    if (card.where && card.where.trim().toLowerCase() === card.title.trim().toLowerCase()) {
      card.where = undefined;
    }
  }

  return cards.sort((a, b) => b.strength - a.strength);
}

// ─── Signal Map (scatter) ────────────────────────────────────────────────────

const W = 680;
const H = 340;
const PAD = { top: 16, right: 16, bottom: 34, left: 40 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MIN_STRENGTH = 30; // y-axis floor per mockup (labels 40-100)

function plotSignals(cards: SocialSignalCard[]) {
  const perCell: Record<string, number> = {};
  return cards.map((card) => {
    const col = SCALE_ORDER.indexOf(card.scale);
    const key = `${card.scale}`;
    const n = (perCell[key] = (perCell[key] ?? 0) + 1);
    const jitter = ((n % 5) - 2) * (PLOT_W / 4 / 7);
    const x = PAD.left + ((col + 0.5) / 4) * PLOT_W + jitter;
    const clamped = Math.max(MIN_STRENGTH, Math.min(100, card.strength));
    const y = PAD.top + (1 - (clamped - MIN_STRENGTH) / (100 - MIN_STRENGTH)) * PLOT_H;
    return { card, x, y };
  });
}

function SignalMap({
  cards,
  onSelect,
}: {
  cards: SocialSignalCard[];
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const plotted = useMemo(() => plotSignals(cards), [cards]);
  if (plotted.length === 0) return null;

  const cornerLabel = "font-mono text-[9px] font-medium tracking-[0.14em]";

  return (
    <div className="pb-8">
      <p className="eyebrow mb-2">Signal Map</p>
      <p className="mb-4 text-[13.5px] text-[#E8EDF2]/45">
        Signal strength against signal scale. Color is signal type. Click a dot to jump to the signal.
      </p>
      <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.014] p-5 pb-3.5">
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }}>
            {/* Frame + gridlines */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="rgba(255,255,255,.09)" />
            <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="rgba(255,255,255,.09)" />
            <line x1={PAD.left} y1={PAD.top + PLOT_H * 0.333} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H * 0.333} stroke="rgba(255,255,255,.05)" />
            <line x1={PAD.left} y1={PAD.top + PLOT_H * 0.666} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H * 0.666} stroke="rgba(255,255,255,.05)" />
            <line x1={PAD.left + PLOT_W / 2} y1={PAD.top} x2={PAD.left + PLOT_W / 2} y2={PAD.top + PLOT_H} stroke="rgba(255,255,255,.07)" />

            {/* Y labels */}
            {[100, 80, 60, 40].map((v) => (
              <text
                key={v}
                x={PAD.left - 8}
                y={PAD.top + (1 - (v - MIN_STRENGTH) / (100 - MIN_STRENGTH)) * PLOT_H + 3}
                textAnchor="end"
                fill="rgba(232,237,242,.32)"
                fontSize="9"
                fontFamily="var(--font-jetbrains-mono), monospace"
              >
                {v}
              </text>
            ))}

            {/* Corner labels */}
            <text x={PAD.left + 12} y={PAD.top + 14} fill="rgba(129,140,248,.6)" fontSize="9" letterSpacing="1.3" fontFamily="var(--font-jetbrains-mono), monospace">CONCENTRATED CONVICTION</text>
            <text x={PAD.left + PLOT_W - 12} y={PAD.top + 14} textAnchor="end" fill="rgba(232,237,242,.28)" fontSize="9" letterSpacing="1.3" fontFamily="var(--font-jetbrains-mono), monospace">SCALED MOMENTUM</text>
            <text x={PAD.left + 12} y={PAD.top + PLOT_H - 8} fill="rgba(232,237,242,.2)" fontSize="9" letterSpacing="1.3" fontFamily="var(--font-jetbrains-mono), monospace">BACKGROUND ACTIVITY</text>
            <text x={PAD.left + PLOT_W - 12} y={PAD.top + PLOT_H - 8} textAnchor="end" fill="rgba(232,237,242,.2)" fontSize="9" letterSpacing="1.3" fontFamily="var(--font-jetbrains-mono), monospace">WIDESPREAD INTEREST</text>

            {/* X-axis scale labels */}
            {SCALE_ORDER.map((level, i) => (
              <text
                key={level}
                x={PAD.left + ((i + 0.5) / 4) * PLOT_W}
                y={H - 10}
                textAnchor="middle"
                fill="rgba(232,237,242,.32)"
                fontSize="9"
                letterSpacing="1.1"
                fontFamily="var(--font-jetbrains-mono), monospace"
              >
                {level.toUpperCase()}
              </text>
            ))}

            {/* Dots */}
            {plotted.map(({ card, x, y }, i) => (
              <circle
                key={card.id}
                cx={x}
                cy={y}
                r={hovered === i ? 8 : 6}
                fill={TYPE_META[card.type].color}
                fillOpacity={hovered === i ? 1 : 0.85}
                style={{ cursor: "pointer", transition: "r 120ms" }}
                onClick={() => onSelect(card.id)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          {/* Hover tooltip — same pattern as the Influence Quadrant (Round 5) */}
          {hovered !== null && plotted[hovered] && (() => {
            const { card, x, y } = plotted[hovered];
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
                <p className="text-xs font-semibold text-[#E8EDF2]">{card.title}</p>
                <p className="mt-1 font-mono text-[11px]" style={{ color: TYPE_META[card.type].color }}>
                  strength {card.strength} · {card.scale}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-3">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(TYPE_META) as SignalType[]).map((t) => (
              <span key={t} className="flex items-center gap-2 font-mono text-[9px] font-medium tracking-[0.1em] text-[#E8EDF2]/45">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_META[t].color }} />
                {t.toUpperCase()}
              </span>
            ))}
          </div>
          <span className="font-mono text-[9px] font-medium tracking-[0.12em] text-[#E8EDF2]/28">
            ↑ SIGNAL STRENGTH · SCALE →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

type Filter = "all" | SignalType;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "content", label: "Content" },
  { id: "digital", label: "Digital spaces" },
  { id: "physical", label: "Physical spaces" },
];

function SignalCardView({ card, num }: { card: SocialSignalCard; num: number }) {
  const meta = TYPE_META[card.type];
  const hasRail = card.targets.length > 0;
  return (
    <div
      id={card.id}
      className={`grid scroll-mt-20 rounded-[10px] border border-white/[0.08] bg-white/[0.016] transition-colors hover:border-white/[0.16] ${hasRail ? "lg:grid-cols-[minmax(0,1fr)_268px]" : ""}`}
    >
      <div className="p-5 sm:p-[22px]">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="font-mono text-[10px] font-medium text-[#E8EDF2]/32">
            #{String(num).padStart(2, "0")}
          </span>
          <span
            className="whitespace-nowrap rounded border px-1.5 py-1 font-mono text-[9px] font-bold tracking-[0.14em]"
            style={{ color: meta.color, borderColor: meta.border }}
          >
            {meta.label}
          </span>
        </div>
        <p className="mb-3.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-[#E8EDF2]">
          {card.title}
        </p>
        <div className="mb-3.5 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3.5 gap-y-1.5">
          {card.where && (
            <>
              <span className="font-mono text-[9px] font-medium leading-relaxed tracking-[0.13em] text-[#E8EDF2]/34">WHERE</span>
              <span className="text-[13.5px] leading-relaxed text-[#E8EDF2]/80">{card.where}</span>
            </>
          )}
          {card.who && (
            <>
              <span className="font-mono text-[9px] font-medium leading-relaxed tracking-[0.13em] text-[#E8EDF2]/34">WHO</span>
              <span className="text-[13.5px] leading-relaxed text-[#E8EDF2]/80">{card.who}</span>
            </>
          )}
        </div>
        <p className="mb-3.5 text-sm leading-[1.58] text-[#E8EDF2]/62">{card.body}</p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] font-medium tracking-[0.13em] text-[#E8EDF2]/34">STRENGTH</span>
          <span className="h-[3px] flex-1 rounded-full bg-white/[0.07]">
            <span
              className="block h-[3px] rounded-full"
              style={{ width: `${card.strength}%`, backgroundColor: meta.color }}
            />
          </span>
          <span className="font-mono text-[13px] font-bold" style={{ color: meta.color }}>
            {card.strength}
          </span>
        </div>
      </div>

      {hasRail && (
        <div className="border-t border-white/[0.07] bg-white/[0.012] p-5 lg:border-l lg:border-t-0">
          <p className="mb-3 font-mono text-[9px] font-medium tracking-[0.13em] text-[#E8EDF2]/34">
            TARGETABLE SIGNALS
          </p>
          <div className="flex flex-col gap-2.5">
            {card.targets.map((t, i) => (
              <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)] items-baseline gap-2.5">
                <span className="font-mono text-[9.5px] font-medium leading-snug" style={{ color: meta.color }}>
                  {t.platform}
                </span>
                <span className="text-[12.5px] leading-snug text-[#E8EDF2]/70">{t.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SocialSignals({ report }: { report: ArchetypeReport }) {
  const [filter, setFilter] = useState<Filter>("all");
  const cards = useMemo(() => mapReportToSignals(report), [report]);
  const visible = filter === "all" ? cards : cards.filter((c) => c.type === filter);

  // Generic targetable block: only when findability exists but no card matched it
  const anyCardHasTargets = cards.some((c) => c.targets.length > 0);
  const f = report.findability;
  const showGenericTargets = !!f && !anyCardHasTargets;

  const handleSelect = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[#6E7681]">No social signal data in this report.</p>
    );
  }

  return (
    <div>
      <SignalMap cards={visible} onSelect={handleSelect} />

      <div className="pb-5">
        <h2 className="mb-2.5 text-xl font-semibold leading-snug tracking-[-0.015em] text-[#E8EDF2]">
          The signals that reveal what communities and conversations the Influential Core actively
          participate in
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((fl) => {
            const on = filter === fl.id;
            return (
              <button
                key={fl.id}
                onClick={() => setFilter(fl.id)}
                className={[
                  "rounded-md border px-3 py-1.5 text-xs transition-colors",
                  on
                    ? "border-[#6366F1]/60 bg-[#6366F1]/15 text-[#E8EDF2]"
                    : "border-white/[0.1] text-[#E8EDF2]/50 hover:border-white/[0.24] hover:text-[#E8EDF2]/80",
                ].join(" ")}
              >
                {fl.label}
              </button>
            );
          })}
        </div>
      </div>

      {showGenericTargets && (
        <div className="mb-3 rounded-[10px] border border-white/[0.08] bg-white/[0.012] p-5">
          <p className="mb-3 font-mono text-[9px] font-medium tracking-[0.13em] text-[#E8EDF2]/34">
            TARGETABLE SIGNALS
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {f!.platformConcentrations?.map((pc, i) => (
              <div key={i} className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-2.5">
                <span className="font-mono text-[9.5px] font-medium text-[#818CF8]">{pc.platform}</span>
                <span className="text-[12.5px] leading-snug text-[#E8EDF2]/70">
                  {pc.spaces?.length ? pc.spaces.join(", ") : pc.note}
                </span>
              </div>
            ))}
            {!!f!.searchBehaviors?.length && (
              <div className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-2.5">
                <span className="font-mono text-[9.5px] font-medium text-[#818CF8]">Search</span>
                <span className="text-[12.5px] leading-snug text-[#E8EDF2]/70">
                  {f!.searchBehaviors.slice(0, 6).join(" · ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pb-10">
        {visible.map((card, i) => (
          <SignalCardView key={card.id} card={card} num={i + 1} />
        ))}
      </div>
    </div>
  );
}
