"use client";

import { useState, useRef, useEffect } from "react";
import { ArchetypeReport } from "@/types";
import { normalizePeriphery } from "@/lib/periphery";
import { TabBar, ReportTab } from "./TabBar";
import { InputsModal } from "./InputsModal";
import { CoreHero } from "./CoreHero";
import { ResearchDepthSummary } from "./ResearchDepthSummary";
import { InfluentialCoreDescription, CoreListCard } from "./InfluentialCore";
import { InfluenceMap } from "./InfluenceMap";
import { InfluenceQuadrant } from "./InfluenceQuadrant";
import { SocialSignals } from "./SocialSignals";
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
import { BehavioralBuckets } from "./BehavioralBuckets";
import { TabHeader } from "./TabHeader";

interface ReportViewProps {
  report: ArchetypeReport;
  onReset: () => void;
}

// Round 9: 8 tabs — Trust retired (its sections park in the Graveyard pending
// a Maria decision; the data keeps being produced). The three signal tabs
// carry Maria's purpose-definition subtitles.
type TabId =
  | "core"
  | "social"
  | "behavioral"
  | "motivational"
  | "cultural"
  | "activation"
  | "adjacencies"
  | "graveyard";

const TABS: Array<ReportTab<TabId>> = [
  {
    id: "core",
    label: "The Influential Core",
    sub: "The people within this audience who disproportionately influence what others believe, adopt and share.",
  },
  { id: "social", label: "Social", sub: "How influence moves" },
  { id: "behavioral", label: "Behavioral", sub: "How the audience becomes findable" },
  { id: "motivational", label: "Motivational", sub: "What motivates them to act" },
  { id: "cultural", label: "Cultural", sub: "The cultural discourse and forces informing them" },
  { id: "activation", label: "Activation", sub: "Plays for engaging the core" },
  { id: "adjacencies", label: "Adjacencies", sub: "Cultural adjacencies and overlaps" },
  { id: "graveyard", label: "Graveyard", sub: "Retired sections — kept for reference.", muted: true },
];

function EmptyTabNote({ message }: { message: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
      <span className="mb-3 text-2xl text-[#374151]">◎</span>
      <p className="max-w-sm text-sm text-[#6E7681]">{message}</p>
    </div>
  );
}

/** Muted wrapper for retired Graveyard sections, tagged with former home. */
function GraveyardPlot({ formerly, children }: { formerly: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.05] p-4 opacity-60 transition-opacity hover:opacity-90">
      <p className="eyebrow mb-3 !text-[9px]">formerly: {formerly}</p>
      {children}
    </div>
  );
}

