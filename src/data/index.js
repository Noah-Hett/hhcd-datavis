// Shared report catalogue for every visualisation.
// Inlined from the original `@hhcd/data` workspace package so this app has a
// single source of truth for the 67 HHCD reports. After editing the source
// JSON, keep this file's exports stable — the views depend on them.
import rawReports from "./reports.json";

// `reportNo` is the identity token used everywhere (React keys, 3D mesh ids,
// folder grouping, search). A couple of source reports have no number, which
// would collide as duplicate `null` keys. Give those a stable synthetic id so
// every report is uniquely identifiable. Real numeric ids are left untouched.
function normalizeIds(list) {
  const used = new Set(
    list
      .map((report) => report.reportNo)
      .filter((id) => id != null && String(id).trim() !== "")
      .map((id) => String(id)),
  );
  let seq = 0;
  const nextSyntheticId = () => {
    let id;
    do {
      seq += 1;
      id = `u${seq}`;
    } while (used.has(id));
    used.add(id);
    return id;
  };
  return list.map((report) =>
    report.reportNo == null || String(report.reportNo).trim() === ""
      ? { ...report, reportNo: nextSyntheticId() }
      : report,
  );
}

export const reports = normalizeIds(rawReports);

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
