"use client";

import { useState, useRef, useEffect } from "react";
import { ArchetypeReport } from "@/types";
import { InfluenceMap } from "./InfluenceMap";
import { DigitalHabitat } from "./DigitalHabitat";
import { CulturalDiscourse } from "./CulturalDiscourse";
import { EmotionalDrivers } from "./EmotionalDrivers";
import { BehavioralSignals } from "./BehavioralSignals";
import { InfluenceSusceptibility } from "./InfluenceSusceptibility";
import { CulturalDepthCheck } from "./CulturalDepthCheck";
import { ResearchDepth } from "./ResearchDepth";
import { EntryPoints } from "./EntryPoints";
import { ResearchTrail } from "./ResearchTrail";
import { SourceRanking } from "./SourceRanking";
import { FunnelView } from "./FunnelView";
import { PeripheryMap } from "./PeripheryMap";

interface ReportViewProps {
  report: ArchetypeReport;
  onReset: () => void;
}

type TabId =
  | "overview"
  | "influence"
  | "emotional"
  | "digital"
  | "cultural"
  | "periphery"
  | "funnel";

interface Tab {
  id: TabId;
  label: string;
}

const ALL_TABS: Tab[] = [
  { id: "overview",   label: "Overview" },
  { id: "influence",  label: "Influence & Entry" },
  { id: "emotional",  label: "Emotional Landscape" },
  { id: "digital",    label: "Digital Habitat" },
  { id: "cultural",   label: "Cultural Signals" },
  { id: "periphery",  label: "Periphery" },
  { id: "funnel",     label: "Funnel (beta)" },
];

export function ReportView({ report, onReset }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  const generatedDate = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Determine which tabs have data
  const hasPeriphery = !!report.periphery;
  const hasEntryPoints = !!(report.entryPoints && report.entryPoints.length > 0);

  const visibleTabs = ALL_TABS.filter(tab => {
    if (tab.id === "periphery") return hasPeriphery;
    if (tab.id === "influence") return true; // InfluenceMap always present; entry points optional within
    return true;
  });

  // Scroll content to top on tab change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  function handleTabChange(id: TabId) {
    setActiveTab(id);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Top bar: New Analysis button */}
      <div className="mb-4 flex items-center justify-between">
        <div /> {/* spacer */}
        <button
          onClick={onReset}
          className="shrink-0 rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-2 text-sm text-[#8B949E] transition-colors hover:border-[#6366F1]/50 hover:text-[#E8EDF2]"
        >
          ← New Analysis
        </button>
      </div>

      {/* Sticky tab bar — top-[57px] offsets past the 57px site nav */}
      <div className="sticky top-[57px] z-20 -mx-4 mb-6 border-b border-[#1C2333] bg-[#080B0F]/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <nav className="flex overflow-x-auto" aria-label="Report sections">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus:outline-none",
                  isActive
                    ? "text-[#E8EDF2]"
                    : "text-[#6E7681] hover:text-[#8B949E]",
                ].join(" ")}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-t-sm bg-[#6366F1]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div ref={contentRef}>
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Report header */}
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-px max-w-[48px] flex-1 bg-gradient-to-r from-[#6366F1] to-transparent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
                  Intelligence Report
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#E8EDF2]">{report.archetype}</h2>
              {report.query && (
                <blockquote className="mt-3 max-w-2xl border-l-2 border-[#1C2333] pl-3 text-xs italic text-[#6E7681]">
                  {report.query}
                </blockquote>
              )}
              <p className="mt-3 max-w-2xl text-sm text-[#8B949E]">{report.summary}</p>
              <p className="mt-2 text-[11px] text-[#6E7681]">Generated {generatedDate}</p>
            </div>

            {report.researchDepth && <ResearchDepth data={report.researchDepth} />}
            <ResearchTrail sources={report.sources} />
          </div>
        )}

        {/* ── Influence & Entry ── */}
        {activeTab === "influence" && (
          <div className="space-y-5">
            <InfluenceMap data={report.influenceMap} />
            {hasEntryPoints && <EntryPoints data={report.entryPoints!} />}
          </div>
        )}

        {/* ── Emotional Landscape ── */}
        {activeTab === "emotional" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <EmotionalDrivers data={report.emotionalDrivers} />
            <InfluenceSusceptibility data={report.influenceSusceptibility} />
          </div>
        )}

        {/* ── Digital Habitat ── */}
        {activeTab === "digital" && (
          <div className="space-y-5">
            <DigitalHabitat data={report.digitalHabitat} />
            <SourceRanking data={report.rankedSources} />
          </div>
        )}

        {/* ── Cultural Signals ── */}
        {activeTab === "cultural" && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <CulturalDiscourse data={report.culturalDiscourse} />
              <BehavioralSignals data={report.behavioralSignals} />
            </div>
            <CulturalDepthCheck data={report.culturalDepthCheck} />
          </div>
        )}

        {/* ── Periphery ── */}
        {activeTab === "periphery" && hasPeriphery && (
          <PeripheryMap
            archetype={report.archetype}
            summary={report.summary}
            data={report.periphery!}
          />
        )}

        {/* ── Funnel (beta) ── */}
        {activeTab === "funnel" && (
          <FunnelView
            influencers={report.influenceMap}
            emotionalDrivers={report.emotionalDrivers}
            behavioralSignals={report.behavioralSignals}
          />
        )}
      </div>
    </div>
  );
}
