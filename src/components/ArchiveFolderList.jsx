import { useEffect, useState } from "react";
import { groupingIdFromFolderId } from "../state/selection.js";
import { useSelection } from "../state/SelectionContext.jsx";
import {
  BROWSE_GROUPINGS,
  groupReports,
} from "../views/project-folders/grouping.js";
import { metaLineForGrouping } from "./sidebarBrowse.js";

export default function ArchiveFolderList({ titleId, headingRef }) {
  const { selectedFolderId, selectedReportNo, openFolder, openReport, openHelp } =
    useSelection();
  const folderGrouping = groupingIdFromFolderId(selectedFolderId);
  const [browseGrouping, setBrowseGrouping] = useState(
    folderGrouping ?? "theme",
  );
  const grouping = folderGrouping ?? browseGrouping;
  const groupingMeta =
    BROWSE_GROUPINGS.find((item) => item.id === grouping) ?? BROWSE_GROUPINGS[0];
  const folders = groupReports(grouping);
  const openFolderMeta =
    folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const hub = !openFolderMeta;

  useEffect(() => {
    if (folderGrouping) setBrowseGrouping(folderGrouping);
  }, [folderGrouping]);

  useEffect(() => {
    if (!selectedFolderId) return undefined;
    const node = document.getElementById(`folder-btn-${selectedFolderId}`);
    const handle = window.setTimeout(() => {
      node?.scrollIntoView({ block: "nearest" });
    }, 40);
    return () => window.clearTimeout(handle);
  }, [selectedFolderId]);

  const onGroupingChange = (id) => {
    setBrowseGrouping(id);
    if (folderGrouping && folderGrouping !== id) {
      openFolder(null);
    }
  };

  const title = hub ? "Browse reports" : openFolderMeta.label;
  const lede = hub
    ? "Start from a theme, year, type, or method. Open a report, then click a theme or method on that record to keep exploring."
    : `${openFolderMeta.count} ${
        openFolderMeta.count === 1 ? "report" : "reports"
      } in this ${groupingMeta.label.toLowerCase()}. Open one to read it, or pick another ${groupingMeta.label.toLowerCase()}.`;

  return (
    <div className="archive-folder-list">
      <h2
        id={titleId}
        className="report-sidebar-title"
        tabIndex={-1}
        ref={headingRef}
      >
        {title}
      </h2>
      <p className="report-sidebar-empty">{lede}</p>
      {hub ? (
        <p className="report-sidebar-empty">
          <button
            type="button"
            className="report-sidebar-see-all"
            onClick={() => openHelp()}
          >
            How to use this catalogue
          </button>
        </p>
      ) : null}

      <fieldset className="sidebar-grouping">
        <legend className="sr-only">Browse reports by</legend>
        {BROWSE_GROUPINGS.map((item) => (
          <label
            key={item.id}
            className={grouping === item.id ? "is-active" : ""}
          >
            <input
              type="radio"
              name="sidebar-browse-grouping"
              value={item.id}
              checked={grouping === item.id}
              onChange={() => onGroupingChange(item.id)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <h3 className="report-sidebar-kicker" id="folder-heading">
        {groupingMeta.label}s
      </h3>
      <ul className="folder-list" id="archive-list" tabIndex={-1}>
        {folders.map((folder) => {
          const open = folder.id === selectedFolderId;
          return (
            <li key={folder.id}>
              <button
                type="button"
                id={`folder-btn-${folder.id}`}
                className={`folder-btn ${open ? "is-open" : ""}`}
                aria-expanded={open}
                aria-controls={`folder-reports-${folder.id}`}
                onClick={() =>
                  folder.id === selectedFolderId
                    ? openFolder(null)
                    : openFolder(folder.id, { openSidebar: true })
                }
              >
                <span className="folder-btn-label">{folder.label}</span>
                <span className="folder-btn-count">
                  {folder.count} {folder.count === 1 ? "report" : "reports"}
                </span>
              </button>
              <ul
                id={`folder-reports-${folder.id}`}
                className="report-list"
                hidden={!open}
              >
                {folder.reports.map((report) => (
                  <li key={report.reportNo}>
                    <button
                      type="button"
                      className={
                        String(report.reportNo) === String(selectedReportNo)
                          ? "report-btn is-selected"
                          : "report-btn"
                      }
                      aria-current={
                        String(report.reportNo) === String(selectedReportNo)
                          ? "true"
                          : undefined
                      }
                      onClick={(event) =>
                        openReport(report.reportNo, {
                          folderId: folder.id,
                          source: "archive",
                          returnFocus: event.currentTarget,
                        })
                      }
                    >
                      <span className="report-btn-meta">
                        {metaLineForGrouping(grouping, report)}
                      </span>
                      <span className="report-btn-title">{report.title}</span>
                      <span className="report-btn-author">{report.author}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
