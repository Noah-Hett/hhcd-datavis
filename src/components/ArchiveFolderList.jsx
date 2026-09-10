import { useEffect, useState } from "react";
import { groupingIdFromFolderId } from "../state/selection.js";
import { useSelection } from "../state/SelectionContext.jsx";
import ThemeSwatch from "../theme/ThemeSwatch.jsx";
import { themeForCategory } from "../theme/categories.js";
import {
  BROWSE_GROUPINGS,
  groupReports,
} from "../views/project-folders/grouping.js";
import { metaLineForGrouping } from "./sidebarBrowse.js";

function GroupingTabs({ grouping, onGroupingChange }) {
  return (
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
  );
}

function FolderReports({ folder, grouping, selectedReportNo, openReport }) {
  return (
    <ul
      className="report-list report-sidebar-related"
      id="archive-list"
      tabIndex={-1}
    >
      {folder.reports.map((report) => {
        const themeMeta = grouping === "theme";
        const meta = themeMeta
          ? metaLineForGrouping(grouping, report)
          : null;
        return (
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
              <span className="report-btn-title">{report.title}</span>
              {themeMeta && meta ? (
                <span className="report-btn-meta">{meta}</span>
              ) : null}
              {!themeMeta ? (
                <span className="report-btn-meta">
                  {report.year}
                  {report.category ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="sr-only">Theme: </span>
                      {themeForCategory(report.category) ? (
                        <ThemeSwatch category={report.category} />
                      ) : null}{" "}
                      {report.category}
                    </>
                  ) : null}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function ArchiveFolderList({ titleId, headingRef }) {
  const { selectedFolderId, selectedReportNo, openFolder, openReport, openHelp } =
    useSelection();
  const folderGrouping = groupingIdFromFolderId(selectedFolderId);
  const [browseGrouping, setBrowseGrouping] = useState(
    folderGrouping ?? "theme",
  );
  const grouping = folderGrouping ?? browseGrouping;
  const folders = groupReports(grouping);
  const openFolderMeta =
    folders.find((folder) => folder.id === selectedFolderId) ?? null;
  const hub = !openFolderMeta;

  useEffect(() => {
    if (folderGrouping) setBrowseGrouping(folderGrouping);
  }, [folderGrouping]);

  const onGroupingChange = (id) => {
    setBrowseGrouping(id);
    if (folderGrouping && folderGrouping !== id) {
      openFolder(null);
    }
  };

  if (!hub) {
    return (
      <div className="archive-folder-list">
        <h2
          id={titleId}
          className="report-sidebar-title"
          tabIndex={-1}
          ref={headingRef}
        >
          {openFolderMeta.label}
        </h2>
        <p className="report-sidebar-byline">
          {openFolderMeta.count}{" "}
          {openFolderMeta.count === 1 ? "report" : "reports"}
        </p>
        <GroupingTabs grouping={grouping} onGroupingChange={onGroupingChange} />
        <FolderReports
          folder={openFolderMeta}
          grouping={grouping}
          selectedReportNo={selectedReportNo}
          openReport={openReport}
        />
      </div>
    );
  }

  return (
    <div className="archive-folder-list">
      <h2
        id={titleId}
        className="report-sidebar-title"
        tabIndex={-1}
        ref={headingRef}
      >
        Browse reports
      </h2>
      <p className="report-sidebar-empty">
        Pick a theme, year, type, or method.
      </p>
      <GroupingTabs grouping={grouping} onGroupingChange={onGroupingChange} />

      <ul className="folder-list" id="archive-list" tabIndex={-1}>
        {folders.map((folder) => (
          <li key={folder.id}>
            <button
              type="button"
              id={`folder-btn-${folder.id}`}
              className="folder-btn"
              onClick={() => openFolder(folder.id, { openSidebar: true })}
            >
              <span className="folder-btn-label">
                {folder.color ? <ThemeSwatch color={folder.color} /> : null}
                {folder.label}
              </span>
              <span className="folder-btn-count">{folder.count}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="report-sidebar-empty">
        <button
          type="button"
          className="report-sidebar-see-all"
          onClick={() => openHelp()}
        >
          How to use this catalogue
        </button>
      </p>
    </div>
  );
}
