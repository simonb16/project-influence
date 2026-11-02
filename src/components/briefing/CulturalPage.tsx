"use client";

import { ArchetypeReport } from "@/types";
import { CulturalDiscourse } from "@/components/report/CulturalDiscourse";
import { CulturalDepthCheck } from "@/components/report/CulturalDepthCheck";
import { DarkCanvas, MutedNote } from "./primitives";

// PROVISIONAL HOME — flagged per the Prime Rule. The Cultural tab's sections
// (culturalDiscourse, culturalDepthCheck) are not covered by any row of the
// Round 11A mapping table. They render here unchanged rather than being
// dropped or force-fit into a chapter; their permanent home is a decision for
// the next brief.

export function CulturalPage({ report }: { report: ArchetypeReport }) {
  return (
    <div>
      <div className="b-kicker" style={{ marginBottom: 10 }}>Utility · provisional</div>
      <h1 className="serif" style={{ fontWeight: 500, fontSize: 34, marginBottom: 4 }}>Cultural context</h1>
      <p className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--b-ink2)", marginBottom: 14 }}>
        The cultural discourse and forces informing this audience.
      </p>
      <MutedNote>
        Provisional home: the Cultural sections are not mapped by the 11A brief — parked here unchanged, not dropped.
        Permanent placement is flagged for the next round.
      </MutedNote>
      <DarkCanvas>
        <div className="space-y-5">
          <CulturalDiscourse data={report.culturalDiscourse} />
          <CulturalDepthCheck data={report.culturalDepthCheck} />
        </div>
      </DarkCanvas>
    </div>
  );
}
