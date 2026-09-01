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

  const applyUrlReport = useCallback((rawId) => {
    if (!reportExists(rawId)) return false;
    const id = String(rawId);
    setSelectedReportNo(id);
    setSidebarOpenState(true);
    setSource("url");
    return true;
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("report");
    if (!fromUrl) return;
    if (String(fromUrl) === String(selectedReportNo)) return;
    applyUrlReport(fromUrl);
  }, [searchParams, selectedReportNo, applyUrlReport]);

  const writeReportParam = useCallback(
    (reportNo) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (reportNo) next.set("report", String(reportNo));
          else next.delete("report");
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
      setSelectedReportNo(id);
      setSidebarOpenState(true);
      setSource(nextSource);
      writeReportParam(id);
    },
    [writeReportParam],
  );

  const clearReport = useCallback(() => {
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
      const next = Boolean(open);
      setSidebarOpenState(next);
      if (!next && selectedReportNo) {
        const node = returnFocusRef.current;
        if (node && typeof node.focus === "function") {
          window.setTimeout(() => node.focus(), 0);
        }
      }
    },
    [selectedReportNo],
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
