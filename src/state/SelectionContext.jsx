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
  const [helpOpen, setHelpOpen] = useState(false);
  const [source, setSource] = useState(null);
  const [osReduceMotion, setOsReduceMotion] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [userReduceMotion, setUserReduceMotion] = useState(false);
  const reduceMotion = osReduceMotion || userReduceMotion;
  const returnFocusRef = useRef(null);
  const selectedRef = useRef(null);
  const selectedFolderRef = useRef(null);
  const sidebarOpenRef = useRef(false);
  const sourceRef = useRef(null);
  const searchParamsRef = useRef(searchParams);
  // Ignore the stale ?report= value we just dismissed until the URL drops it.
  const ignoreUrlReportRef = useRef(null);
  selectedRef.current = selectedReportNo;
  selectedFolderRef.current = selectedFolderId;
  sidebarOpenRef.current = sidebarOpen;
  sourceRef.current = source;
  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setOsReduceMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

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
    setHelpOpen(false);
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
        setHelpOpen(false);
        setSource(null);
      }
      return;
    }
    // Already showing this report (e.g. we just wrote ?report=). Keep the
    // folder so Back from a theme/type/year/method list still works.
    if (String(selectedRef.current) === String(fromUrl) && sidebarOpenRef.current) {
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
      setHelpOpen(false);
      writeReportParam(id);
    },
    [applySelection, writeReportParam],
  );

  const clearReport = useCallback(() => {
    rememberDismissedReport();
    setHelpOpen(false);
    applySelection(applyClearReport());
    writeReportParam(null);
    restoreReturnFocus();
  }, [applySelection, rememberDismissedReport, restoreReturnFocus, writeReportParam]);

  const openFolder = useCallback(
    (id, options = {}) => {
      const folderId = normalizeFolderId(id);
      const current = {
        selectedReportNo: selectedRef.current,
        selectedFolderId: selectedFolderRef.current,
        sidebarOpen: sidebarOpenRef.current,
        source: sourceRef.current,
      };
      const next = applyOpenFolder(current, folderId, options);
      if (!folderId) {
        setHelpOpen(false);
        applySelection(next);
        return;
      }
      rememberDismissedReport();
      setHelpOpen(false);
      applySelection(next);
      writeReportParam(null);
    },
    [applySelection, rememberDismissedReport, writeReportParam],
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
      setHelpOpen(false);
      setSidebarOpenState(true);
    },
    [clearReport],
  );

  const openHelp = useCallback(() => {
    if (typeof document !== "undefined" && !returnFocusRef.current) {
      returnFocusRef.current = document.activeElement;
    }
    setHelpOpen(true);
    setSidebarOpenState(true);
  }, []);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  const setReduceMotion = useCallback((value) => {
    setUserReduceMotion(Boolean(value));
  }, []);

  const value = useMemo(
    () => ({
      selectedReportNo,
      selectedFolderId,
      sidebarOpen,
      helpOpen,
      source,
      reduceMotion,
      openReport,
      openFolder,
      openHelp,
      closeHelp,
      backSidebar,
      clearReport,
      setSidebarOpen,
      setReduceMotion,
    }),
    [
      selectedReportNo,
      selectedFolderId,
      sidebarOpen,
      helpOpen,
      source,
      reduceMotion,
      openReport,
      openFolder,
      openHelp,
      closeHelp,
      backSidebar,
      clearReport,
      setSidebarOpen,
      setReduceMotion,
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
