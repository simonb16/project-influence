import { Pool } from "pg";
import { ProgressEvent, RunStatus, RunSummary, ReportSummary, ArchetypeReport } from "@/types";

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      // Railway's public proxy (used for local dev) requires SSL; its private
      // network reference (used in production) accepts it too, so this is safe
      // either way. Only skip it for a literal local Postgres.
      ssl:
        connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
          ? undefined
          : { rejectUnauthorized: false },
    })
  : null;

const MAX_CONCURRENT_RUNS = 3;

// Next.js API route modules are loaded lazily per-request rather than at a
// single "server boot" moment, so there's no true startup hook without a
// custom server. This memoized promise runs once, on whichever request
// touches the DB first — which happens before any new run can be created,
// so orphaned runs are always cleaned up before they'd be confused with a
// fresh one.
let initialized: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (!pool) {
    return Promise.reject(new Error("database unavailable — DATABASE_URL is not set"));
  }
  if (!initialized) {
    initialized = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id          TEXT PRIMARY KEY,
          title       TEXT NOT NULL,
          audience    TEXT NOT NULL,
          brand       TEXT,
          context     TEXT,
          run_by      TEXT,
          created_at  TIMESTAMPTZ NOT NULL,
          report_json JSONB NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS runs (
          id          TEXT PRIMARY KEY,
          status      TEXT NOT NULL,
          title       TEXT NOT NULL,
          audience    TEXT NOT NULL,
          progress    JSONB NOT NULL DEFAULT '[]',
          report_id   TEXT REFERENCES reports(id),
          error       TEXT,
          run_by      TEXT,
          created_at  TIMESTAMPTZ NOT NULL,
          updated_at  TIMESTAMPTZ NOT NULL
        )
      `);

      const orphaned = await pool.query(
        `UPDATE runs SET status = 'failed', error = $1, updated_at = now()
         WHERE status IN ('queued', 'running') RETURNING id`,
        ["interrupted by server restart — please re-run"]
      );
      if (orphaned.rowCount) {
        console.log(`[sway] Marked ${orphaned.rowCount} orphaned run(s) as failed on boot`);
      }
    })();
  }
  return initialized;
}

export function isDbConfigured(): boolean {
  return Boolean(pool);
}

// ── Runs ──

export async function countActiveRuns(): Promise<number> {
  const res = await pool!.query(`SELECT count(*)::int AS n FROM runs WHERE status IN ('queued', 'running')`);
  return res.rows[0].n;
}

export async function isAtConcurrencyLimit(): Promise<boolean> {
  return (await countActiveRuns()) >= MAX_CONCURRENT_RUNS;
}

export async function createRun(id: string, title: string, audience: string, runBy: string | null): Promise<void> {
  await pool!.query(
    `INSERT INTO runs (id, status, title, audience, progress, run_by, created_at, updated_at)
     VALUES ($1, 'queued', $2, $3, '[]', $4, now(), now())`,
    [id, title, audience, runBy]
  );
}

export async function setRunRunning(id: string): Promise<void> {
  await pool!.query(`UPDATE runs SET status = 'running', updated_at = now() WHERE id = $1`, [id]);
}

export async function appendProgress(id: string, message: string): Promise<void> {
  const event: ProgressEvent = { message, at: new Date().toISOString() };
  await pool!.query(
    `UPDATE runs SET progress = progress || $2::jsonb, updated_at = now() WHERE id = $1`,
    [id, JSON.stringify([event])]
  );
}

export async function completeRun(id: string, reportId: string): Promise<void> {
  await pool!.query(
    `UPDATE runs SET status = 'complete', report_id = $2, updated_at = now() WHERE id = $1`,
    [id, reportId]
  );
}

export async function failRun(id: string, error: string): Promise<void> {
  await pool!.query(`UPDATE runs SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`, [id, error]);
}

export async function getRun(id: string): Promise<RunStatus | null> {
  const res = await pool!.query(
    `SELECT id, status, progress, report_id, error, run_by, created_at FROM runs WHERE id = $1`,
    [id]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    status: row.status,
    progress: row.progress,
    reportId: row.report_id ?? undefined,
    error: row.error ?? undefined,
    runBy: row.run_by ?? undefined,
    createdAt: row.created_at.toISOString(),
    emailEnabled: false, // filled in by the route, which knows about email config
  };
}

/** Runs still in flight or that failed — for the homepage's live list. Completed runs live in `reports`. */
export async function listActiveAndFailedRuns(limit = 50): Promise<RunSummary[]> {
  const res = await pool!.query(
    `SELECT id, status, title, audience, error, run_by, created_at FROM runs
     WHERE status IN ('queued', 'running', 'failed')
     ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map((row) => ({
    id: row.id,
    status: row.status,
    title: row.title,
    audience: row.audience,
    error: row.error ?? undefined,
    runBy: row.run_by ?? undefined,
    createdAt: row.created_at.toISOString(),
  }));
}

// ── Reports ──

async function insertReport(
  id: string,
  title: string,
  audience: string,
  brand: string | undefined,
  context: string | undefined,
  runBy: string | null,
  report: ArchetypeReport
): Promise<void> {
  await pool!.query(
    `INSERT INTO reports (id, title, audience, brand, context, run_by, created_at, report_json)
     VALUES ($1, $2, $3, $4, $5, $6, now(), $7)`,
    [id, title, audience, brand ?? null, context ?? null, runBy, JSON.stringify(report)]
  );
}

/** 3 attempts with backoff, per the brief's failure-mode spec. Throws if all three fail. */
export async function saveReportWithRetry(
  id: string,
  title: string,
  audience: string,
  brand: string | undefined,
  context: string | undefined,
  runBy: string | null,
  report: ArchetypeReport
): Promise<void> {
  const delays = [0, 500, 1500];
  let lastErr: unknown;
  for (const delay of delays) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      await insertReport(id, title, audience, brand, context, runBy, report);
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Migration import: preserves the report's original generatedAt as created_at, not the import time. */
export async function insertImportedReport(
  id: string,
  title: string,
  audience: string,
  brand: string | undefined,
  context: string | undefined,
  runBy: string | null,
  createdAt: string,
  report: ArchetypeReport
): Promise<void> {
  await pool!.query(
    `INSERT INTO reports (id, title, audience, brand, context, run_by, created_at, report_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, title, audience, brand ?? null, context ?? null, runBy, createdAt, JSON.stringify(report)]
  );
}

export async function getReport(id: string): Promise<ArchetypeReport | null> {
  const res = await pool!.query(`SELECT report_json FROM reports WHERE id = $1`, [id]);
  if (res.rowCount === 0) return null;
  return res.rows[0].report_json;
}

export async function listReports(limit = 200): Promise<ReportSummary[]> {
  const res = await pool!.query(
    `SELECT id, title, audience, run_by, created_at FROM reports ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map((row) => ({
    id: row.id,
    title: row.title,
    audience: row.audience,
    runBy: row.run_by ?? undefined,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function deleteReportById(id: string): Promise<boolean> {
  const res = await pool!.query(`DELETE FROM reports WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function reportExists(id: string): Promise<boolean> {
  const res = await pool!.query(`SELECT 1 FROM reports WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
