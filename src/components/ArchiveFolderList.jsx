import { groupingIdFromFolderId } from "../state/selection.js";
import { useSelection } from "../state/SelectionContext.jsx";
import { GROUPINGS, groupReports } from "../views/project-folders/grouping.js";

export default function ArchiveFolderList({
  titleId,
  headingRef,
  folderId: folderIdOverride,
}) {
  const { selectedFolderId, selectedReportNo, openFolder, openReport } =
    useSelection();
  const activeFolderId = folderIdOverride ?? selectedFolderId;
  const grouping = groupingIdFromFolderId(activeFolderId) ?? "theme";
  const groupingMeta = GROUPINGS.find((item) => item.id === grouping);
  const folders = groupReports(grouping);

  return (
    <div className="archive-folder-list">
      <h2
        id={titleId}
        className="report-sidebar-title"
        tabIndex={-1}
        ref={headingRef}
      >
        Folder list
      </h2>
      <p className="report-sidebar-empty">
        {groupingMeta?.description} The shelves show a peek of documents in
        each folder — this list is the full set.
      </p>

      <h3 className="report-sidebar-kicker" id="folder-heading">
        Folders by {groupingMeta?.label?.toLowerCase()}
      </h3>
      <ul className="folder-list" id="archive-list" tabIndex={-1}>
        {folders.map((folder) => {
          const open = folder.id === activeFolderId;
          return (
            <li key={folder.id}>
              <button
                type="button"
                className={`folder-btn ${open ? "is-open" : ""}`}
                aria-expanded={open}
                aria-controls={`folder-reports-${folder.id}`}
                onClick={() =>
                  folder.id === activeFolderId
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
                        {report.year}
                        <span aria-hidden="true"> · </span>
                        <span className="sr-only">Theme: </span>
                        {report.category}
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
