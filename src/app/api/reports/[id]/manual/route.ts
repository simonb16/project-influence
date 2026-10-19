import { ensureDb, getReport, setManualInputs } from "@/lib/db";
import { ManualInputs } from "@/types";

// Round 11A Part 6: the one small write path — manual platform reach entered
// on the Report inputs page. Same no-auth email-attribution model as the rest
// of the app; no validation theater — store what's entered, render it with
// its basis label and date. Slot-not-plumbing: 11C automates this if it gets
// used by hand.

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const reach = body?.platformReach;

  if (!reach?.platform?.trim() || !reach?.value?.trim() || !reach?.dateChecked?.trim()) {
    return new Response(
      JSON.stringify({ error: "platformReach needs platform, value, and dateChecked" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await ensureDb();
  } catch {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await getReport(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const manualInputs: ManualInputs = {
    ...existing.manualInputs,
    platformReach: {
      platform: String(reach.platform).trim(),
      value: String(reach.value).trim(),
      dateChecked: String(reach.dateChecked).trim(),
      enteredBy: reach.enteredBy ? String(reach.enteredBy).trim() : undefined,
    },
  };

  await setManualInputs(id, manualInputs);
  return new Response(JSON.stringify({ ok: true, manualInputs }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
