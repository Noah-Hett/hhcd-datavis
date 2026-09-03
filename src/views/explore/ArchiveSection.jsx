import { useEffect, useMemo, useRef, useState } from "react";
import { reports } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveScene from "../project-folders/ArchiveScene.jsx";
import {
  GROUPINGS,
  folderForReport,
  groupReports,
} from "../project-folders/grouping.js";
import {
  carouselAnnouncement,
  stepCarouselIndex,
} from "../project-folders/geometry.js";
import "../project-folders/styles.css";
import "./ArchiveSection.css";
import {
  ORGANIZE_SCALE,
  applyOrganizeDelta,
  isArchiveFiled,
  isFiled,
} from "./archivePhysics.js";

export { ORGANIZE_SCALE, applyOrganizeDelta, isArchiveFiled, isFiled };

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
    reduceMotion,
    openReport,
    openFolder,
    clearReport,
  } = useSelection();
  const stageRef = useRef(null);
  const organizeRef = useRef(0);
  const [grouping, setGrouping] = useState("theme");
  const [internalOrganize, setInternalOrganize] = useState(() =>
    reduceMotion ? 1 : 0,
  );
  const [webglFailed, setWebglFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselKey, setCarouselKey] = useState(
    () => `${grouping}:${selectedFolderId ?? ""}`,
  );
  const nextCarouselKey = `${grouping}:${selectedFolderId ?? ""}`;
  if (nextCarouselKey !== carouselKey) {
    setCarouselKey(nextCarouselKey);
    setCarouselIndex(0);
  }

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
  const openFolderMeta = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );
  const carouselReports = openFolderMeta?.reports ?? [];
  const carouselActive = Boolean(
    isFiled && selectedFolderId && carouselReports.length && !webglFailed,
  );
  const featuredReport = carouselReports[carouselIndex] ?? null;

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
      if (folders[0] && sidebarOpen) {
        openFolder(folders[0].id, { openSidebar: true });
      } else {
        openFolder(null);
      }
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
    if (selectedFolderId) return undefined;
    const handle = window.setTimeout(() => {
      setAnnouncement(
        `Shelves regrouped by ${groupingMeta?.label ?? grouping}. ${folders.length} folders, ${reports.length} reports.`,
      );
    }, 350);
    return () => window.clearTimeout(handle);
  }, [grouping, groupingMeta, folders.length, selectedFolderId]);

  useEffect(() => {
    if (selectedReportNo == null || !carouselReports.length) return;
    const fromOpen = carouselReports.findIndex(
      (report) => report.reportNo === selectedReportNo,
    );
    if (fromOpen >= 0) setCarouselIndex(fromOpen);
  }, [selectedReportNo, carouselReports]);

  useEffect(() => {
    if (!carouselActive || !featuredReport) return undefined;
    const handle = window.setTimeout(() => {
      setAnnouncement(
        carouselAnnouncement(
          carouselIndex,
          carouselReports.length,
          featuredReport.title,
        ),
      );
    }, 40);
    return () => window.clearTimeout(handle);
  }, [
    carouselActive,
    carouselIndex,
    carouselReports.length,
    featuredReport,
  ]);

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
    if (webglFailed && folders[0]) {
      openFolder(folders[0].id, { openSidebar: true });
    }
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
    if (first) openFolder(first.id, { openSidebar: true });
    window.setTimeout(() => {
      const list = document.getElementById("archive-list");
      list?.scrollIntoView();
      list?.focus?.();
    }, 50);
  };

  const stepCarousel = (delta) => {
    if (!carouselReports.length) return;
    setCarouselIndex((current) =>
      stepCarouselIndex(current, delta, carouselReports.length),
    );
  };

  const onCarouselKeyDown = (event) => {
    if (!carouselActive) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepCarousel(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepCarousel(1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (event.target.closest?.(".carousel-btn")) return;
      const report = carouselReports[carouselIndex];
      if (!report) return;
      event.preventDefault();
      selectReport(report.reportNo, event.currentTarget);
    }
  };

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
              <h1
                id="archive-intro-title"
                className={isFiled ? "intro-title sr-only" : "intro-title"}
              >
                HHCD Graduate and Associate Research Reports
              </h1>
              {isFiled ? null : (
                <p className="intro-lead">
                  An unsorted heap. Scroll to file the reports into folders,
                  then choose Theme, Year, or Type — or tap a folder.
                </p>
              )}
            </section>
            <div className="scene-frame">
              <div
                className="scene-stage"
                tabIndex={carouselActive ? 0 : undefined}
                role={carouselActive ? "group" : undefined}
                aria-label={
                  carouselActive && featuredReport
                    ? `Report carousel, ${featuredReport.title}`
                    : undefined
                }
                onKeyDown={onCarouselKeyDown}
              >
                {carouselActive && openFolderMeta ? (
                  <div className="scene-folder-caption" aria-hidden="true">
                    {openFolderMeta.label} ({openFolderMeta.count})
                  </div>
                ) : null}
                {carouselActive && carouselReports.length > 1 ? (
                  <button
                    type="button"
                    className="carousel-btn is-prev"
                    aria-label="Previous report"
                    onClick={() => stepCarousel(-1)}
                  >
                    ‹
                  </button>
                ) : null}
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
                    carouselIndex={carouselIndex}
                    onSelectFolder={(id) => selectFolder(id)}
                    onSelectReport={(reportNo) => selectReport(reportNo)}
                    onCarouselIndexChange={setCarouselIndex}
                    onWebglError={() => setWebglFailed(true)}
                  />
                )}
                {carouselActive && carouselReports.length > 1 ? (
                  <button
                    type="button"
                    className="carousel-btn is-next"
                    aria-label="Next report"
                    onClick={() => stepCarousel(1)}
                  >
                    ›
                  </button>
                ) : null}
              </div>
            </div>
            {isFiled ? (
              <fieldset className="grouping-tabs">
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
