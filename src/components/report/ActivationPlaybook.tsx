import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

export function ActivationPlaybook({ recommendations }: { recommendations: string[] }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">▶</span>
        <CardTitle>Activation Playbook</CardTitle>
        <InfoButton info={SECTION_INFO.activationPlaybook} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">
        How a brand should engage the influential core, derived from the reconciled three-lens research.
      </p>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <span className="mt-0.5 shrink-0 font-mono text-sm font-bold text-[#6366F1]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-relaxed text-[#8B949E]">{rec}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
