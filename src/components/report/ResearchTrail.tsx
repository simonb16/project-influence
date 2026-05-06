"use client";

import { useState } from "react";
import { AgentSource } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

type SourceCategory = "community" | "creator" | "institutional" | "other";

function categorize(platform: string): SourceCategory {
  const p = platform.toLowerCase();
  if (p.includes("reddit") || p.includes("discord") || p.includes("forum") || p.includes("quora") || p.includes("community")) return "community";
  if (p.includes("youtube") || p.includes("tiktok") || p.includes("instagram") || p.includes("twitter") || p.includes("x.com") || p.includes("podcast") || p.includes("substack")) return "creator";
  if (p.includes("academic") || p.includes("research") || p.includes("journal") || p.includes("news") || p.includes("publication") || p.includes("study")) return "institutional";
  return "other";
}

const categoryLabel: Record<SourceCategory, string> = {
  community: "Community / Forum",
  creator: "Creator / Social",
  institutional: "Institutional",
  other: "Other",
};

const categoryColor: Record<SourceCategory, string> = {
  community: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  creator: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  institutional: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  other: "text-[#6E7681] bg-[#1C2333] border-[#1C2333]",
};

export function ResearchTrail({ sources }: { sources?: AgentSource[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  // Deduplicate by URL or description
  const unique = sources.filter((s, i, arr) =>
    arr.findIndex((x) => (x.url && x.url === s.url) || x.description === s.description) === i
  );

  const total = unique.length;
  const platformSet = new Set(unique.map((s) => s.platform));
  const platformCount = platformSet.size;

  const byCat = (cat: SourceCategory) => unique.filter((s) => categorize(s.platform) === cat).length;
  const communityCount = byCat("community");
  const creatorCount = byCat("creator");
  const institutionalCount = byCat("institutional");

  // Group by platform for the platform breakdown
  const byPlatform = unique.reduce<Record<string, number>>((acc, s) => {
    acc[s.platform] = (acc[s.platform] ?? 0) + 1;
    return acc;
  }, {});
  const topPlatforms = Object.entries(byPlatform)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const displayed = expanded ? unique : unique.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg font-mono text-[#6366F1]">⌖</span>
        <CardTitle>Research Trail</CardTitle>
        <InfoButton info={SECTION_INFO.researchTrail} />
      </CardHeader>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 divide-x divide-[#1C2333] rounded-lg border border-[#1C2333] bg-[#080B0F] overflow-hidden">
        <div className="flex flex-col items-center py-3 px-4 text-center">
          <span className="font-mono text-xl font-bold text-[#E8EDF2]">{total}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6E7681]">Sources Cited</span>
        </div>
        <div className="flex flex-col items-center py-3 px-4 text-center">
          <span className="font-mono text-xl font-bold text-[#E8EDF2]">{platformCount}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6E7681]">Platforms</span>
        </div>
        <div className="flex flex-col items-center py-3 px-4 text-center">
          <span className="font-mono text-xl font-bold text-[#E8EDF2]">{communityCount}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6E7681]">Community Sources</span>
        </div>
      </div>

      {/* Type breakdown pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["community", "creator", "institutional"] as SourceCategory[]).map((cat) => {
          const count = byCat(cat);
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <span
              key={cat}
              className={`rounded border px-2 py-0.5 text-[11px] font-medium ${categoryColor[cat]}`}
            >
              {categoryLabel[cat]}: {count} ({pct}%)
            </span>
          );
        })}
      </div>

      {/* Top platforms */}
      <div className="mb-4 flex flex-wrap gap-2">
        {topPlatforms.map(([platform, count]) => (
          <span key={platform} className="rounded bg-[#1C2333] px-2 py-0.5 text-[11px] text-[#8B949E]">
            {platform} <span className="text-[#6E7681]">×{count}</span>
          </span>
        ))}
      </div>

      {/* Source list */}
      <div className="space-y-2">
        {displayed.map((source, i) => {
          const cat = categorize(source.platform);
          return (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
              <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryColor[cat]}`}>
                {source.platform}
              </span>
              <div className="flex-1 min-w-0">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#6366F1] hover:text-[#818CF8] hover:underline truncate block"
                  >
                    {source.description}
                  </a>
                ) : (
                  <p className="text-xs font-medium text-[#E8EDF2] truncate">{source.description}</p>
                )}
                <p className="mt-0.5 text-[11px] text-[#6E7681]">{source.relevance}</p>
              </div>
            </div>
          );
        })}
      </div>

      {unique.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-lg border border-[#1C2333] py-2 text-xs text-[#6E7681] transition-colors hover:border-[#6366F1]/40 hover:text-[#E8EDF2]"
        >
          {expanded ? "Show fewer sources" : `Show all ${unique.length} sources`}
        </button>
      )}
    </Card>
  );
}
