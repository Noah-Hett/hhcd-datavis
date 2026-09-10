import { useEffect, useId, useRef, useState } from "react";
import { useSelection } from "../state/SelectionContext.jsx";
import { groupingIdFromFolderId } from "../state/selection.js";
import { reports } from "../data/index.js";
import { themeForCategory } from "../theme/categories.js";
import {
  BROWSE_GROUPINGS,
  groupReports,
} from "../views/project-folders/grouping.js";
import { folderIdForFacet } from "../views/project-folders/yearBuckets.js";
import ArchiveFolderList from "./ArchiveFolderList.jsx";
import HelpGuide from "./HelpGuide.jsx";
import {
  browseFacetsFor,
  connectedReports,
} from "./sidebarBrowse.js";
import "./report-sidebar-sheet.css";

const NARRATIVE_FIELDS = [
  { key: "findings", label: "Findings" },
  { key: "outputs", label: "Outputs" },
];

const CONTEXT_FIELDS = [
  { key: "targetedUser", label: "Who it's for" },
  { key: "partner", label: "Partner" },
  { key: "challenges", label: "Challenges" },
  { key: "budget", label: "Budget" },
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

function folderLabel(folderId) {
  const grouping = groupingIdFromFolderId(folderId);
  if (!grouping || !folderId) return null;
  return (
    groupReports(grouping).find((folder) => folder.id === folderId)?.label ??
    folderId.slice(folderId.indexOf(":") + 1)
  );
}

function ReportRow({ report, folderId, source = "archive" }) {
  const { selectedReportNo, openReport } = useSelection();
  const current = String(report.reportNo) === String(selectedReportNo);
  const meta = [report.year, report.projectType].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      className={current ? "report-btn is-selected" : "report-btn"}
      aria-current={current ? "true" : undefined}
      onClick={(event) =>
        openReport(report.reportNo, {
          folderId,
          source,
          returnFocus: event.currentTarget,
        })
      }
    >
      <span className="report-btn-title">{report.title}</span>
      {meta ? <span className="report-btn-meta">{meta}</span> : null}
    </button>
  );
}

function FacetButton({ facet, className, showCount = false }) {
  const { openFolder } = useSelection();
  const theme =
    facet.kind === "theme" ? themeForCategory(facet.label) : null;
  return (
    <button
      type="button"
      className={theme ? `${className} is-theme` : className}
      style={theme ? { "--theme-color": theme.color } : undefined}
      onClick={() => openFolder(facet.folderId, { openSidebar: true })}
      aria-label={`Browse ${facet.count} ${
        facet.count === 1 ? "report" : "reports"
      } in ${facet.kindLabel.toLowerCase()} ${facet.label}`}
    >
      <span className="report-sidebar-facet-label">{facet.label}</span>
      {showCount ? (
        <span className="report-sidebar-facet-count">{facet.count}</span>
      ) : null}
    </button>
  );
}

