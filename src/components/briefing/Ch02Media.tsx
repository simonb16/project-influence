"use client";

import { ArchetypeReport } from "@/types";
import { DarkCanvas, MutedNote } from "./primitives";

// Round 11A step-1 placeholder: existing content routed in, dark-wrapped.
// Replaced by the real chapter implementation in the per-chapter commits.
export function Ch02Media({ report }: { report: ArchetypeReport }) {
  void report;
  return (
    <DarkCanvas>
      <MutedNote>Ch02Media placeholder — content lands in the per-chapter commit.</MutedNote>
    </DarkCanvas>
  );
}
