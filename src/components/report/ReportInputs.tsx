import { ArchetypeReport } from "@/types";

// Displays the user's original inputs exactly as entered. Legacy reports
// (pre-Round 2) stored the description in `query` — shown as the audience.

export function ReportInputs({ report }: { report: ArchetypeReport }) {
  const audience = report.audience ?? report.query;
  if (!audience && !report.brand && !report.context) return null;

  const rows: Array<{ label: string; text: string }> = [];
  if (audience) rows.push({ label: "Audience", text: audience });
  if (report.brand) rows.push({ label: "Brand", text: report.brand });
  if (report.context) rows.push({ label: "Context", text: report.context });

  return (
    <div className="rounded-xl border border-[#1C2333] bg-[#0D1117] p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6366F1]">
        Report Inputs
      </p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <span className="w-20 shrink-0 pt-px text-[10px] font-semibold uppercase tracking-wider text-[#6E7681]">
              {row.label}
            </span>
            <p className="text-sm leading-relaxed text-[#8B949E]">{row.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
