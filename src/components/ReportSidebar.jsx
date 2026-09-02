import { useEffect, useId, useRef, useState } from "react";
import { useSelection } from "../state/SelectionContext.jsx";
import { reports } from "../data/index.js";
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
  const { selectedReportNo, sidebarOpen, setSidebarOpen } = useSelection();
  const headingRef = useRef(null);
  const asideRef = useRef(null);
  const titleId = useId();
  const liveId = useId();
  const report = findReport(selectedReportNo);
  const open = sidebarOpen;
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
    if (!open || !report) return undefined;
    const id = window.setTimeout(() => headingRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open, report, selectedReportNo]);

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

  const liveText = open && report
    ? `Opened ${report.title} by ${report.author ?? "unknown author"}${
        report.year != null ? `, ${report.year}` : ""
      }.`
    : open
      ? "Report sidebar opened. No report selected."
      : "";

  return (
    <>
      <div className="sr-only" id={liveId} aria-live="polite" aria-atomic="true">
        {liveText}
      </div>
      {open ? (
        <button
          type="button"
          className="report-sidebar-backdrop"
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
        aria-hidden={!open}
        aria-modal={sheet && open ? true : undefined}
        {...(!open ? { inert: "" } : {})}
      >
        <div className="report-sidebar-bar">
          <p className="report-sidebar-kicker">Report</p>
          <button type="button" className="report-sidebar-close" onClick={close}>
            Close
          </button>
        </div>
        <div className="report-sidebar-body">
          {report ? (
            <article aria-labelledby={titleId}>
              <p className="report-sidebar-meta">
                Report {report.reportNo}
                {report.year != null ? ` · ${report.year}` : ""}
                {report.category ? ` · ${report.category}` : ""}
              </p>
              <h2
                id={titleId}
                className="report-sidebar-title"
                tabIndex={-1}
                ref={headingRef}
              >
                {report.title}
              </h2>
              {report.author ? (
                <p className="report-sidebar-author">{report.author}</p>
              ) : null}
              {report.projectType ? (
                <p className="report-sidebar-type">
                  Project type: {report.projectType}
                </p>
              ) : null}
              {FIELDS.filter((field) => !isEmpty(report[field.key])).map(
                (field) => (
                  <section key={field.key} className="report-sidebar-field">
                    <h3>{field.label}</h3>
                    <FieldValue value={report[field.key]} />
                  </section>
                ),
              )}
              {isHttpUrl(report.website) ? (
                <p className="report-sidebar-field">
                  <a
                    href={report.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Project website (opens in a new tab)
                  </a>
                </p>
              ) : null}
              {isHttpUrl(report.contact) ? (
                <p className="report-sidebar-field">
                  <a
                    href={report.contact}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Author contact (opens in a new tab)
                  </a>
                </p>
              ) : null}
            </article>
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
