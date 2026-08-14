import { ArchetypeReport } from "@/types";

// Round 7: reports now live server-side (Postgres) and localStorage's role
// shrinks to two things — the user's notification email, and pre-Round-7
// reports pending one-time migration into the shared library.

const STORAGE_KEY = "sway_reports";
const EMAIL_KEY = "sway_email";
const MIGRATED_KEY = "sway_migrated_report_ids";

export interface SavedReport {
  id: string;
  archetype: string;
  generatedAt: string;
  report: ArchetypeReport;
}

/** Pre-Round-7 local reports — read-only now, kept only for migration. */
export function getSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEmail(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function setEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_KEY, email);
}

function getMigratedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(MIGRATED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markMigrated(ids: string[]): void {
  if (typeof window === "undefined") return;
  const merged = new Set([...getMigratedIds(), ...ids]);
  localStorage.setItem(MIGRATED_KEY, JSON.stringify([...merged]));
}

/** Local reports from before Round 7 that haven't been imported to the server yet. */
export function getUnimportedReports(): SavedReport[] {
  const migrated = getMigratedIds();
  return getSavedReports().filter((r) => !migrated.has(r.id));
}
