import { useEffect, useId, useRef, useState } from "react";
import { useSelection } from "../state/SelectionContext.jsx";
import { reports } from "../data/index.js";
import ArchiveFolderList from "./ArchiveFolderList.jsx";
import "./report-sidebar-sheet.css";

const FIELDS = [
  { key: "targetedUser", label: "Targeted user" },
  { key: "description", label: "Description" },
  { key: "findings", label: "Findings" },
  { key: "outputs", label: "Outputs" },
  { key: "challenges", label: "Challenges" },
  { key: "budget", label: "Budget" },
  { key: "methodsPrimary", label: "Methods" },
  { key: "partner", label: "Partner" },
  { key: "connections", label: "Connections" },
];

const SHEET_QUERY = "(max-width: 799px)";
const SIDEBAR_TRANSITION_MS = 320;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function sidebarTransitionMs() {
  return prefersReducedMotion() ? 0 : SIDEBAR_TRANSITION_MS;
}

function isEmpty(value) {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === "";
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function FieldValue({ value }) {
  if (Array.isArray(value)) return <p>{value.join(", ")}</p>;
  return <p>{String(value)}</p>;
}

function findReport(reportNo) {
  if (reportNo == null) return null;
  const id = String(reportNo);
  return reports.find((report) => String(report.reportNo) === id) ?? null;
}

export default function ReportSidebar() {
  const {
    selectedReportNo,
    selectedFolderId,
    sidebarOpen,
    setSidebarOpen,
    backSidebar,
  } = useSelection();
  const headingRef = useRef(null);
  const asideRef = useRef(null);
  const titleId = useId();
  const liveId = useId();
  const report = findReport(selectedReportNo);
  const open = sidebarOpen;
  const snapshotRef = useRef({
    report: null,
    selectedFolderId: null,
  });
  const [closing, setClosing] = useState(false);
  const [backdropMounted, setBackdropMounted] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const panelActive = open || closing;
  const [sheet, setSheet] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(SHEET_QUERY).matches
      : false,
  );

  const close = () => {
    // Layout owns the single sidebar instance. Closing clears selection
    // and ?report= so SelectionContext cannot reopen from a stale param.
    setSidebarOpen(false);
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    const media = window.matchMedia(SHEET_QUERY);
    const onChange = () => setSheet(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (open) {
      if (report) snapshotRef.current.report = report;
      if (selectedFolderId) {
        snapshotRef.current.selectedFolderId = selectedFolderId;
      }
      setClosing(false);
      return undefined;
    }

    if (
      snapshotRef.current.report ||
      snapshotRef.current.selectedFolderId
    ) {
      setClosing(true);
      const id = window.setTimeout(
        () => setClosing(false),
        sidebarTransitionMs(),
      );
      return () => window.clearTimeout(id);
    }

    setClosing(false);
    return undefined;
  }, [open, report, selectedFolderId]);

  useEffect(() => {
    if (!sheet) {
      setBackdropMounted(false);
      setBackdropVisible(false);
      return undefined;
    }

    if (open) {
      setBackdropMounted(true);
      if (sidebarTransitionMs() === 0) {
        setBackdropVisible(true);
        return undefined;
      }
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setBackdropVisible(true));
      });
      return () => window.cancelAnimationFrame(id);
    }

    setBackdropVisible(false);
    const id = window.setTimeout(
      () => setBackdropMounted(false),
      sidebarTransitionMs(),
    );
    return () => window.clearTimeout(id);
  }, [open, sheet]);

  const displayReport = panelActive
    ? (report ?? snapshotRef.current.report)
    : null;
  const displayFolderId = panelActive
    ? (selectedFolderId ?? snapshotRef.current.selectedFolderId)
    : null;
  const displayShowBack = Boolean(displayReport && displayFolderId);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => {
      if (report) {
        headingRef.current?.focus();
        return;
      }
      if (selectedFolderId) {
        document.getElementById("archive-list")?.focus?.();
        return;
      }
      headingRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(id);
  }, [open, report, selectedReportNo, selectedFolderId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (document.getElementById("help-dialog")?.open) return;
      const panel = asideRef.current;
      if (!panel?.classList.contains("is-open")) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const liveText =
    open && report
      ? `Opened ${report.title} by ${report.author ?? "unknown author"}${
          report.year != null ? `, ${report.year}` : ""
        }.`
      : open && selectedFolderId
        ? "Opened folder list."
        : open
          ? "Report sidebar opened. No report selected."
          : "";

  const kicker = displayReport
    ? "Report"
    : displayFolderId
      ? "Folders"
      : "Sidebar";

  return (
    <>
      <div className="sr-only" id={liveId} aria-live="polite" aria-atomic="true">
        {liveText}
      </div>
      {backdropMounted ? (
        <button
          type="button"
          className={
            backdropVisible
              ? "report-sidebar-backdrop is-visible"
              : "report-sidebar-backdrop"
          }
          aria-label="Close report sidebar"
          onClick={close}
        />
      ) : null}
      <aside
        id="report-sidebar"
        ref={asideRef}
        className={
          open ? "report-sidebar is-open" : "report-sidebar is-closed"
        }
        aria-labelledby={titleId}
        aria-describedby={liveId}
        aria-hidden={!panelActive}
        aria-modal={sheet && panelActive ? true : undefined}
        {...(!panelActive ? { inert: "" } : {})}
      >
        <div className="report-sidebar-bar">
          <p className="report-sidebar-kicker">{kicker}</p>
          <div className="report-sidebar-actions">
            {displayShowBack ? (
              <button
                type="button"
                className="report-sidebar-close"
                onClick={backSidebar}
              >
                Back
              </button>
            ) : null}
            <button type="button" className="report-sidebar-close" onClick={close}>
              Close
            </button>
          </div>
        </div>
        <div className="report-sidebar-body">
          {displayReport ? (
            <article aria-labelledby={titleId}>
              <p className="report-sidebar-meta">
                Report {displayReport.reportNo}
                {displayReport.year != null ? ` · ${displayReport.year}` : ""}
                {displayReport.category ? ` · ${displayReport.category}` : ""}
              </p>
              <h2
                id={titleId}
                className="report-sidebar-title"
                tabIndex={-1}
                ref={headingRef}
              >
                {displayReport.title}
              </h2>
              {displayReport.author ? (
                <p className="report-sidebar-author">{displayReport.author}</p>
              ) : null}
              {displayReport.projectType ? (
                <p className="report-sidebar-type">
                  Project type: {displayReport.projectType}
                </p>
              ) : null}
              {FIELDS.filter((field) => !isEmpty(displayReport[field.key])).map(
                (field) => (
                  <section key={field.key} className="report-sidebar-field">
                    <h3>{field.label}</h3>
                    <FieldValue value={displayReport[field.key]} />
                  </section>
                ),
              )}
              {isHttpUrl(displayReport.website) ? (
                <p className="report-sidebar-field">
                  <a
                    href={displayReport.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Project website (opens in a new tab)
                  </a>
                </p>
              ) : null}
              {isHttpUrl(displayReport.contact) ? (
                <p className="report-sidebar-field">
                  <a
                    href={displayReport.contact}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Author contact (opens in a new tab)
                  </a>
                </p>
              ) : null}
            </article>
          ) : displayFolderId ? (
            <ArchiveFolderList
              titleId={titleId}
              headingRef={headingRef}
              folderId={displayFolderId}
            />
          ) : (
            <div>
              <h2
                id={titleId}
                className="report-sidebar-title"
                tabIndex={-1}
                ref={headingRef}
              >
                No report selected
              </h2>
              <p className="report-sidebar-empty">
                Choose a report from the archive, the year × type map, or
                search. The same record opens here from every view.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