function ReportRecord({ report, headingRef, titleId }) {
  const facets = browseFacetsFor(report, reports);
  const linked = connectedReports(report, reports);
  const themeFolderId = folderIdForFacet("theme", report.category);
  const themeFacets = facets.filter((facet) => facet.kind === "theme");
  const placeFacets = facets.filter(
    (facet) => facet.kind === "type" || facet.kind === "year",
  );
  const methodFacets = facets.filter((facet) => facet.kind === "method");

  return (
    <article aria-labelledby={titleId}>
      {report.author ? (
        <p className="report-sidebar-byline">
          {report.author}
          {report.year != null ? `, ${report.year}` : ""}
        </p>
      ) : report.year != null ? (
        <p className="report-sidebar-byline">{report.year}</p>
      ) : null}
      <h2
        id={titleId}
        className="report-sidebar-title"
        tabIndex={-1}
        ref={headingRef}
      >
        {report.title}
      </h2>

      {themeFacets.length > 0 || placeFacets.length > 0 ? (
        <nav
          className="report-sidebar-facets"
          aria-label="Explore related reports"
        >
          {themeFacets.map((facet) => (
            <FacetButton
              key={`${facet.kind}:${facet.label}`}
              facet={facet}
              className="report-sidebar-facet"
              showCount
            />
          ))}
          {placeFacets.map((facet) => (
            <FacetButton
              key={`${facet.kind}:${facet.label}`}
              facet={facet}
              className="report-sidebar-facet"
            />
          ))}
        </nav>
      ) : null}

      {methodFacets.length > 0 ? (
        <p className="report-sidebar-methods">
          <span className="sr-only">Methods</span>
          {methodFacets.map((facet) => (
            <FacetButton
              key={`${facet.kind}:${facet.label}`}
              facet={facet}
              className="report-sidebar-method"
            />
          ))}
        </p>
      ) : null}

      {!isEmpty(report.description) ? (
        <p className="report-sidebar-lede">{String(report.description)}</p>
      ) : null}

      {NARRATIVE_FIELDS.filter((field) => !isEmpty(report[field.key])).map(
        (field) => (
          <section key={field.key} className="report-sidebar-field">
            <h3>{field.label}</h3>
            <FieldValue value={report[field.key]} />
          </section>
        ),
      )}

      {linked.length > 0 ? (
        <section className="report-sidebar-field">
          <h3>Connected reports</h3>
          <ul className="report-list report-sidebar-related">
            {linked.map((item) => (
              <li key={item.reportNo}>
                <ReportRow
                  report={item}
                  folderId={
                    folderIdForFacet("theme", item.category) ?? themeFolderId
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {CONTEXT_FIELDS.filter((field) => !isEmpty(report[field.key])).map(
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
      {report.reportNo != null && String(report.reportNo).trim() !== "" ? (
        <p className="report-sidebar-meta">No. {report.reportNo}</p>
      ) : null}
    </article>
  );
}

export default function ReportSidebar() {
  const {
    selectedReportNo,
    selectedFolderId,
    sidebarOpen,
    helpOpen,
    setSidebarOpen,
    backSidebar,
    openFolder,
    closeHelp,
  } = useSelection();
  const headingRef = useRef(null);
  const asideRef = useRef(null);
  const titleId = useId();
  const liveId = useId();
  const report = findReport(selectedReportNo);
  const open = sidebarOpen;
  const showBack = Boolean(helpOpen || (report && selectedFolderId));
  const showBrowseBack = Boolean(!helpOpen && !report && selectedFolderId);
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
  const helpOpenRef = useRef(helpOpen);
  helpOpenRef.current = helpOpen;
  const closeHelpRef = useRef(closeHelp);
  closeHelpRef.current = closeHelp;

  useEffect(() => {
    const media = window.matchMedia(SHEET_QUERY);
    const onChange = () => setSheet(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => {
      if (helpOpen) {
        headingRef.current?.focus();
        return;
      }
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
  }, [open, helpOpen, report, selectedReportNo, selectedFolderId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      const panel = asideRef.current;
      if (!panel?.classList.contains("is-open")) return;
      event.preventDefault();
      if (helpOpenRef.current) {
        closeHelpRef.current();
        return;
      }
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const openFolderMetaLabel = folderLabel(selectedFolderId);
  const grouping = groupingIdFromFolderId(selectedFolderId);
  const groupingMeta = BROWSE_GROUPINGS.find((item) => item.id === grouping);

  const liveText =
    open && helpOpen
      ? "Opened help for this catalogue."
      : open && report
        ? `Opened ${report.title} by ${report.author ?? "unknown author"}${
            report.year != null ? `, ${report.year}` : ""
          }.`
        : open && selectedFolderId
          ? `Opened ${openFolderMetaLabel ?? "folder"} list.`
          : open
            ? "Browse reports by theme, year, type, or method."
            : "";

  const kicker = helpOpen
    ? "Help"
    : report
      ? "Report"
      : groupingMeta
        ? groupingMeta.label
        : "Browse";

  return (
    <>
      <div className="sr-only" id={liveId} aria-live="polite" aria-atomic="true">
        {liveText}
      </div>
      {open && sheet ? (
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
          <p className="report-sidebar-kicker">{kicker}</p>
          <div className="report-sidebar-actions">
            {showBack ? (
              <button
                type="button"
                className="report-sidebar-close"
                onClick={helpOpen ? closeHelp : backSidebar}
              >
                Back
              </button>
            ) : null}
            {showBrowseBack ? (
              <button
                type="button"
                className="report-sidebar-close"
                onClick={() => openFolder(null)}
              >
                Browse
              </button>
            ) : null}
            <button type="button" className="report-sidebar-close" onClick={close}>
              Close
            </button>
          </div>
        </div>
        <div className="report-sidebar-body">
          {helpOpen ? (
            <HelpGuide titleId={titleId} headingRef={headingRef} />
          ) : report ? (
            <ReportRecord
              report={report}
              headingRef={headingRef}
              titleId={titleId}
            />
          ) : (
            <ArchiveFolderList titleId={titleId} headingRef={headingRef} />
          )}
        </div>
      </aside>
    </>
  );
}
