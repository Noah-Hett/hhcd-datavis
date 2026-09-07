import { reports, yearRange } from "../../data/index.js";
import { themeForCategory } from "../../theme/categories.js";
import { YEAR_BUCKETS, folderIdForFacet, yearBucketFor } from "./yearBuckets.js";

export { YEAR_BUCKETS, folderIdForFacet, yearBucketFor };
export { CATEGORY_PALETTE, coverColorFor } from "../../theme/categories.js";

export const GROUPINGS = [
  {
    id: "theme",
    label: "Theme",
    hint: "Research area",
    description:
      "Magazine folders grouped by the report’s theme — health, work, city, and transport.",
  },
  {
    id: "year",
    label: "Year",
    hint: "When it was written",
    description:
      `The same ${reports.length} reports, re-shelved into year bands from ${yearRange.min} to ${yearRange.max}.`,
  },
  {
    id: "type",
    label: "Type",
    hint: "What it produced",
    description:
      "Folders by output: concepts, prototypes, guidelines, business models, and campaigns.",
  },
];

/** Sidebar browse includes methods; the 3D archive stays Theme / Year / Type. */
export const BROWSE_GROUPINGS = [
  ...GROUPINGS,
  {
    id: "method",
    label: "Method",
    hint: "How it was researched",
    description:
      "Reports that share a research method — interviews, observation, workshops, and the rest.",
  },
];

export const ARCHIVE_GROUPING_IDS = new Set(GROUPINGS.map((item) => item.id));
export const BROWSE_GROUPING_IDS = new Set(
  BROWSE_GROUPINGS.map((item) => item.id),
);

export function categoryStyle(category) {
  return (
    themeForCategory(category) ?? {
      label: category || "Other",
      color: "#3F3F46",
      initial: "?",
    }
  );
}

function sortReports(list) {
  return [...list].sort((a, b) => {
    const year = (a.year ?? 0) - (b.year ?? 0);
    if (year !== 0) return year;
    return String(a.title).localeCompare(String(b.title));
  });
}

export function groupReports(groupingId, source = reports) {
  const buckets = new Map();

  const ensure = (id, label, meta = {}) => {
    if (!buckets.has(id)) {
      buckets.set(id, { id, label, reports: [], ...meta });
    }
    return buckets.get(id);
  };

  for (const report of source) {
    if (groupingId === "year") {
      const bucket = yearBucketFor(report.year);
      ensure(`year:${bucket.id}`, bucket.label, {
        period: bucket.label,
      }).reports.push(report);
    } else if (groupingId === "type") {
      const type = report.projectType || "Unspecified";
      ensure(`type:${type}`, type).reports.push(report);
    } else if (groupingId === "method") {
      const methods = report.methodsPrimary ?? [];
      if (methods.length === 0) {
        ensure("method:Unspecified", "Unspecified").reports.push(report);
      } else {
        for (const method of methods) {
          ensure(`method:${method}`, method).reports.push(report);
        }
      }
    } else {
      const category = report.category || "Unspecified";
      const style = categoryStyle(category);
      ensure(`theme:${category}`, category, {
        color: style.color,
        initial: style.initial,
      }).reports.push(report);
    }
  }

  const folders = [...buckets.values()].map((folder) => ({
    ...folder,
    reports: sortReports(folder.reports),
    count: folder.reports.length,
  }));

  if (groupingId === "year") {
    folders.sort(
      (a, b) =>
        YEAR_BUCKETS.findIndex((bucket) => `year:${bucket.id}` === a.id) -
        YEAR_BUCKETS.findIndex((bucket) => `year:${bucket.id}` === b.id),
    );
  } else if (groupingId === "type") {
    folders.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  } else {
    folders.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  return folders;
}

export function folderForReport(groupingId, reportNo, source = reports) {
  const folders = groupReports(groupingId, source);
  return (
    folders.find((folder) =>
      folder.reports.some((report) => report.reportNo === reportNo),
    ) ?? null
  );
}

export function findReport(reportNo, source = reports) {
  return source.find((report) => report.reportNo === reportNo) ?? null;
}

/**
 * Map a 0–2 scroll progress to a from/to grouping and a 0–1 morph t.
 * Holds at each chapter, then eases into the next.
 */
export function morphFromProgress(progress) {
  const p = Math.min(2, Math.max(0, progress));
  if (p <= 0.22) return { from: "theme", to: "theme", t: 0, grouping: "theme" };
  if (p < 0.78) {
    return {
      from: "theme",
      to: "year",
      t: (p - 0.22) / 0.56,
      grouping: p < 0.5 ? "theme" : "year",
    };
  }
  if (p <= 1.22) return { from: "year", to: "year", t: 0, grouping: "year" };
  if (p < 1.78) {
    return {
      from: "year",
      to: "type",
      t: (p - 1.22) / 0.56,
      grouping: p < 1.5 ? "year" : "type",
    };
  }
  return { from: "type", to: "type", t: 0, grouping: "type" };
}

export function progressForGrouping(groupingId) {
  if (groupingId === "year") return 1;
  if (groupingId === "type") return 2;
  return 0;
}
