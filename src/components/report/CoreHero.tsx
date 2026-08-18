import { ArchetypeReport } from "@/types";

// Round 6a hero: three columns — core-size rings, the name treatment, and the
// compact susceptibility/initiator scores panel. Matches Maria's
// `Influential Core.html` mockup, built on our tokens.

const PERCENT_RANGE_RE = /(\d+(?:\s*[–-]\s*\d+)?)\s*%/;

function parseCorePercent(estimate?: string): string | null {
  if (!estimate) return null;
  const m = estimate.match(PERCENT_RANGE_RE);
  return m ? `${m[1].replace(/\s/g, "")}%` : null;
}

/** Core-size text for the chip: the explicit coreSizeEstimate field when present,
 * else a percent range parsed from the core narrative ("roughly 5–10% of the
 * audience" → "5–10% of audience"). Null when neither yields a range. */
function deriveCoreSize(core?: {
  coreSizeEstimate?: string;
  definition?: string;
  profile?: string;
}): string | null {
  if (core?.coreSizeEstimate) return core.coreSizeEstimate;
  const narrative = `${core?.definition ?? ""} ${core?.profile ?? ""}`;
  const m = narrative.match(PERCENT_RANGE_RE);
  return m ? `${m[1].replace(/\s/g, "")}% of audience` : null;
}

function susceptibilityTier(score: number): string {
  if (score >= 70) return "Receptive";
  if (score >= 40) return "Moderate";
  return "Resistant";
}

function initiatorTier(score: number): string {
  if (score >= 60) return "Trendsetter";
  if (score >= 40) return "Early Adopter";
  return "Imitator";
}

function CoreRings({ corePercent }: { corePercent: string | null }) {
  return (
    <div>
      <div className="relative h-[238px] w-[254px] overflow-hidden">
        <span className="eyebrow absolute left-0 top-0">Influence flows outward</span>
        {/* Concentric rings — growth audience fading in toward the core */}
        <div className="absolute left-1/2 top-1/2 h-[234px] w-[234px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6366F1]/10" />
        <div className="absolute left-1/2 top-1/2 h-[172px] w-[172px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#6366F1]/20" />
        <div className="absolute left-1/2 top-1/2 h-[114px] w-[114px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6366F1]/30" />
        <div className="absolute left-1/2 top-1/2 h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6366F1] shadow-[0_0_56px_rgba(99,102,241,0.45)]" />
        <div className="absolute left-1/2 top-1/2 h-px w-[254px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#6366F1]/35 to-transparent" />
        {corePercent && (
          <>
            <span className="absolute left-[calc(50%+38px)] top-[calc(50%-26px)] font-mono text-[9px] font-medium tracking-[0.1em] text-[#E8EDF2]/60">
              CORE {corePercent}
            </span>
            <span className="absolute left-[calc(50%+66px)] top-[calc(50%+38px)] font-mono text-[9px] font-medium tracking-[0.1em] text-[#E8EDF2]/30">
              GROWTH AUDIENCE
            </span>
          </>
        )}
      </div>
      <p className="max-w-[26ch] text-[12.5px] leading-snug text-[#E8EDF2]/50">
        A small centre the rest of the audience copies.
      </p>
    </div>
  );
}

