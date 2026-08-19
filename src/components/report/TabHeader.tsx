// Round 9: in-tab header block for the three signal tabs (Maria's purpose
// definitions, slide 13). Title in the display treatment, subhead 1 as the
// lead line, subhead 2 muted beneath. Other tabs get no header block.

export function TabHeader({
  title,
  purpose,
  useIt,
}: {
  title: string;
  purpose: string;
  useIt: string;
}) {
  return (
    <div className="border-b border-white/[0.07] pb-5">
      <h2 className="mb-1.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#E8EDF2]">
        {title}
      </h2>
      <p className="text-[15px] leading-snug text-[#E8EDF2]/75">{purpose}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-[#E8EDF2]/40">{useIt}</p>
    </div>
  );
}
