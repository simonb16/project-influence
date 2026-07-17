import { EntryPoint } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

export function EntryPoints({ data }: { data: EntryPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">▷</span>
        <CardTitle>Entry Points</CardTitle>
        <InfoButton info={SECTION_INFO.entryPoints} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        The specific doors people walk through when first entering this behavior or mindset space.
      </p>
      <div className="space-y-4">
        {data.map((ep, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            {/* Entry point header */}
            <div className="mb-2 flex items-start gap-3">
              <span className="mt-0.5 font-mono text-xs text-[#6366F1]">0{i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm text-[#E8EDF2]">{ep.type}</p>
                  {ep.confidence && (
                    <span
                      className={[
                        "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                        ep.confidence === "high"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : ep.confidence === "medium"
                            ? "bg-[#6366F1]/15 text-[#818CF8]"
                            : "bg-amber-400/10 text-amber-400/80",
                      ].join(" ")}
                    >
                      {ep.confidence}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#8B949E]">{ep.description}</p>
                {ep.rationale && (
                  <p className="mt-1.5 text-[11px] italic text-[#6E7681]">↳ {ep.rationale}</p>
                )}
              </div>
            </div>

            {/* Approach / Avoid guidance */}
            {(ep.approach || ep.avoid) && (
              <div className="mt-3 grid gap-2 border-t border-[#1C2333] pt-3 sm:grid-cols-2">
                {ep.approach && (
                  <div className="rounded border border-emerald-400/15 bg-emerald-400/5 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Approach
                    </p>
                    <p className="text-xs text-[#8B949E]">{ep.approach}</p>
                  </div>
                )}
                {ep.avoid && (
                  <div className="rounded border border-red-400/15 bg-red-400/5 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400/80">
                      Avoid
                    </p>
                    <p className="text-xs text-[#8B949E]">{ep.avoid}</p>
                  </div>
                )}
              </div>
            )}

            {/* Examples */}
            {ep.examples && ep.examples.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-[#1C2333] pt-3">
                {ep.examples.map((ex, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 rounded bg-[#1C2333] px-1.5 py-0.5 text-[10px] font-medium text-[#6E7681]">
                      {ex.platform}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ex.url ? (
                          <a
                            href={ex.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#6366F1] hover:text-[#818CF8] hover:underline truncate"
                          >
                            {ex.title}
                          </a>
                        ) : (
                          <p className="text-xs font-medium text-[#E8EDF2]">{ex.title}</p>
                        )}
                        {ex.unverified && (
                          <span className="shrink-0 rounded border border-dashed border-[#3D444D] px-1 py-px text-[9px] text-[#6E7681]">
                            unverified
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6E7681]">{ex.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