export function ReportView({ report, onReset }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("core");
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const [inputsOpen, setInputsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const core = report.influentialCore;
  const normalizedPeriphery = normalizePeriphery(report);
  const adjacencyInsights = report.peripheryData?.insights;

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
      {/* Header block: title left, Inputs + New Analysis right */}
      <div className="mb-4 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="eyebrow mb-2.5">Audience Report</p>
          <h1 className="truncate text-[27px] font-semibold tracking-[-0.02em] text-[#E8EDF2]">
            {report.archetype}
          </h1>
        </div>
        <div className="flex flex-none gap-2">
          <button
            onClick={() => setInputsOpen(true)}
            className="rounded-md border border-white/[0.12] bg-transparent px-3.5 py-2 text-[12.5px] text-[#E8EDF2]/70 transition-colors hover:border-white/[0.28] hover:text-[#E8EDF2]"
          >
            Inputs
          </button>
          <button
            onClick={onReset}
            className="rounded-md border border-white/[0.12] bg-transparent px-3.5 py-2 text-[12.5px] text-[#E8EDF2]/70 transition-colors hover:border-white/[0.28] hover:text-[#E8EDF2]"
          >
            ← New Analysis
          </button>
        </div>
      </div>

      <InputsModal report={report} open={inputsOpen} onClose={() => setInputsOpen(false)} />

      <TabBar tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      <div ref={contentRef}>
        {/* ── Tab 1: The Influential Core ── */}
        {activeTab === "core" && (
          <div className="space-y-8">
            <CoreHero report={report} />

            {report.summary && (
              <div>
                <p className="eyebrow mb-3.5">The Story</p>
                <p className="max-w-3xl text-[17.5px] leading-[1.6] text-[#E8EDF2]/84">
                  {report.summary}
                </p>
              </div>
            )}

            {core ? (
              <InfluentialCoreDescription data={core} />
            ) : (
              <EmptyTabNote message="This report predates the influential core analysis — run a new report to populate it." />
            )}

            {report.signalsSnapshot && (
              <SignalsSnapshot
                data={report.signalsSnapshot}
                coreNameOverride={core?.coreName}
                onNavigate={(tab: SignalTabTarget) => handleTabChange(tab)}
              />
            )}

            {/* Activation link card — the list itself lives on the Activation tab */}
            {core?.activationRecommendations && core.activationRecommendations.length > 0 && (
              <div className="flex items-center justify-between gap-5 border-t border-white/[0.07] pt-5">
                <div>
                  <p className="mb-1 text-[14.5px] font-medium text-[#E8EDF2]">
                    Activation Recommendations
                  </p>
                  <p className="text-[13px] text-[#E8EDF2]/45">
                    {core.activationRecommendations.length} plays for engaging the core — now its own
                    section.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange("activation")}
                  className="flex-none rounded-md border border-white/[0.14] px-3.5 py-2.5 font-mono text-xs font-medium tracking-[0.06em] text-[#E8EDF2]/80 transition-colors hover:border-white/[0.3] hover:text-[#E8EDF2]"
                >
                  OPEN →
                </button>
              </div>
            )}

            <ResearchDepthSummary report={report} />
          </div>
        )}

        {/* ── Tab 2: Social — Signal Map + unified signal cards ── */}
        {activeTab === "social" && (
          <div className="space-y-5">
            <TabHeader
              title="Social"
              purpose="How influence moves"
              useIt="use it to find the right voices, communities and environments"
            />
            <SocialSignals report={report} />

            {/* Language Codes at the bottom (moved from top) */}
            <CoreListCard
              title="Language Codes"
              icon="❞"
              intro="Common themes in the language this audience uses."
              items={core?.languageCodes}
            />

            {(report.sources?.length || report.rankedSources?.length) ? (
              <details className="group rounded-xl border border-[#1C2333] bg-[#0D1117]">
                <summary className="cursor-pointer select-none px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E7681] transition-colors hover:text-[#8B949E]">
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

        {/* ── Tab 3: Behavioral ── Round 9: four observable-behavior buckets.
            Old reports (no behavioralBuckets) render the legacy layout — the
            6a transitional pattern. */}
        {activeTab === "behavioral" && (
          <div className="space-y-5">
            <TabHeader
              title="Behavioral"
              purpose="How the audience becomes findable"
              useIt="use it to build targetable audiences from observable behavior"
            />
            {report.behavioralBuckets && report.behavioralBuckets.length > 0 ? (
              <BehavioralBuckets data={report.behavioralBuckets} />
            ) : (
              <>
                {report.findability && <FindabilitySection data={report.findability} />}
                {report.inMarketBehavior && <InMarketBehaviorSection data={report.inMarketBehavior} />}
                <BehavioralSignals data={report.behavioralSignals} />
                <CoreListCard
                  title="Habitual Behaviors"
                  icon="↻"
                  intro="Behaviors that define membership in the influential core."
                  items={core?.keyBehaviors}
                />
              </>
            )}
            {/* Affinity Adjacencies stays at the bottom of Behavioral — it's
                behavioral-adjacent and Maria didn't flag it. */}
            {report.behavioralBuckets && report.behavioralBuckets.length > 0 &&
              report.findability?.affinityAdjacencies && report.findability.affinityAdjacencies.length > 0 && (
              <div className="rounded-xl border border-[#1C2333] bg-[#0D1117] p-5">
                <p className="eyebrow mb-1.5 !text-[11px] !tracking-[0.18em] !text-[#6366F1]">Affinity Adjacencies</p>
                <p className="mb-3.5 text-xs text-[#6E7681]">Non-obvious interest overlaps usable for lookalike or affinity targeting.</p>
                <ul className="space-y-2">
                  {report.findability.affinityAdjacencies.map((a, i) => (
                    <li key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3 text-sm">
                      <span className="font-medium text-[#E8EDF2]">{a.interest}</span>
                      <span className="text-[#8B949E]"> — {a.rationale}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Motivational ── content unchanged this round (Maria's
            messaging framework is TBD) — the header sets the destination. */}
        {activeTab === "motivational" && (
          <div className="space-y-5">
            <TabHeader
              title="Motivational"
              purpose="What motivates them to act"
              useIt="use it to inform messaging"
            />
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

        {/* ── Tab 6: Activation ── Round 9: Entry Points (with Approach/Avoid)
            moved here from Behavioral — unchanged content, new home. */}
        {activeTab === "activation" && (
          <div className="space-y-5">
            {report.entryPoints && report.entryPoints.length > 0 && (
              <EntryPoints data={report.entryPoints} />
            )}
            {core?.activationRecommendations && core.activationRecommendations.length > 0 ? (
              <ActivationPlaybook recommendations={core.activationRecommendations} />
            ) : !report.entryPoints?.length ? (
              <EmptyTabNote message="No activation recommendations in this report." />
            ) : null}
          </div>
        )}

        {/* ── Tab 8: Adjacencies ── */}
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

        {/* ── Tab 8: Graveyard — retired sections, kept renderable ── */}
        {activeTab === "graveyard" && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow mb-1.5">Graveyard</p>
              <p className="text-sm text-[#E8EDF2]/45">Retired sections — kept for reference.</p>
            </div>

            {/* Round 9: the Trust tab's three sections park here AS-IS — a
                park, not a deletion. Resurrection (e.g. Trusted Voices inside
                Social) is a pending Maria decision; the data keeps being
                produced so that would be a UI-only move. */}
            {(core?.trustSignals?.length || report.trustedVoices?.length ||
              report.influenceSusceptibility?.trustTransferPaths?.length) ? (
              <>
                {core?.trustSignals && core.trustSignals.length > 0 && (
                  <GraveyardPlot formerly="Trust tab">
                    <CoreListCard
                      title="Trust Signals"
                      icon="✓"
                      intro="What earns belief with the influential core — the voices, evidence, and experiences that carry weight."
                      items={core.trustSignals}
                    />
                  </GraveyardPlot>
                )}
                {report.trustedVoices && report.trustedVoices.length > 0 && (
                  <GraveyardPlot formerly="Trust tab">
                    <TrustedVoices data={report.trustedVoices} />
                  </GraveyardPlot>
                )}
                {report.influenceSusceptibility?.trustTransferPaths?.length ? (
                  <GraveyardPlot formerly="Trust tab">
                    <TrustTransferPaths paths={report.influenceSusceptibility.trustTransferPaths} />
                  </GraveyardPlot>
                ) : null}
              </>
            ) : null}

            {/* Round 9: sections that left the Behavioral tab when the
                four-bucket layout replaced them (new reports only — old
                reports still render these on Behavioral itself). */}
            {report.behavioralBuckets && report.behavioralBuckets.length > 0 && (
              <>
                <GraveyardPlot formerly="Behavioral tab">
                  <BehavioralSignals data={report.behavioralSignals} />
                </GraveyardPlot>
                {core?.keyBehaviors && core.keyBehaviors.length > 0 && (
                  <GraveyardPlot formerly="Behavioral tab">
                    <CoreListCard
                      title="Habitual Behaviors"
                      icon="↻"
                      intro="Behaviors that define membership in the influential core."
                      items={core.keyBehaviors}
                    />
                  </GraveyardPlot>
                )}
                {report.inMarketBehavior && (
                  <GraveyardPlot formerly="Behavioral tab">
                    <InMarketBehaviorSection data={report.inMarketBehavior} />
                  </GraveyardPlot>
                )}
                {report.findability && (
                  <GraveyardPlot formerly="Behavioral tab">
                    <FindabilitySection data={report.findability} />
                  </GraveyardPlot>
                )}
              </>
            )}

            {report.researchDepth && (
              <GraveyardPlot formerly="The Influential Core tab">
                <ResearchDepth data={report.researchDepth} />
              </GraveyardPlot>
            )}
            {report.influenceSusceptibility && (
              <GraveyardPlot formerly="The Influential Core tab">
                <InfluenceSusceptibility data={report.influenceSusceptibility} />
              </GraveyardPlot>
            )}
            {report.dataSignals && (
              <GraveyardPlot formerly="The Influential Core tab">
                <SignalCheck data={report.dataSignals} />
              </GraveyardPlot>
            )}
            <GraveyardPlot formerly="Social tab">
              <InfluenceQuadrant
                items={report.influenceMap}
                onSelectItem={(name) => setHighlightItem(name)}
              />
            </GraveyardPlot>
            {/* Influence Map cards — superseded on Social by the unified signal
                cards, parked here so the quadrant click-through still works and
                the per-item detail (convergence, sources, coreVsBase) stays
                reachable. */}
            <GraveyardPlot formerly="Social tab">
              <InfluenceMap data={report.influenceMap} highlightName={highlightItem} />
            </GraveyardPlot>
          </div>
        )}
      </div>
    </div>
  );
}
