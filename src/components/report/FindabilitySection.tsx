import { Findability } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

function ChipGroup({ label, chips }: { label: string; chips?: string[] }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6E7681]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <span key={i} className="rounded-md border border-[#1C2333] bg-[#080B0F] px-2 py-1 text-xs text-[#8B949E]">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FindabilitySection({ data }: { data: Findability }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⌖</span>
        <CardTitle>Findability</CardTitle>
        <InfoButton info={SECTION_INFO.findability} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">Targetable signals for reaching the core.</p>

      <div className="space-y-4">
        <ChipGroup label="Targetable Interests" chips={data.targetableInterests} />
        <ChipGroup label="Search Behaviors" chips={data.searchBehaviors} />

        {data.platformConcentrations && data.platformConcentrations.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6E7681]">
              Platform Concentrations
            </p>
            <div className="space-y-2">
              {data.platformConcentrations.map((pc, i) => (
                <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#E8EDF2]">{pc.platform}</span>
                    {pc.spaces?.map((space, j) => (
                      <span key={j} className="rounded bg-[#1C2333] px-1.5 py-0.5 font-mono text-[11px] text-[#818CF8]">
                        {space}
                      </span>
                    ))}
                  </div>
                  {pc.note && <p className="mt-1.5 text-[11px] text-[#6E7681]">{pc.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.affinityAdjacencies && data.affinityAdjacencies.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6E7681]">
              Affinity Adjacencies
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.affinityAdjacencies.map((aa, i) => (
                <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-3">
                  <p className="text-xs font-semibold text-[#E8EDF2]">{aa.interest}</p>
                  <p className="mt-1 text-[11px] text-[#6E7681]">{aa.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
