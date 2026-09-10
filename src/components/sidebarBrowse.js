import {
  folderIdForFacet,
  yearBucketFor,
} from "../views/project-folders/yearBuckets.js";

const SIBLING_LIMIT = 8;

export function parseConnectionIds(value) {
  if (value == null) return [];
  return String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function countWhere(source, predicate) {
  let count = 0;
  for (const report of source) {
    if (predicate(report)) count += 1;
  }
  return count;
}

export function browseFacetsFor(report, source) {
  if (!report) return [];
  const catalogue = source ?? [];
  const facets = [];

  if (report.category) {
    facets.push({
      kind: "theme",
      kindLabel: "Theme",
      folderId: folderIdForFacet("theme", report.category),
      label: report.category,
      count: countWhere(catalogue, (item) => item.category === report.category),
    });
  }

  if (report.projectType) {
    facets.push({
      kind: "type",
      kindLabel: "Type",
      folderId: folderIdForFacet("type", report.projectType),
      label: report.projectType,
      count: countWhere(
        catalogue,
        (item) => item.projectType === report.projectType,
      ),
    });
  }

  if (typeof report.year === "number") {
    const bucket = yearBucketFor(report.year);
    facets.push({
      kind: "year",
      kindLabel: "Year",
      folderId: folderIdForFacet("year", report.year),
      label: bucket.label,
      count: countWhere(
        catalogue,
        (item) => yearBucketFor(item.year).id === bucket.id,
      ),
    });
  }

  for (const method of report.methodsPrimary ?? []) {
    if (!method) continue;
    facets.push({
      kind: "method",
      kindLabel: "Method",
      folderId: folderIdForFacet("method", method),
      label: method,
      count: countWhere(catalogue, (item) =>
        (item.methodsPrimary ?? []).includes(method),
      ),
    });
  }

  return facets.filter((facet) => facet.folderId);
}

export function connectedReports(report, source) {
  if (!report) return [];
  const catalogue = source ?? [];
  const byId = new Map(
    catalogue.map((item) => [String(item.reportNo), item]),
  );
  const seen = new Set();
  const linked = [];
  for (const id of parseConnectionIds(report.connections)) {
    if (id === String(report.reportNo) || seen.has(id)) continue;
    const match = byId.get(id);
    if (!match) continue;
    seen.add(id);
    linked.push(match);
  }
  return linked;
}

export function siblingReports(report, source, limit = SIBLING_LIMIT) {
  if (!report?.category) return { reports: [], remaining: 0, total: 0 };
  const others = (source ?? [])
    .filter(
      (item) =>
        item.category === report.category &&
        String(item.reportNo) !== String(report.reportNo),
    )
    .sort((a, b) => {
      const year = (a.year ?? 0) - (b.year ?? 0);
      if (year !== 0) return year;
      return String(a.title).localeCompare(String(b.title));
    });
  return {
    reports: others.slice(0, limit),
    remaining: Math.max(0, others.length - limit),
    total: others.length,
  };
}

export function metaLineForGrouping(grouping, report) {
  if (!report) return "";
  if (grouping === "theme") {
    return [report.year, report.projectType].filter(Boolean).join(" · ");
  }
  return [report.year, report.category].filter(Boolean).join(" · ");
}
