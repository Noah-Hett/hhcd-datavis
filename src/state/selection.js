const SOURCES = new Set(["archive", "map", "search", "url"]);

export function normalizeReportId(reportNo) {
  if (reportNo == null || reportNo === "") return null;
  return String(reportNo);
}

export function normalizeFolderId(folderId) {
  if (folderId == null || folderId === "") return null;
  return String(folderId);
}

export function groupingIdFromFolderId(folderId) {
  const id = normalizeFolderId(folderId);
  if (!id) return null;
  const colon = id.indexOf(":");
  if (colon <= 0) return null;
  const grouping = id.slice(0, colon);
  if (grouping !== "theme" && grouping !== "year" && grouping !== "type") {
    return null;
  }
  return grouping;
}

export function applyOpenReport(state, reportNo, options = {}) {
  const id = normalizeReportId(reportNo);
  if (!id) return state;
  const source = SOURCES.has(options.source) ? options.source : null;
  return {
    selectedReportNo: id,
    selectedFolderId: normalizeFolderId(options.folderId),
    sidebarOpen: true,
    source,
  };
}

export function applyOpenFolder(state = {}, folderId, options = {}) {
  const id = normalizeFolderId(folderId);
  if (!id) {
    return {
      selectedReportNo: state.selectedReportNo ?? null,
      selectedFolderId: null,
      sidebarOpen: Boolean(state.sidebarOpen),
      source: state.source ?? null,
    };
  }
  return {
    selectedReportNo: null,
    selectedFolderId: id,
    sidebarOpen: options.openSidebar === true,
    source: null,
  };
}

export function applyBackSidebar(state) {
  if (state.selectedReportNo && state.selectedFolderId) {
    return {
      selectedReportNo: null,
      selectedFolderId: state.selectedFolderId,
      sidebarOpen: true,
      source: state.source,
    };
  }
  return applyClearReport();
}

export function applyClearReport() {
  return {
    selectedReportNo: null,
    selectedFolderId: null,
    sidebarOpen: false,
    source: null,
  };
}

/**
 * Next Explore location after setting or clearing ?report=.
 * Returns null when search is unchanged. Always keeps the current hash —
 * React Router's setSearchParams navigates to "?…" and drops #archive/#map,
 * which then scrolls back to the intro pile.
 */
export function locationWithReportParam(location, currentSearch, reportNo) {
  const from =
    currentSearch instanceof URLSearchParams
      ? currentSearch
      : String(currentSearch || "").replace(/^\?/, "");
  const current = new URLSearchParams(from);
  const next = new URLSearchParams(current);
  if (reportNo) next.set("report", String(reportNo));
  else next.delete("report");
  if (next.toString() === current.toString()) return null;
  const search = next.toString();
  return {
    pathname: location?.pathname || "/",
    search: search ? `?${search}` : "",
    hash: location?.hash || "",
  };
}

export { SOURCES };
