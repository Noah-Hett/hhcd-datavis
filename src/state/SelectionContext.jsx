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

const SelectionContext = createContext(null);

const SOURCES = new Set(["archive", "map", "search", "url"]);

function reportExists(reportNo) {
  if (reportNo == null || reportNo === "") return false;
  const id = String(reportNo);
  return reports.some((report) => String(report.reportNo) === id);
}

export function SelectionProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReportNo, setSelectedReportNo] = useState(null);
  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const [source, setSource] = useState(null);
  const returnFocusRef = useRef(null);
  const selectedRef = useRef(null);
  const searchParamsRef = useRef(searchParams);
  // Ignore the stale ?report= value we just dismissed until the URL drops it.
  const ignoreUrlReportRef = useRef(null);
  selectedRef.current = selectedReportNo;
  searchParamsRef.current = searchParams;

  const applyUrlReport = useCallback((rawId) => {
    if (!reportExists(rawId)) return false;
    const id = String(rawId);
    setSelectedReportNo(id);
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

  const openReport = useCallback(
    (reportNo, options = {}) => {
      const id = reportNo == null || reportNo === "" ? null : String(reportNo);
      if (!id || !reportExists(id)) return;
      const nextSource = SOURCES.has(options.source) ? options.source : null;
      if (options.returnFocus) {
        returnFocusRef.current = options.returnFocus;
      } else if (typeof document !== "undefined") {
        returnFocusRef.current = document.activeElement;
      }
      ignoreUrlReportRef.current = null;
      setSelectedReportNo(id);
      setSidebarOpenState(true);
      setSource(nextSource);
      writeReportParam(id);
    },
    [writeReportParam],
  );

  const clearReport = useCallback(() => {
    const dismissed =
      selectedRef.current ?? searchParamsRef.current.get("report");
    if (dismissed) ignoreUrlReportRef.current = String(dismissed);
    setSelectedReportNo(null);
    setSidebarOpenState(false);
    setSource(null);
    writeReportParam(null);
    const node = returnFocusRef.current;
    returnFocusRef.current = null;
    if (node && typeof node.focus === "function") {
      window.setTimeout(() => node.focus(), 0);
    }
  }, [writeReportParam]);

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
      sidebarOpen,
      source,
      openReport,
      clearReport,
      setSidebarOpen,
    }),
    [
      selectedReportNo,
      sidebarOpen,
      source,
      openReport,
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
