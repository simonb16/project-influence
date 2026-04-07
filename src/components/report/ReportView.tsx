"use client";

import { ArchetypeReport } from "@/types";
import { InfluenceMap } from "./InfluenceMap";
import { DigitalHabitat } from "./DigitalHabitat";
import { CulturalDiscourse } from "./CulturalDiscourse";
import { EmotionalDrivers } from "./EmotionalDrivers";
import { BehavioralSignals } from "./BehavioralSignals";
import { InfluenceSusceptibility } from "./InfluenceSusceptibility";
import { CulturalDepthCheck } from "./CulturalDepthCheck";
import { ResearchDepth } from "./ResearchDepth";

interface ReportViewProps {
  report: ArchetypeReport;
  onReset: () => void;
}

export function ReportView({ report, onReset }: ReportViewProps) {
  const generatedDate = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="animate-fade-in-up">
      {/* Report Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-[#6366F1] to-transparent max-w-[48px]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6366F1]">
              Intelligence Report
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#E8EDF2]">{report.archetype}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#8B949E]">{report.summary}</p>
          <p className="mt-2 text-[11px] text-[#6E7681]">Generated {generatedDate}</p>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 rounded-lg border border-[#1C2333] bg-[#0D1117] px-4 py-2 text-sm text-[#8B949E] transition-colors hover:border-[#6366F1]/50 hover:text-[#E8EDF2]"
        >
          ← New Analysis
        </button>
      </div>

      {/* Research Depth Bar */}
      {report.researchDepth && <ResearchDepth data={report.researchDepth} />}

      {/* Report Grid */}
      <div className="space-y-5">
        {/* Row 1: Influence Map (full width) */}
        <InfluenceMap data={report.influenceMap} />

        {/* Row 2: Emotional Drivers + Susceptibility */}
        <div className="grid gap-5 lg:grid-cols-2">
          <EmotionalDrivers data={report.emotionalDrivers} />
          <InfluenceSusceptibility data={report.influenceSusceptibility} />
        </div>

        {/* Row 3: Digital Habitat (full width) */}
        <DigitalHabitat data={report.digitalHabitat} />

        {/* Row 4: Discourse + Behavioral */}
        <div className="grid gap-5 lg:grid-cols-2">
          <CulturalDiscourse data={report.culturalDiscourse} />
          <BehavioralSignals data={report.behavioralSignals} />
        </div>

        {/* Row 5: Cultural Depth Check (full width) */}
        <CulturalDepthCheck data={report.culturalDepthCheck} />
      </div>
    </div>
  );
}
