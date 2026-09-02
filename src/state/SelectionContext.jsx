import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { reports } from "../data/index.js";
import {
  SOURCES,
  applyBackSidebar,
  applyClearReport,
  applyOpenFolder,
  applyOpenReport,
  normalizeFolderId,
  normalizeReportId,
} from "./selection.js";

const SelectionContext = createContext(null);

function reportExists(reportNo) {
  const id = normalizeReportId(reportNo);
  if (!id) return false;
  return reports.some((report) => String(report.reportNo) === id);
}

export function SelectionProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReportNo, setSelectedReportNo] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [source, setSource] = useState(null);
  const returnFocusRef = useRef(null);
  const selectedRef = useRef(null);
  const selectedFolderRef = useRef(null);
  const searchParamsRef = useRef(searchParams);
  // Ignore the stale ?report= value we just dismissed until the URL drops it.
  const ignoreUrlReportRef = useRef(null);
  selectedRef.current = selectedReportNo;
  selectedFolderRef.current = selectedFolderId;
  searchParamsRef.current = searchParams;

  const applySelection = useCallback((next) => {
    setSelectedReportNo(next.selectedReportNo);
    setSelectedFolderId(next.selectedFolderId);
    setSidebarOpenState(next.sidebarOpen);
    setSource(next.source);
  }, []);

  const applyUrlReport = useCallback((rawId) => {
    if (!reportExists(rawId)) return false;
    const id = String(rawId);
    setSelectedReportNo(id);
    setSelectedFolderId(null);
    setSidebarOpenState(true);
    setSource((current) => current ?? "url");
    return true;
  }, []);

  // Sync URL → selection only when searchParams change. Depending on
  // selectedReportNo is the Escape/?report= race: clearReport nulls the id
  // before setSearchParams flushes, so the effect would re-apply the stale
  // param and reopen the sidebar.
  useEffect(() => {
    const fromUrl = searchParams.get("report");
    const ignored = ignoreUrlReportRef.current;
    if (ignored != null) {
      if (!fromUrl || String(fromUrl) === String(ignored)) {
        if (!fromUrl) ignoreUrlReportRef.current = null;
        return;
      }
      ignoreUrlReportRef.current = null;
    }
    if (!fromUrl) {
      if (selectedRef.current != null) {
        setSelectedReportNo(null);
        setSelectedFolderId(null);
        setSidebarOpenState(false);
        setSource(null);
      }
      return;
    }
    applyUrlReport(fromUrl);
  }, [searchParams, applyUrlReport]);

  const writeReportParam = useCallback(
    (reportNo) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (reportNo) next.set("report", String(reportNo));
          else next.delete("report");
          if (next.toString() === current.toString()) return current;
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const rememberDismissedReport = useCallback(() => {
    const dismissed =
      selectedRef.current ?? searchParamsRef.current.get("report");
    if (dismissed) ignoreUrlReportRef.current = String(dismissed);
  }, []);

  const restoreReturnFocus = useCallback(() => {
    const node = returnFocusRef.current;
    returnFocusRef.current = null;
    if (node && typeof node.focus === "function") {
      window.setTimeout(() => node.focus(), 0);
    }
  }, []);

  const openReport = useCallback(
    (reportNo, options = {}) => {
      const id = normalizeReportId(reportNo);
      if (!id || !reportExists(id)) return;
      const sameReport = selectedRef.current === id;
      if (sameReport) {
        if (Object.prototype.hasOwnProperty.call(options, "folderId")) {
          setSelectedFolderId(normalizeFolderId(options.folderId));
        }
        setSidebarOpenState(true);
        if (SOURCES.has(options.source)) setSource(options.source);
        return;
      }
      if (options.returnFocus) {
        returnFocusRef.current = options.returnFocus;
      } else if (typeof document !== "undefined") {
        returnFocusRef.current = document.activeElement;
      }
      ignoreUrlReportRef.current = null;
      applySelection(applyOpenReport({ selectedFolderId: selectedFolderRef.current }, id, options));
      writeReportParam(id);
    },
    [applySelection, writeReportParam],
  );

  const clearReport = useCallback(() => {
    rememberDismissedReport();
    applySelection(applyClearReport());
    writeReportParam(null);
    restoreReturnFocus();
  }, [applySelection, rememberDismissedReport, restoreReturnFocus, writeReportParam]);

  const openFolder = useCallback(
    (id) => {
      const folderId = normalizeFolderId(id);
      rememberDismissedReport();
      if (!folderId) {
        applySelection(applyClearReport());
        writeReportParam(null);
        restoreReturnFocus();
        return;
      }
      applySelection(applyOpenFolder(null, folderId));
      writeReportParam(null);
    },
    [applySelection, rememberDismissedReport, restoreReturnFocus, writeReportParam],
  );

  const backSidebar = useCallback(() => {
    const next = applyBackSidebar({
      selectedReportNo: selectedRef.current,
      selectedFolderId: selectedFolderRef.current,
      source,
    });
    if (next.selectedReportNo == null && next.selectedFolderId) {
      rememberDismissedReport();
      applySelection(next);
      writeReportParam(null);
      return;
    }
    clearReport();
  }, [applySelection, clearReport, rememberDismissedReport, source, writeReportParam]);

  const setSidebarOpen = useCallback(
    (open) => {
      if (!open) {
        // Closing the panel also drops selectedReportNo and ?report= so
        // the URL effect cannot reopen it.
        clearReport();
        return;
      }
      setSidebarOpenState(true);
    },
    [clearReport],
  );

  const value = useMemo(
    () => ({
      selectedReportNo,
      selectedFolderId,
      sidebarOpen,
      source,
      openReport,
      openFolder,
      backSidebar,
      clearReport,
      setSidebarOpen,
    }),
    [
      selectedReportNo,
      selectedFolderId,
      sidebarOpen,
      source,
      openReport,
      openFolder,
      backSidebar,
      clearReport,
      setSidebarOpen,
    ],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within SelectionProvider");
  }
  return ctx;
}
