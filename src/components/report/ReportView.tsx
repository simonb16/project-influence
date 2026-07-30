"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArchetypeReport } from "@/types";
import { normalizePeriphery } from "@/lib/periphery";
import { TabBar, ReportTab } from "./TabBar";
import { ReportInputs } from "./ReportInputs";
import { ResearchDepthSummary } from "./ResearchDepthSummary";
import { InfluentialCoreDescription, CoreListCard } from "./InfluentialCore";
import { InfluenceMap } from "./InfluenceMap";
import { InfluenceQuadrant } from "./InfluenceQuadrant";
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
import { SignalsSnapshot, SignalTabTarget } from "./SignalsSnapshot";
import { BarriersFrictions } from "./BarriersFrictions";
import { FindabilitySection } from "./FindabilitySection";
import { InMarketBehaviorSection } from "./InMarketBehaviorSection";
import { TrustedVoices } from "./TrustedVoices";
import { TrustTransferPaths } from "./TrustTransferPaths";
import { RealWorldHabitat } from "./RealWorldHabitat";
import { SignalCheck } from "./SignalCheck";
import { CulturalConnectors } from "./CulturalConnectors";

interface ReportViewProps {
  report: ArchetypeReport;
  onReset: () => void;
}

// Signals-of-Influence layout: the Influential Core at the center, four
// signal tabs (Social, Trust, Behavioral, Motivational), plus Cultural
// forces and Adjacencies as outer layers.
type TabId = "core" | "social" | "trust" | "behavioral" | "motivational" | "cultural" | "adjacencies";

const TABS: Array<ReportTab<TabId>> = [
  {
    id: "core",
    label: "The Influential Core",
    sub: "The people within this audience who disproportionately influence what others believe, adopt and share.",
  },
  { id: "social", label: "Social", sub: "The communities and conversations they participate in" },
  { id: "trust", label: "Trust", sub: "Where they look for validation" },
  { id: "behavioral", label: "Behavioral", sub: "How they behave" },
  { id: "motivational", label: "Motivational", sub: "What motivates them" },
  { id: "cultural", label: "Cultural", sub: "The cultural discourse and forces informing them" },
  { id: "adjacencies", label: "Adjacencies", sub: "Cultural adjacencies and overlaps" },
];

function EmptyTabNote({ message }: { message: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
      <span className="mb-3 text-2xl text-[#374151]">◎</span>
      <p className="max-w-sm text-sm text-[#6E7681]">{message}</p>
    </div>
  );
}

