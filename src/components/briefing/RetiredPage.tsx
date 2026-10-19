"use client";

import { ArchetypeReport } from "@/types";
import { useState } from "react";
import { CoreListCard } from "@/components/report/InfluentialCore";
import { TrustedVoices } from "@/components/report/TrustedVoices";
import { TrustTransferPaths } from "@/components/report/TrustTransferPaths";
import { BehavioralSignals } from "@/components/report/BehavioralSignals";
import { ResearchDepth } from "@/components/report/ResearchDepth";
import { InfluenceQuadrant } from "@/components/report/InfluenceQuadrant";
import { InfluenceMap } from "@/components/report/InfluenceMap";
import { DarkCanvas, MutedNote } from "./primitives";

// Retired sections (utility) — the Graveyard, renamed and demoted from the
// nav bar. Contents unchanged: the existing dark components render as-is on
// their own canvas. Trust sections stay parked pending Maria.
//
// Moved OUT per the Round 11A mapping table (explicit rows win over
// "contents unchanged"): susceptibility content → Chapter 01; Data Signals /
// Signal Check → Evidence & sources; In-Market Behavior → Chapter 02 (Buy).

function Plot({ formerly, children }: { formerly: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--b-ink3)", marginBottom: 6 }}>
        formerly: {formerly}
      </p>
      <DarkCanvas>{children}</DarkCanvas>
    </div>
  );
}

export function RetiredPage({ report }: { report: ArchetypeReport }) {
  const core = report.influentialCore;
  const [highlightItem, setHighlightItem] = useState<string | null>(null);

  return (
    <div>
      <div className="b-kicker" style={{ marginBottom: 10 }}>Utility</div>
      <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, marginBottom: 4 }}>Retired sections</h1>
      <p className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--b-ink2)", marginBottom: 30 }}>
        Kept for reference — parked, not deleted. Trust sections await the Maria checkpoint.
      </p>

      {core?.trustSignals && core.trustSignals.length > 0 && (
        <Plot formerly="Trust tab">
          <CoreListCard
            title="Trust Signals"
            icon="✓"
            intro="What earns belief with the influential core — the voices, evidence, and experiences that carry weight."
            items={core.trustSignals}
          />
        </Plot>
      )}
      {report.trustedVoices && report.trustedVoices.length > 0 && (
        <Plot formerly="Trust tab">
          <TrustedVoices data={report.trustedVoices} />
        </Plot>
      )}
      {report.influenceSusceptibility?.trustTransferPaths?.length ? (
        <Plot formerly="Trust tab">
          <TrustTransferPaths paths={report.influenceSusceptibility.trustTransferPaths} />
        </Plot>
      ) : null}

      {report.behavioralSignals && report.behavioralSignals.length > 0 && (
        <Plot formerly="Behavioral tab">
          <BehavioralSignals data={report.behavioralSignals} />
        </Plot>
      )}
      {core?.keyBehaviors && core.keyBehaviors.length > 0 && (
        <Plot formerly="Behavioral tab">
          <CoreListCard
            title="Habitual Behaviors"
            icon="↻"
            intro="Behaviors that define membership in the influential core."
            items={core.keyBehaviors}
          />
        </Plot>
      )}

      {report.researchDepth && (
        <Plot formerly="The Influential Core tab">
          <ResearchDepth data={report.researchDepth} />
        </Plot>
      )}

      <Plot formerly="Social tab">
        <InfluenceQuadrant items={report.influenceMap} onSelectItem={(name) => setHighlightItem(name)} />
      </Plot>
      <Plot formerly="Social tab">
        <InfluenceMap data={report.influenceMap} highlightName={highlightItem} />
      </Plot>

      <MutedNote>
        Moved to first-class homes this round: susceptibility → Chapter 01 · data signals → Evidence &amp; sources ·
        in-market behavior → Chapter 02.
      </MutedNote>
    </div>
  );
}
