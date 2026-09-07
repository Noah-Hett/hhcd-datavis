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

function searchParamsFrom(search) {
  if (search instanceof URLSearchParams) {
    return new URLSearchParams(search);
  }
  return new URLSearchParams(String(search || "").replace(/^\?/, ""));
}

/** Apply or drop `?report=` while keeping every other search key. */
export function applyReportSearchParam(currentSearch, reportNo) {
  const next = searchParamsFrom(currentSearch);
  const id = normalizeReportId(reportNo);
  if (id) next.set("report", id);
  else next.delete("report");
  return next;
}

export function reportParamNeedsReplace(currentSearch, reportNo) {
  return (
    applyReportSearchParam(currentSearch, reportNo).toString() !==
    searchParamsFrom(currentSearch).toString()
  );
}

/**
 * Build a location that updates `?report=` without dropping the Explore hash.
 * `useSearchParams` navigates to `"?" + params` only, which strips `#map` /
 * `#archive` and Explore then scroll-snaps back to the intro pile.
 */
export function locationWithReportParam(location, reportNo) {
  const search = applyReportSearchParam(location?.search, reportNo).toString();
  return {
    pathname: location?.pathname || "/",
    search: search ? `?${search}` : "",
    hash: location?.hash || "",
  };
}

export { SOURCES };