export function ReportView({ report, onReset }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("core");
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const core = report.influentialCore;
  const normalizedPeriphery = normalizePeriphery(report);
  const adjacencyInsights = report.peripheryData?.insights;

  // Quadrant dot click → highlight + scroll to the item (both live on Social)
  const handleQuadrantSelect = useCallback((name: string) => {
    setHighlightItem(name);
  }, []);

  // Scroll content to top on tab change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  function handleTabChange(id: TabId) {
    setHighlightItem(null);
    setActiveTab(id);
  }

  return (
    <div className="animate-fade-in-up">
      {/* Top bar: report title + New Analysis button */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="truncate text-xl font-bold text-[#E8EDF2]">{report.archetype}</h2>
        <button
          onClick={onReset}
          className="shrink-0 rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-2 text-sm text-[#8B949E] transition-colors hover:border-[#6366F1]/50 hover:text-[#E8EDF2]"
        >
          ← New Analysis
        </button>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      <div ref={contentRef}>
        {/* ── Tab 1: The Influential Core ── */}
        {activeTab === "core" && (
          <div className="space-y-5">
            <ReportInputs report={report} />
            <ResearchDepthSummary report={report} />
            {report.summary && (
              <p className="max-w-2xl px-1 text-sm text-[#8B949E]">{report.summary}</p>
            )}
            {report.researchDepth && <ResearchDepth data={report.researchDepth} />}
            {core ? (
              <InfluentialCoreDescription data={core} />
            ) : (
              <EmptyTabNote message="This report predates the influential core analysis — run a new report to populate it." />
            )}
            {report.signalsSnapshot && (
              <SignalsSnapshot
                data={report.signalsSnapshot}
                onNavigate={(tab: SignalTabTarget) => handleTabChange(tab)}
              />
            )}
            {report.dataSignals && <SignalCheck data={report.dataSignals} />}
            {report.influenceSusceptibility && (
              <InfluenceSusceptibility data={report.influenceSusceptibility} />
            )}
            {core?.activationRecommendations && (
              <ActivationPlaybook recommendations={core.activationRecommendations} />
            )}
          </div>
        )}

        {/* ── Tab 2: Social ── */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <CoreListCard
              title="Language Codes"
              icon="❞"
              intro="Language patterns that signal belonging to the influential core."
              items={core?.languageCodes}
            />
            <InfluenceMap data={report.influenceMap} highlightName={highlightItem} />
            <DigitalHabitat data={report.digitalHabitat} />
            {report.realWorldHabitat && <RealWorldHabitat data={report.realWorldHabitat} />}
            <InfluenceQuadrant items={report.influenceMap} onSelectItem={handleQuadrantSelect} />

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

        {/* ── Tab 3: Trust ── */}
        {activeTab === "trust" && (
          <div className="space-y-5">
            {core?.trustSignals?.length || report.trustedVoices?.length ? (
              <>
                <CoreListCard
                  title="Trust Signals"
                  icon="✓"
                  intro="What earns belief with the influential core — the voices, evidence, and experiences that carry weight."
                  items={core?.trustSignals}
                />
                {report.trustedVoices && <TrustedVoices data={report.trustedVoices} />}
                <TrustTransferPaths paths={report.influenceSusceptibility?.trustTransferPaths} />
              </>
            ) : (
              <EmptyTabNote message="No trust signal data in this report." />
            )}
          </div>
        )}

        {/* ── Tab 4: Behavioral ── */}
        {activeTab === "behavioral" && (
          <div className="space-y-5">
            {report.entryPoints && report.entryPoints.length > 0 && (
              <EntryPoints data={report.entryPoints} />
            )}
            {report.findability && <FindabilitySection data={report.findability} />}
            {report.inMarketBehavior && <InMarketBehaviorSection data={report.inMarketBehavior} />}
            <BehavioralSignals data={report.behavioralSignals} />
            <CoreListCard
              title="Habitual Behaviors"
              icon="↻"
              intro="Behaviors that define membership in the influential core."
              items={core?.keyBehaviors}
            />
          </div>
        )}

        {/* ── Tab 5: Motivational ── */}
        {activeTab === "motivational" && (
          <div className="space-y-5">
            <EmotionalDrivers data={report.emotionalDrivers} />
            <CoreListCard
              title="Key Tensions"
              icon="⇋"
              intro="The tensions the influential core navigates — friction points that explain why they act."
              items={core?.keyTensions}
            />
            {report.barriers && <BarriersFrictions data={report.barriers} />}
          </div>
        )}

        {/* ── Tab 6: Cultural ── */}
        {activeTab === "cultural" && (
          <div className="space-y-5">
            <CulturalDiscourse data={report.culturalDiscourse} />
            <CulturalDepthCheck data={report.culturalDepthCheck} />
          </div>
        )}

        {/* ── Tab 7: Adjacencies ── */}
        {activeTab === "adjacencies" && (
          <div className="space-y-5">
            {normalizedPeriphery ? (
              <>
                <PeripheryMap archetype={report.archetype} data={normalizedPeriphery} />
                {adjacencyInsights && <PeripheryInsights insights={adjacencyInsights} />}
                {report.peripheryData?.culturalConnectors && (
                  <CulturalConnectors data={report.peripheryData.culturalConnectors} />
                )}
              </>
            ) : (
              <EmptyTabNote message="No adjacency data available — this report was generated before adjacency mapping was added. Run a new report to map adjacent audiences and overlaps." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
