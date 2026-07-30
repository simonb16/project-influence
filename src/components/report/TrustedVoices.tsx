import { TrustedVoice } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { InfoButton } from "@/components/ui/InfoButton";
import { SECTION_INFO } from "@/lib/sectionInfo";

export function TrustedVoices({ data }: { data: TrustedVoice[] }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => b.trustWeight - a.trustWeight);

  return (
    <Card glow>
      <CardHeader>
        <span className="text-lg">❝</span>
        <CardTitle>Trusted Voices</CardTitle>
        <InfoButton info={SECTION_INFO.trustedVoices} />
      </CardHeader>
      <p className="mb-4 text-xs text-[#6E7681]">Who the core believes, and why.</p>
      <div className="space-y-4">
        {sorted.map((voice, i) => (
          <div key={i} className="rounded-lg border border-[#1C2333] bg-[#080B0F] p-4">
            <div className="mb-2 flex items-start gap-3">
              <span className="mt-0.5 font-mono text-xs text-[#6E7681]">#{i + 1}</span>
              <span className="text-sm font-semibold text-[#E8EDF2]">{voice.voice}</span>
            </div>
            <p className="mb-3 text-xs text-[#8B949E]">{voice.whyTrusted}</p>
            {voice.proofFormats && voice.proofFormats.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {voice.proofFormats.map((format, j) => (
                  <span key={j} className="rounded bg-[#1C2333] px-1.5 py-0.5 text-[10px] text-[#818CF8]">
                    {format}
                  </span>
                ))}
              </div>
            )}
            <ScoreBar score={voice.trustWeight} label="Trust Weight" height={3} />
            {voice.fragility && (
              <p className="mt-2.5 text-[11px] italic text-[#6E7681]">
                <span className="font-semibold uppercase not-italic tracking-wider text-amber-400/60">Fragile if · </span>
                {voice.fragility}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
