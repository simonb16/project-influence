"use client";

import { ArchetypeReport } from "@/types";
import { MutedNote } from "./primitives";
import { BriefingPageId } from "./BriefingView";

export function SummaryPage({ report, onNavigate }: { report: ArchetypeReport; onNavigate: (p: BriefingPageId) => void }) {
  void report; void onNavigate;
  return <MutedNote>Summary placeholder — lands after the chapter commits (needs their selection logic).</MutedNote>;
}
