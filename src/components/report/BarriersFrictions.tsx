import { Barrier } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn } from "@/lib/utils";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

const typeColors: Record<Barrier["type"], string> = {
  practical: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  psychological: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  social: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  trust: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export function BarriersFrictions({ data }: { data: Barrier[] }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.intensity - a.intensity);

  return (
    <Card>
      <CardHeader>
        <span className="text-lg">⊘</span>
        <CardTitle>Barriers & Frictions</CardTitle>
        <InfoButton info={SECTION_INFO.barriers} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">What prevents the core from acting.</p>
      <div className="space-y-3">
        {sorted.map((barrier, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#E8EDF2]">{barrier.name}</span>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    typeColors[barrier.type]
                  )}
                >
                  {barrier.type}
                </span>
              </div>
            </div>
            <p className="mb-2 text-xs text-[#8B949E]">{barrier.description}</p>
            <div className="mb-2">
              <ScoreBar score={barrier.intensity} label="Blocking Intensity" height={3} />
            </div>
            <p className="text-[11px] text-[#6E7681]">
              <span className="font-semibold uppercase tracking-wider text-[#3D444D]">Evidence · </span>
              {barrier.evidence}
            </p>
            <p className="mt-1 text-[11px] text-emerald-400/70">
              <span className="font-semibold uppercase tracking-wider">Lowers it · </span>
              {barrier.implication}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
