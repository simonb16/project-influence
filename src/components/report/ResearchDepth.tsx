import { ResearchDepth as ResearchDepthType } from "@/types";

interface Metric {
  label: string;
  value: number | string;
  unit?: string;
}

export function ResearchDepth({ data }: { data: ResearchDepthType }) {
  const metrics: Metric[] = [
    { label: "Sources Scanned", value: data.sourcesScanned },
    { label: "Communities Analyzed", value: data.communitiesAnalyzed },
    { label: "Conversations Sampled", value: data.conversationsSampled },
    { label: "Unique Voices Detected", value: data.uniqueVoicesDetected },
    { label: "Search Queries Run", value: data.searchQueriesRun },
    { label: "Platforms Covered", value: data.platformsCovered.length },
  ];

  return (
    <div className="mb-8 rounded-xl border border-[#1C2333] bg-[#0D1117] overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-3 border-b border-[#1C2333] px-5 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] animate-pulse-glow" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6366F1]">
          Research Depth
        </span>
        <span className="ml-auto text-[11px] text-[#6E7681]">
          Live intelligence sweep · {data.platformsCovered.join(" · ")}
        </span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 divide-x divide-[#1C2333] sm:grid-cols-6">
        {metrics.map((metric, i) => (
          <div key={i} className="flex flex-col items-center justify-center px-4 py-4 text-center">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#E8EDF2]">
              {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[#6E7681]">
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
