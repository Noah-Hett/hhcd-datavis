import { useEffect, useMemo, useRef, useState } from "react";
import { reports } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveScene from "../project-folders/ArchiveScene.jsx";
import {
  GROUPINGS,
  folderForReport,
  groupReports,
} from "../project-folders/grouping.js";
import "../project-folders/styles.css";
import "./ArchiveSection.css";

const STACKED_QUERY = "(max-width: 860px)";
export const ORGANIZE_SCALE = 900;

export function applyOrganizeDelta(current, deltaY, scale = ORGANIZE_SCALE) {
  return Math.min(1, Math.max(0, current + deltaY / scale));
}

export function isArchiveFiled(organize, reduceMotion = false) {
  return Boolean(reduceMotion) || Number(organize) >= 1;
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ArchiveSection({
  organize: organizeProp,
  onOrganizeChange,
  onOrganizeDelta,
  captureWheel = true,
}) {
  const { selectedReportNo, openReport, clearReport } = useSelection();
  const stageRef = useRef(null);
  const organizeRef = useRef(0);
  const listButtonRef = useRef(null);
  const [grouping, setGrouping] = useState("theme");
  const [internalOrganize, setInternalOrganize] = useState(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [webglFailed, setWebglFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [stacked, setStacked] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(STACKED_QUERY).matches
      : false,
  );
  const [listOpen, setListOpen] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(STACKED_QUERY).matches
      : false,
  );

  const controlled = organizeProp != null;
  const organize = reduceMotion ? 1 : controlled ? organizeProp : internalOrganize;
  const isFiled = isArchiveFiled(organize, reduceMotion);
  organizeRef.current = organize;

  const setOrganize = (next) => {
    const clamped = Math.min(1, Math.max(0, next));
    if (!controlled) setInternalOrganize(clamped);
    onOrganizeChange?.(clamped);
  };

  const applyDelta = (dy) => {
    const current = organizeRef.current;
    const next = applyOrganizeDelta(current, dy);
    if (next === current) return current;
    setOrganize(next);
    return next;
  };

  const folders = useMemo(() => groupReports(grouping), [grouping]);
  const groupingMeta = GROUPINGS.find((item) => item.id === grouping);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(STACKED_QUERY);
    const onChange = () => {
      const next = media.matches;
      setStacked(next);
      setListOpen(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const next = folderForReport(grouping, selectedReportNo);
    if (selectedReportNo && next) {
      setSelectedFolderId(next.id);
      return;
    }
    if (
      selectedFolderId &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      setSelectedFolderId(null);
    }
  }, [grouping, selectedReportNo, folders, selectedFolderId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setAnnouncement(
        `Shelves regrouped by ${groupingMeta?.label ?? grouping}. ${folders.length} folders, ${reports.length} reports.`,
      );
    }, 350);
    return () => window.clearTimeout(handle);
  }, [grouping, groupingMeta, folders.length]);

  useEffect(() => {
    if (!onOrganizeDelta) return;
    onOrganizeDelta.current = applyDelta;
    return () => {
      if (onOrganizeDelta.current === applyDelta) {
        onOrganizeDelta.current = null;
      }
    };
    // applyDelta closes over setOrganize; rebind when control mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOrganizeDelta, controlled]);

  useEffect(() => {
    if (reduceMotion) setOrganize(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (!captureWheel) return undefined;
    const el = stageRef.current;
    if (!el || reduceMotion) return undefined;
    const onWheel = (event) => {
      const current = organizeRef.current;
      if (current >= 1 && event.deltaY > 0) return;
      if (current <= 0 && event.deltaY < 0) return;
      event.preventDefault();
      applyDelta(event.deltaY);
    };
    let touchY = null;
    const onTouchStart = (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event) => {
      if (touchY == null) return;
      const y = event.touches[0]?.clientY;
      if (y == null) return;
      const dy = touchY - y;
      const current = organizeRef.current;
      if (current >= 1 && dy > 0) return;
      event.preventDefault();
      applyDelta(dy);
      touchY = y;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, captureWheel]);

  const finishIntro = () => setOrganize(1);

  const goToGrouping = (id) => {
    setGrouping(id);
    if (!isFiled) finishIntro();
  };

  const openList = () => setListOpen(true);

  const toggleList = () => {
    setListOpen((open) => {
      const next = !open;
      setAnnouncement(next ? "Folder list shown." : "Folder list hidden.");
      return next;
    });
  };

  const selectFolder = (id) => {
    if (!isFiled) finishIntro();
    if (!id || id === selectedFolderId) {
      setSelectedFolderId(null);
      return;
    }
    setSelectedFolderId(id);
  };

  const selectReport = (reportNo, trigger) => {
    if (!isFiled) finishIntro();
    if (!reportNo) {
      clearReport();
      return;
    }
    const folder = folderForReport(grouping, reportNo);
    setSelectedFolderId(folder?.id ?? null);
    setListOpen(true);
    openReport(reportNo, { source: "archive", returnFocus: trigger });
  };

  const hint = !isFiled
    ? "Scroll or swipe the archive to file the reports into magazine folders. Theme, Year, and Type regroup the shelves after that."
    : "Use Theme, Year, or Type to regroup. Tap a folder to bring it closer; tap a risen report to open it. The list has every report.";

  const panel = (
    <aside
      className="panel"
      id="archive-panel"
      hidden={!listOpen}
      aria-label="Folder list"
    >
      <div className="panel-scroll">
        <FolderIndex
          groupingMeta={groupingMeta}
          folders={folders}
          selectedFolderId={selectedFolderId}
          selectedReportNo={selectedReportNo}
          onSelectFolder={selectFolder}
          onSelectReport={selectReport}
        />
      </div>
      <div className="panel-footer">
        <label className="toggle">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.currentTarget.checked)}
          />
          Reduce motion
        </label>
      </div>
    </aside>
  );

  return (
    <div className="view-folders archive-section">
      <div
        className={`archive ${stacked ? "is-stacked" : "is-wide"} ${listOpen ? "is-list-open" : "is-list-closed"} ${isFiled ? "is-filed" : "is-unfiled"}`}
        data-organize={organize}
        data-filed={isFiled ? "true" : "false"}
      >
        <a
          className="skip-link"
          href="#folder-index"
          onClick={(event) => {
            event.preventDefault();
            finishIntro();
            openList();
            window.setTimeout(() => {
              document.getElementById("folder-index")?.scrollIntoView();
            }, 50);
          }}
        >
          Skip 3D scene, browse folders as a list
        </a>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <div className="stage">
          <div className="stage-visual" ref={stageRef}>
            <section className="intro" aria-labelledby="archive-intro-title">
              <h1 id="archive-intro-title" className="intro-title">
                Graduate and associate research reports
              </h1>
              <p className="intro-lead">
                Helen Hamlyn Centre for Design. {reports.length} reports,{" "}
                2000–2017.{" "}
                {!isFiled
                  ? "These documents are on show — not yet divided into folders. Scroll, swipe, or file them by theme, year, or type."
                  : "The reports are filed in magazine folders. Theme, year, and type regroup the shelves."}
              </p>
            </section>
            <div className="scene-frame">
              {webglFailed ? (
                <div className="webgl-fallback" role="status">
                  <p>
                    The 3D archive could not start in this browser. The folder
                    list on this page has the same reports and grouping.
                  </p>
                </div>
              ) : (
                <ArchiveScene
                  grouping={grouping}
                  organize={organize}
                  reduceMotion={reduceMotion}
                  selectedFolderId={selectedFolderId}
                  selectedReportNo={selectedReportNo}
                  onSelectFolder={(id) => selectFolder(id)}
                  onSelectReport={(reportNo) => selectReport(reportNo)}
                  onWebglError={() => setWebglFailed(true)}
                />
              )}
              <p className="scene-hint">{hint}</p>
            </div>
            <header className="archive-bar">
              <fieldset className="grouping-tabs" hidden={!isFiled}>
                <legend className="sr-only">Regroup the archive</legend>
                {GROUPINGS.map((item) => (
                  <label
                    key={item.id}
                    className={grouping === item.id ? "is-active" : ""}
                  >
                    <input
                      type="radio"
                      name="archive-grouping"
                      value={item.id}
                      checked={grouping === item.id}
                      onChange={() => goToGrouping(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>
              <div className="archive-bar-end">
                <p className="scene-status">
                  {reports.length} reports · {folders.length} folders
                </p>
                {!isFiled ? (
                  <button
                    type="button"
                    className="list-toggle"
                    onClick={finishIntro}
                  >
                    File into folders
                  </button>
                ) : null}
                <button
                  type="button"
                  className="list-toggle"
                  ref={listButtonRef}
                  aria-expanded={listOpen}
                  aria-controls="archive-panel"
                  onClick={toggleList}
                >
                  {listOpen ? "Hide list" : "Show list"}
                </button>
              </div>
            </header>
          </div>
          {!stacked ? panel : null}
        </div>
        {stacked ? panel : null}
      </div>
    </div>
  );
}

function FolderIndex({
  groupingMeta,
  folders,
  selectedFolderId,
  selectedReportNo,
  onSelectFolder,
  onSelectReport,
}) {
  return (
    <div>
      <h2 className="panel-title">Folder list</h2>
      <p className="panel-lead">
        {groupingMeta?.description} The shelves show a peek of documents in
        each folder — this list is the full set.
      </p>

      <h2 className="panel-kicker" id="folder-heading">
        Folders by {groupingMeta?.label?.toLowerCase()}
      </h2>
      <ul className="folder-list" id="folder-index">
        {folders.map((folder) => {
          const open = folder.id === selectedFolderId;
          return (
            <li key={folder.id}>
              <button
                type="button"
                className={`folder-btn ${open ? "is-open" : ""}`}
                aria-expanded={open}
                aria-controls={`folder-reports-${folder.id}`}
                onClick={() => onSelectFolder(folder.id)}
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
                        onSelectReport(report.reportNo, event.currentTarget)
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
