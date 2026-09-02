import { useEffect, useMemo, useRef, useState } from "react";
import { reports, yearRange } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveScene from "../project-folders/ArchiveScene.jsx";
import {
  GROUPINGS,
  folderForReport,
  groupReports,
} from "../project-folders/grouping.js";
import "../project-folders/styles.css";
import "./ArchiveSection.css";
import {
  ORGANIZE_SCALE,
  applyOrganizeDelta,
  isArchiveFiled,
  isFiled,
} from "./archivePhysics.js";

export { ORGANIZE_SCALE, applyOrganizeDelta, isArchiveFiled, isFiled };

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
  const {
    selectedReportNo,
    selectedFolderId,
    sidebarOpen,
    source,
    openReport,
    openFolder,
    clearReport,
  } = useSelection();
  const stageRef = useRef(null);
  const organizeRef = useRef(0);
  const [grouping, setGrouping] = useState("theme");
  const [internalOrganize, setInternalOrganize] = useState(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [webglFailed, setWebglFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

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
    const next = folderForReport(grouping, selectedReportNo);
    if (selectedReportNo && next) {
      if (next.id !== selectedFolderId) {
        openReport(selectedReportNo, {
          folderId: next.id,
          source: source ?? "archive",
        });
      }
      return;
    }
    if (
      selectedFolderId &&
      !folders.some((folder) => folder.id === selectedFolderId)
    ) {
      if (folders[0] && sidebarOpen) openFolder(folders[0].id);
      else openFolder(null);
    }
  }, [
    grouping,
    selectedReportNo,
    selectedFolderId,
    folders,
    sidebarOpen,
    source,
    openReport,
    openFolder,
  ]);

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
    if (webglFailed && folders[0]) openFolder(folders[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglFailed]);

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

  const selectFolder = (id) => {
    if (!isFiled) finishIntro();
    if (!id || id === selectedFolderId) {
      openFolder(null);
      return;
    }
    openFolder(id);
  };

  const selectReport = (reportNo, trigger) => {
    if (!isFiled) finishIntro();
    if (!reportNo) {
      clearReport();
      return;
    }
    const folder = folderForReport(grouping, reportNo);
    openReport(reportNo, {
      source: "archive",
      returnFocus: trigger,
      folderId: folder?.id ?? selectedFolderId,
    });
  };

  const skipToFolderList = (event) => {
    event.preventDefault();
    finishIntro();
    const first = folders[0];
    if (first) openFolder(first.id);
    window.setTimeout(() => {
      const list = document.getElementById("archive-list");
      list?.scrollIntoView();
      list?.focus?.();
    }, 50);
  };

  const hint = !isFiled
    ? "Scroll or swipe the archive to file the reports into magazine folders. Theme, Year, and Type regroup the shelves after that."
    : "Use Theme, Year, or Type to regroup. Tap a folder to bring it closer; tap a risen report to open it. The sidebar list has every report.";

  return (
    <div className="view-folders archive-section">
      <div
        className={`archive is-wide ${isFiled ? "is-filed" : "is-unfiled"}`}
        data-organize={organize}
        data-filed={isFiled ? "true" : "false"}
      >
        <a className="skip-link" href="#archive-list" onClick={skipToFolderList}>
          Skip 3D scene, browse folders as a list
        </a>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <div className="stage">
          <div className="stage-visual" ref={stageRef}>
            <section className="intro" aria-labelledby="archive-intro-title">
              <h1 id="archive-intro-title" className="intro-title">
                HHCD graduate and associate research reports
              </h1>
              <p className="intro-lead">
                {reports.length} reports, {yearRange.min}–{yearRange.max}.{" "}
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
                    list in the sidebar has the same reports and grouping.
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
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(event) =>
                      setReduceMotion(event.currentTarget.checked)
                    }
                  />
                  Reduce motion
                </label>
              </div>
            </header>
          </div>
        </div>
      </div>
    </div>
  );
}
