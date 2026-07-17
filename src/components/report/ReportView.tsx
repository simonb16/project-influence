"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArchetypeReport } from "@/types";
import { normalizePeriphery } from "@/lib/periphery";
import { InfluenceMap } from "./InfluenceMap";
import { InfluenceQuadrant } from "./InfluenceQuadrant";
import { InfluentialCore } from "./InfluentialCore";
import { DigitalHabitat } from "./DigitalHabitat";
import { CulturalDiscourse } from "./CulturalDiscourse";
import { EmotionalDrivers } from "./EmotionalDrivers";
import { BehavioralSignals } from "./BehavioralSignals";
import { InfluenceSusceptibility } from "./InfluenceSusceptibility";
import { CulturalDepthCheck } from "./CulturalDepthCheck";
import { ResearchDepth } from "./ResearchDepth";
import { EntryPoints } from "./EntryPoints";
import { ActivationPlaybook } from "./ActivationPlaybook";
import { ResearchTrail } from "./ResearchTrail";
import { SourceRanking } from "./SourceRanking";
import { PeripheryMap } from "./PeripheryMap";
import { PeripheryInsights } from "./PeripheryInsights";

interface ReportViewProps {
  report: ArchetypeReport;
  onReset: () => void;
}

type TabId = "influence" | "map" | "entry" | "periphery";

const TABS: Array<{ id: TabId; label: string; sub: string }> = [
  { id: "influence", label: "Influence", sub: "Who matters?" },
  { id: "map", label: "Influence Map", sub: "What moves them?" },
  { id: "entry", label: "Entry Points", sub: "Where to show up" },
  { id: "periphery", label: "Periphery", sub: "Who else are they?" },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-[#6366F1] to-transparent" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#1C2333]" />
    </div>
  );
}

export function ReportView({ report, onReset }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("influence");
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const generatedDate = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Round 2 reports carry audience/brand/context; legacy reports carry query
  const audienceText = report.audience ?? report.query ?? "";
  const normalizedPeriphery = normalizePeriphery(report);
  const peripheryInsights = report.peripheryData?.insights;

  // Quadrant dot click → jump to the item in the Influence Map tab
  const handleQuadrantSelect = useCallback((name: string) => {
    setHighlightItem(name);
    setActiveTab("map");
  }, []);

  // Scroll content to top on tab change (unless jumping to a highlighted item)
  useEffect(() => {
    if (highlightItem && activeTab === "map") return;
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab, highlightItem]);

  function handleTabChange(id: TabId) {
    setHighlightItem(null);
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
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "relative shrink-0 whitespace-nowrap px-4 py-2.5 text-left transition-colors focus:outline-none",
                  isActive ? "text-[#E8EDF2]" : "text-[#6E7681] hover:text-[#8B949E]",
                ].join(" ")}
              >
                <span className="block text-sm font-medium">{tab.label}</span>
                <span className={`block text-[10px] ${isActive ? "text-[#6366F1]" : "text-[#374151]"}`}>
                  {tab.sub}
                </span>
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
        {/* ── Tab 1: Influence — who matters? ── */}
        {activeTab === "influence" && (
          <div className="space-y-5">
            {/* Report header */}
            <div className="mb-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-px max-w-[48px] flex-1 bg-gradient-to-r from-[#6366F1] to-transparent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
                  Influence Report
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#E8EDF2]">{report.archetype}</h2>
              {audienceText && (
                <blockquote className="mt-3 max-w-2xl border-l-2 border-[#6366F1]/40 pl-3 text-sm italic text-[#8B949E]">
                  {audienceText}
                </blockquote>
              )}
              {(report.brand || report.context) && (
                <div className="mt-2 max-w-2xl space-y-1">
                  {report.brand && (
                    <p className="text-xs text-[#6E7681]">
                      <span className="font-semibold uppercase tracking-wider text-[#374151]">Brand · </span>
                      {report.brand}
                    </p>
                  )}
                  {report.context && (
                    <p className="text-xs text-[#6E7681]">
                      <span className="font-semibold uppercase tracking-wider text-[#374151]">Context · </span>
                      {report.context}
                    </p>
                  )}
                </div>
              )}
              <p className="mt-3 max-w-2xl text-sm text-[#8B949E]">{report.summary}</p>
              <p className="mt-2 text-[11px] text-[#6E7681]">Generated {generatedDate}</p>
            </div>

            {report.researchDepth && <ResearchDepth data={report.researchDepth} />}
            {report.influentialCore && <InfluentialCore data={report.influentialCore} />}
            <InfluenceQuadrant items={report.influenceMap} onSelectItem={handleQuadrantSelect} />
          </div>
        )}

        {/* ── Tab 2: Influence Map — what moves them? ── */}
        {activeTab === "map" && (
          <div className="space-y-5">
            <InfluenceMap data={report.influenceMap} highlightName={highlightItem} />

            <SectionHeader label="Emotional Drivers" />
            <EmotionalDrivers data={report.emotionalDrivers} />

            <SectionHeader label="Digital Habitat" />
            <DigitalHabitat data={report.digitalHabitat} />

            <SectionHeader label="Cultural Signals" />
            <div className="grid gap-5 lg:grid-cols-2">
              <CulturalDiscourse data={report.culturalDiscourse} />
              <BehavioralSignals data={report.behavioralSignals} />
            </div>
            <CulturalDepthCheck data={report.culturalDepthCheck} />

            {/* Collapsible research sources */}
            {(report.sources?.length || report.rankedSources?.length) ? (
              <details className="group rounded-xl border border-[#1C2333] bg-[#0D1117]">
                <summary className="cursor-pointer select-none px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E7681] transition-colors hover:text-[#8B949E]">
                  <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
                  Research Sources
                </summary>
                <div className="space-y-5 border-t border-[#1C2333] p-5">
                  <ResearchTrail sources={report.sources} />
                  <SourceRanking data={report.rankedSources} />
                </div>
              </details>
            ) : null}
          </div>
        )}

        {/* ── Tab 3: Entry Points — where to show up ── */}
        {activeTab === "entry" && (
          <div className="space-y-5">
            {report.entryPoints && report.entryPoints.length > 0 ? (
              <EntryPoints data={report.entryPoints} />
            ) : (
              <p className="py-8 text-center text-sm text-[#6E7681]">
                No entry point data in this report.
              </p>
            )}
            {report.influentialCore?.activationRecommendations && (
              <ActivationPlaybook recommendations={report.influentialCore.activationRecommendations} />
            )}
            {report.influenceSusceptibility && (
              <>
                <SectionHeader label="How This Audience Responds to Influence" />
                <InfluenceSusceptibility data={report.influenceSusceptibility} />
              </>
            )}
          </div>
        )}

        {/* ── Tab 4: Periphery — who else are they? ── */}
        {activeTab === "periphery" && (
          <div className="space-y-5">
            {normalizedPeriphery ? (
              <>
                <PeripheryMap archetype={report.archetype} data={normalizedPeriphery} />
                {peripheryInsights && <PeripheryInsights insights={peripheryInsights} />}
              </>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <span className="mb-3 text-2xl text-[#374151]">◎</span>
                <p className="text-sm font-medium text-[#8B949E]">No periphery data available</p>
                <p className="mt-1 max-w-sm text-xs text-[#6E7681]">
                  This report was generated before the Periphery agent was added. Run a new report to
                  map adjacent audiences and interest overlaps.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
