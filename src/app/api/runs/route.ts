import { ensureDb, listActiveAndFailedRuns } from "@/lib/db";

// In-progress and failed runs for the homepage's live list. Completed runs
// surface through GET /api/reports instead.
export async function GET() {
  try {
    await ensureDb();
  } catch {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const runs = await listActiveAndFailedRuns();
  return new Response(JSON.stringify(runs), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
