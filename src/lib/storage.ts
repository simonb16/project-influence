import { ArchetypeReport } from "@/types";

const STORAGE_KEY = "sway_reports";

export interface SavedReport {
  id: string;
  archetype: string;
  generatedAt: string;
  report: ArchetypeReport;
}

export function getSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: ArchetypeReport): SavedReport {
  const saved: SavedReport = {
    id: `${Date.now()}`,
    archetype: report.archetype,
    generatedAt: report.generatedAt,
    report,
  };
  const existing = getSavedReports();
  const updated = [saved, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return saved;
}

export function deleteReport(id: string): void {
  const updated = getSavedReports().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
