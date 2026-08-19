import { BucketedBehavioralSignal, BehavioralBucket } from "@/types";

// Round 9: the rebuilt Behavioral tab — Maria's four observable-behavior
// buckets. Each item: Signal → What it signals → Targetable signal →
// Reinforcing evidence. All four bucket headers render even when a bucket is
// thin (1-2 items) or empty; a padded bucket is a review failure, not a goal.

const BUCKET_META: Array<{ key: BehavioralBucket; label: string; icon: string; intro: string }> = [
  { key: "search", label: "What They Search", icon: "⌕", intro: "Queries and query clusters the audience actually types." },
  { key: "consume", label: "What They Consume", icon: "▶", intro: "Channels, creators, formats, and platforms they return to." },
  { key: "buy", label: "What They Buy", icon: "◆", intro: "Purchases, considerations, and deliberate avoidances." },
  { key: "go", label: "Where They Go", icon: "◉", intro: "Physical stores, events, venues, and gatherings." },
];

function StrengthTag({ strength }: { strength: BucketedBehavioralSignal["strength"] }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${
        strength === "high"
          ? "border-[#6366F1]/30 bg-[#6366F1]/10 text-[#818CF8]"
          : "border-[#1C2333] bg-[#0D1117] text-[#6E7681]"
      }`}
    >
      {strength}
    </span>
  );
}

function BucketItem({ item }: { item: BucketedBehavioralSignal }) {
  return (
    <div className="rounded-[10px] border border-white/[0.08] bg-white/[0.016] p-5">
      <div className="mb-2 flex items-center gap-2.5">
        <p className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#E8EDF2]">
          {item.signal}
        </p>
        <StrengthTag strength={item.strength} />
      </div>

      <p className="mb-3.5 text-[13px] leading-relaxed text-[#E8EDF2]/55">{item.whatItSignals}</p>

      {item.targetableSignal?.trim() && (
        <div className="mb-1 grid grid-cols-[104px_minmax(0,1fr)] gap-x-3.5">
          <span className="font-mono text-[9px] font-medium leading-relaxed tracking-[0.13em] text-[#E8EDF2]/34">
            TARGETABLE
          </span>
          <span className="text-[13px] leading-relaxed text-[#E8EDF2]/80">{item.targetableSignal}</span>
        </div>
      )}

      {item.reinforcingEvidence && item.reinforcingEvidence.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-white/[0.05] pt-2.5">
          {item.reinforcingEvidence.map((ev, i) => (
            <p key={i} className="font-mono text-[10px] leading-relaxed text-[#E8EDF2]/40">
              <span className="mr-1 text-emerald-400/70">✓ REINFORCED ·</span>
              {ev.evidence}
              <span className="text-[#E8EDF2]/25"> — {ev.source}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function BehavioralBuckets({ data }: { data: BucketedBehavioralSignal[] }) {
  return (
    <div className="space-y-8">
      {BUCKET_META.map((bucket) => {
        const items = data.filter((s) => s.bucket === bucket.key);
        return (
          <section key={bucket.key}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm text-[#6366F1]">{bucket.icon}</span>
              <p className="eyebrow !text-[11px] !tracking-[0.18em] !text-[#6366F1]">{bucket.label}</p>
            </div>
            <p className="mb-3.5 text-xs text-[#6E7681]">{bucket.intro}</p>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <BucketItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-white/[0.06] px-4 py-3 text-xs text-[#3D444D]">
                No evidenced signals in this bucket this run — thin beats padded.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
