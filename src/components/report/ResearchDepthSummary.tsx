import { ArchetypeReport } from "@/types";

// One-line report provenance: "6 agents · X web searches · analyzed [date]".
// Search counts aren't tracked by the three-lens pipeline (legacy reports
// carried searchQueriesRun), so the middle segment is conditional.

export function ResearchDepthSummary({ report }: { report: ArchetypeReport }) {
  const isThreeLens = !!report.researchDepth?.lensesUsed;
  const agentCount = isThreeLens ? 6 : 7;
  const searchCount = report.researchDepth?.searchQueriesRun;

  const analyzed = new Date(report.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const parts = [
    `${agentCount} agents`,
    ...(searchCount ? [`${searchCount} web searches`] : []),
    `analyzed ${analyzed}`,
  ];

  return (
    <p className="px-1 text-[11px] text-[#6E7681]">{parts.join(" · ")}</p>
  );
}
