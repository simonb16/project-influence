import { ensureDb, listReports } from "@/lib/db";

// Everyone's completed reports — this is an internal team tool, colleagues
// reviewing each other's test runs is the point (Round 7, Part 3).
export async function GET() {
  try {
    await ensureDb();
  } catch {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reports = await listReports();
  return new Response(JSON.stringify(reports), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
