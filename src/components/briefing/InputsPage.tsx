"use client";

import { ArchetypeReport } from "@/types";
import { MutedNote } from "./primitives";

export function InputsPage({ report, reportId }: { report: ArchetypeReport; reportId: string }) {
  void report; void reportId;
  return <MutedNote>Report inputs placeholder — lands with Part 6.</MutedNote>;
}
