import { ArchetypeReport } from "@/types";
import { ensureDb, reportExists, insertImportedReport } from "@/lib/db";
import { deriveTitle } from "@/lib/pipeline";

interface ImportItem {
  id: string;
  report: ArchetypeReport;
}

// One-time migration of pre-Round-7 localStorage reports into the shared
// library. Id-dedupes server-side so re-running an import (or two tabs
// importing at once) is harmless.
export async function POST(request: Request) {
  const body = await request.json();
  const runBy: string | null = body.runBy?.trim() || null;
  const items: ImportItem[] = Array.isArray(body.reports) ? body.reports : [];

  try {
    await ensureDb();
  } catch {
    return new Response(JSON.stringify({ error: "Database unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const imported: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    if (!item?.id || !item?.report) continue;
    if (await reportExists(item.id)) {
      skipped.push(item.id);
      continue;
    }
    const report = item.report;
    const audience = report.audience || report.query || "";
    const title = report.archetype || deriveTitle(audience);
    await insertImportedReport(
      item.id,
      title,
      audience,
      report.brand,
      report.context,
      runBy,
      report.generatedAt || new Date().toISOString(),
      report
    );
    imported.push(item.id);
  }

  return new Response(JSON.stringify({ imported, skipped }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
