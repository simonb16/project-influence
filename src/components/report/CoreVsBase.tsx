import { CoreVsBaseNote } from "@/types";

/** Two-line core-vs-base contrast, rendered under items that carry one. */
export function CoreVsBase({ note }: { note?: CoreVsBaseNote }) {
  if (!note?.core || !note?.base) return null;
  return (
    <div className="mt-2 space-y-0.5 rounded border border-[#1C2333] bg-[#0D1117]/60 px-2.5 py-1.5">
      <p className="text-[11px] leading-snug text-[#8B949E]">
        <span className="mr-1.5 font-semibold tracking-wider text-[#818CF8]">CORE:</span>
        {note.core}
      </p>
      <p className="text-[11px] leading-snug text-[#6E7681]">
        <span className="mr-1.5 font-semibold tracking-wider text-[#3D444D]">BASE:</span>
        {note.base}
      </p>
    </div>
  );
}
