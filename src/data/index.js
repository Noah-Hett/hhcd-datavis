// Shared report catalogue for every visualisation.
// Inlined from the original `@hhcd/data` workspace package so this app has a
// single source of truth for the 64 HHCD reports. After editing the source
// CSV/JSON, keep this file's exports stable — the views depend on them.
import reports from "./reports.json";

export { reports };

export const categories = [
  ...new Set(reports.map((report) => report.category).filter(Boolean)),
].sort();

export const projectTypes = [
  ...new Set(reports.map((report) => report.projectType).filter(Boolean)),
].sort();

export const years = reports
  .map((report) => report.year)
  .filter((year) => typeof year === "number");

export const yearRange = {
  min: Math.min(...years),
  max: Math.max(...years),
};

export function countBy(key) {
  const counts = new Map();
  for (const report of reports) {
    const value = report[key];
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
