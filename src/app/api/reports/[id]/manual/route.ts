import { ensureDb, getReport, setManualInputs } from "@/lib/db";
import { ManualInputs } from "@/types";

// Round 11A Part 6: the one small write path — manual platform reach entered
// on the Report inputs page. Same no-auth email-attribution model as the rest
// of the app; no validation theater — store what's entered, render it with
// its basis label and date. Slot-not-plumbing: 11C automates this if it gets
// used by hand.

// Round 11B Part 3/4 extends the same endpoint: per-plan-line reach
// (planReach, keyed by line id) and the split-hypothesis override
// (splitOverride, attribution beside — never replacing — the proposal).
// Exactly one of the three payload shapes per request.

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const reach = body?.platformReach;
  const planReach = body?.planReach;
  const splitOverride = body?.splitOverride;

  if (reach && (!reach.platform?.trim() || !reach.value?.trim() || !reach.dateChecked?.trim())) {
    return new Response(
      JSON.stringify({ error: "platformReach needs platform, value, and dateChecked" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (planReach && (!planReach.lineId?.trim() || !planReach.value?.trim() || !planReach.dateChecked?.trim())) {
    return new Response(
      JSON.stringify({ error: "planReach needs lineId, value, and dateChecked" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (splitOverride && (!splitOverride.value?.trim() || !splitOverride.dateChecked?.trim())) {
    return new Response(
      JSON.stringify({ error: "splitOverride needs value and dateChecked" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!reach && !planReach && !splitOverride) {
    return new Response(
      JSON.stringify({ error: "expected platformReach, planReach, or splitOverride" }),
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

  const manualInputs: ManualInputs = { ...existing.manualInputs };
  if (reach) {
    manualInputs.platformReach = {
      platform: String(reach.platform).trim(),
      value: String(reach.value).trim(),
      dateChecked: String(reach.dateChecked).trim(),
      enteredBy: reach.enteredBy ? String(reach.enteredBy).trim() : undefined,
    };
  }
  if (planReach) {
    manualInputs.planReach = {
      ...manualInputs.planReach,
      [String(planReach.lineId).trim()]: {
        value: String(planReach.value).trim(),
        dateChecked: String(planReach.dateChecked).trim(),
        enteredBy: planReach.enteredBy ? String(planReach.enteredBy).trim() : undefined,
      },
    };
  }
  if (splitOverride) {
    manualInputs.splitOverride = {
      value: String(splitOverride.value).trim(),
      note: splitOverride.note ? String(splitOverride.note).trim() : undefined,
      dateChecked: String(splitOverride.dateChecked).trim(),
      enteredBy: splitOverride.enteredBy ? String(splitOverride.enteredBy).trim() : undefined,
    };
  }

  await setManualInputs(id, manualInputs);
  return new Response(JSON.stringify({ ok: true, manualInputs }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