function ScorePanel({
  susceptibility,
  initiator,
}: {
  susceptibility: number;
  initiator: number;
}) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-gradient-to-b from-[#6366F1]/[0.06] to-white/[0.01]">
      <div className="grid grid-cols-2">
        <div className="border-r border-white/[0.07] p-[18px] pb-4">
          <p className="eyebrow mb-2.5 !text-[9px] !tracking-[0.13em]">Susceptibility</p>
          <p className="font-mono text-[34px] font-bold leading-none tracking-[-0.03em] text-amber-400">
            {susceptibility}
          </p>
          <p className="mt-1.5 text-[11.5px] text-[#E8EDF2]/45">{susceptibilityTier(susceptibility)}</p>
          <p className="mt-1 text-[11px] leading-snug text-[#E8EDF2]/35">How difficult they are to influence</p>
        </div>
        <div className="p-[18px]">
          <p className="eyebrow mb-2.5 !text-[9px] !tracking-[0.13em]">Initiator</p>
          <p className="font-mono text-[34px] font-bold leading-none tracking-[-0.03em] text-[#F2705F]">
            {initiator}
          </p>
          <p className="mt-1.5 text-[11.5px] text-[#E8EDF2]/45">{initiatorTier(initiator)}</p>
          <p className="mt-1 text-[11px] leading-snug text-[#E8EDF2]/35">How influential they are</p>
        </div>
      </div>
      {/* Imitator ←→ Initiator slider */}
      <div className="border-t border-white/[0.07] p-[18px] pt-4">
        <div className="mb-2 flex justify-between font-mono text-[9px] font-medium tracking-[0.11em] text-[#E8EDF2]/35">
          <span>IMITATOR</span>
          <span className="text-[#E8EDF2]/70">INITIATOR</span>
        </div>
        <div className="relative h-1 rounded-full bg-white/[0.08]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6366F1]/25 to-[#6366F1]"
            style={{ width: `${initiator}%` }}
          />
          <div
            className="absolute -top-1 h-3 w-0.5 rounded-[1px] bg-white"
            style={{ left: `${initiator}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function CoreHero({ report }: { report: ArchetypeReport }) {
  const core = report.influentialCore;
  const name = core?.coreName ?? report.signalsSnapshot?.coreLabel ?? "The Influential Core";
  // Round 6b: the quantified coreSize field wins; older reports fall back to
  // the 6a chain (coreSizeEstimate → narrative parse).
  // Round 8b: render the estimate verbatim — it may already carry its own
  // denominator ("5-15% of self-identified crafters"). Only append "of
  // audience" when the estimate is a bare percentage/range with nothing else,
  // otherwise the two denominators double up ("...crafters of audience").
  const native = report.coreSize;
  const isBarePercent = native ? /^\d+(\.\d+)?\s*[-–—]?\s*\d*(\.\d+)?%$/.test(native.estimate.trim()) : false;
  const coreSize = native
    ? isBarePercent
      ? `${native.estimate} of audience`
      : native.estimate
    : deriveCoreSize(core);
  const confidenceTag = native && native.confidence !== "grounded" ? native.confidence.toUpperCase() : null;
  const corePercent = parseCorePercent(coreSize ?? undefined);
  const sus = report.influenceSusceptibility;
  const generatedDate = new Date(report.generatedAt).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });

  return (
    <div className="grid items-start gap-9 border-b border-white/[0.07] pb-9 lg:grid-cols-[254px_minmax(0,1fr)_290px]">
      <CoreRings corePercent={corePercent} />

      {/* Name treatment */}
      <div>
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] shadow-[0_0_0_3px_rgba(99,102,241,0.18)]" />
          <span className="eyebrow !text-[#818CF8]">The Influential Core</span>
        </div>
        <h2 className="mb-3.5 text-[34px] font-semibold leading-[1.04] tracking-[-0.035em] text-[#E8EDF2] sm:text-[40px]">
          {name}
        </h2>
        {core?.coreTagline && (
          <p className="mb-5 max-w-[34ch] text-[19px] leading-snug text-[#E8EDF2]/70">
            {core.coreTagline}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {coreSize && (
            <span
              className="rounded-[5px] border border-white/[0.08] bg-white/[0.045] px-2 py-1.5 font-mono text-[11px] font-medium text-[#E8EDF2]/60"
              title={native?.basis}
            >
              {coreSize}
            </span>
          )}
          {confidenceTag && (
            <span className="rounded-[5px] border border-dashed border-amber-400/25 px-2 py-1.5 font-mono text-[10px] font-medium tracking-[0.08em] text-amber-400/70">
              {confidenceTag}
            </span>
          )}
          <span className="rounded-[5px] border border-white/[0.06] px-2 py-1.5 font-mono text-[11px] font-medium text-[#E8EDF2]/40">
            {generatedDate}
          </span>
        </div>
      </div>

      {sus ? (
        <ScorePanel susceptibility={sus.overallScore} initiator={sus.initiatorScore} />
      ) : (
        <div />
      )}
    </div>
  );
}
