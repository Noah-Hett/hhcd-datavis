import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSelection } from "../../state/SelectionContext.jsx";
import { reports } from "../year-type-scatter/loadReports.js";
import { COLOR_GROUPS, mapReports } from "../year-type-scatter/mapReports.js";
import {
  MAP_SELECTION_SOURCE,
  reportsMatchingMethods,
  uniqueMethods,
} from "../year-type-scatter/mapFilters.js";
import { shouldPeekFirst } from "../year-type-scatter/mapInteraction.js";
import ScatterPlot from "../year-type-scatter/ScatterPlot.jsx";
import Tooltip from "../year-type-scatter/Tooltip.jsx";
import MethodCarousel from "../year-type-scatter/MethodCarousel.jsx";
import "../year-type-scatter/styles.css";
import "./MapSection.css";

const MOBILE_QUERY = "(max-width: 799px)";

function tooltipPosition(event) {
  const pad = 12;
  const width = 280;
  const estimatedHeight = 120;
  let x;
  let y;

  if (event.type === "focus" && event.currentTarget?.getBoundingClientRect) {
    const box = event.currentTarget.getBoundingClientRect();
    x = box.right + 8;
    y = box.top;
  } else {
    x = event.clientX + 16;
    y = event.clientY + 16;
  }

  if (x + width > window.innerWidth - pad) {
    x = Math.max(pad, window.innerWidth - width - pad);
  }
  if (y + estimatedHeight > window.innerHeight - pad) {
    y = Math.max(pad, window.innerHeight - estimatedHeight - pad);
  }
  return { x, y };
}

function isCoarsePointer() {
  return Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
}

export default function MapSection() {
  const { selectedReportNo, openReport } = useSelection();
  const methodOptions = useMemo(() => uniqueMethods(reports), []);
  const fullMapped = useMemo(() => mapReports(reports), []);
  const [selectedMethods, setSelectedMethods] = useState(() => new Set());
  const filteredReports = useMemo(
    () => reportsMatchingMethods(reports, selectedMethods),
    [selectedMethods],
  );
  const mapped = useMemo(() => mapReports(filteredReports), [filteredReports]);
  const [hovered, setHovered] = useState(null);
  const [peeked, setPeeked] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  );
  const [methodsOpen, setMethodsOpen] = useState(false);
  const lastTapKey = useRef(null);
  const dotRefs = useRef(new Map());
  const methodsTitleId = useId();
  const methodsDialogId = useId();
  const dialogRef = useRef(null);
  const launchRef = useRef(null);
  const peekRestoreKey = useRef(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      const next = media.matches;
      setMobile(next);
      if (!next) setMethodsOpen(false);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setDotRef = useCallback((key, node) => {
    if (node) dotRefs.current.set(key, node);
    else dotRefs.current.delete(key);
  }, []);

  const handleHover = useCallback((cluster, event) => {
    setHovered(cluster);
    if (event) setTipPos(tooltipPosition(event));
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const clearPeek = useCallback((restoreFocus = false) => {
    const key = peekRestoreKey.current ?? lastTapKey.current;
    setPeeked(null);
    setHovered(null);
    lastTapKey.current = null;
    peekRestoreKey.current = null;
    if (restoreFocus && key) {
      const node = dotRefs.current.get(key);
      if (node && typeof node.focus === "function") {
        window.setTimeout(() => node.focus(), 0);
      }
    }
  }, []);

  const openCluster = useCallback(
    (cluster, trigger) => {
      const reportNo = cluster.reports[0]?.reportNo;
      if (!reportNo) return;
      openReport(reportNo, {
        source: MAP_SELECTION_SOURCE,
        returnFocus: trigger,
      });
    },
    [openReport],
  );

  const handlePeek = useCallback((cluster, event) => {
    lastTapKey.current = cluster.key;
    peekRestoreKey.current = cluster.key;
    setPeeked(cluster);
    if (event) setTipPos(tooltipPosition(event));
    setHovered(cluster);
  }, []);

  const handleActivate = useCallback(
    (cluster, event) => {
      const trigger = event?.currentTarget;
      const peek = shouldPeekFirst({
        keyboard: event?.type === "keydown",
        coarsePointer: isCoarsePointer(),
        lastTapKey: lastTapKey.current,
        clusterKey: cluster.key,
      });
      if (peek) {
        handlePeek(cluster, event);
        return;
      }
      lastTapKey.current = cluster.key;
      peekRestoreKey.current = cluster.key;
      openCluster(cluster, trigger);
    },
    [handlePeek, openCluster],
  );

  const handleToggleMethod = useCallback((label) => {
    setSelectedMethods((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleClearMethods = useCallback(() => {
    setSelectedMethods(new Set());
  }, []);

  const closeMethods = useCallback(() => {
    setMethodsOpen(false);
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (methodsOpen && !dialog.open) {
      dialog.showModal();
      const title = dialog.querySelector(".map-methods-sheet-bar h2");
      title?.focus();
    }
    if (!methodsOpen && dialog.open) {
      dialog.close();
    }
  }, [methodsOpen]);

  useEffect(() => {
    setPeeked((current) => {
      if (!current) return current;
      return mapped.clusters.find((cluster) => cluster.key === current.key) ?? null;
    });
    setHovered((current) => {
      if (!current) return current;
      return mapped.clusters.find((cluster) => cluster.key === current.key) ?? null;
    });
  }, [mapped]);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      if (event.target?.closest?.("dialog[open]")) return;
      if (methodsOpen) return;
      if (selectedReportNo) return;
      if (!peeked && !hovered) return;
      event.preventDefault();
      clearPeek(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearPeek, hovered, methodsOpen, peeked, selectedReportNo]);

  useEffect(() => {
    if (!peeked) return undefined;
    function onPointerDown(event) {
      if (event.target?.closest?.(".dot, .tooltip, .map-methods-dialog, .map-methods-launch")) {
        return;
      }
      clearPeek(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [clearPeek, peeked]);

  const selectedCluster = useMemo(() => {
    if (!selectedReportNo) return null;
    return (
      mapped.clusters.find((cluster) =>
        cluster.reports.some(
          (report) => String(report.reportNo) === String(selectedReportNo),
        ),
      ) ?? null
    );
  }, [mapped, selectedReportNo]);

  const tipCluster = hovered ?? peeked;
  const status =
    mapped.unmappedCount === 0
      ? `${mapped.plottedCount} of ${reports.length} reports plotted`
      : `${mapped.plottedCount} of ${reports.length} reports plotted · ${mapped.unmappedCount} unmapped`;

  const methodsControl = (
    <MethodCarousel
      methods={methodOptions}
      selected={selectedMethods}
      onToggle={handleToggleMethod}
      onClear={handleClearMethods}
      variant={mobile ? "sheet" : "carousel"}
    />
  );

  return (
    <div className="view-year-type map-section">
      <div className="workspace">
        <div className="toolbar">
          <p className="status">{status}</p>
          <ul className="legend" aria-label="Research theme">
            {COLOR_GROUPS.map((group) => (
              <li key={group.id}>
                <span className="swatch" style={{ background: group.color }} />
                {group.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="chart-row">
          <div className="chart-wrap">
            <div className="plot-stage">
              <ScatterPlot
                clusters={mapped.clusters}
                yearMin={fullMapped.yearMin}
                yearMax={fullMapped.yearMax}
                hoveredKey={tipCluster?.key ?? null}
                selectedKey={selectedCluster?.key ?? null}
                onHover={handleHover}
                onLeave={handleLeave}
                onSelect={handleActivate}
                onActivate={openCluster}
                onDotRef={setDotRef}
              />
              <Tooltip cluster={tipCluster} x={tipPos.x} y={tipPos.y} />
            </div>
            {mobile ? (
              <div className="map-methods-mobile">
                <button
                  ref={launchRef}
                  type="button"
                  className="map-methods-launch"
                  aria-haspopup="dialog"
                  aria-expanded={methodsOpen}
                  aria-controls={methodsDialogId}
                  onClick={() => setMethodsOpen(true)}
                >
                  Methods
                  {selectedMethods.size > 0
                    ? ` (${selectedMethods.size} active)`
                    : ""}
                </button>
                <dialog
                  ref={dialogRef}
                  id={methodsDialogId}
                  className="map-methods-dialog"
                  aria-labelledby={methodsTitleId}
                  onClose={() => {
                    setMethodsOpen(false);
                    launchRef.current?.focus();
                  }}
                  onCancel={(event) => {
                    event.preventDefault();
                    closeMethods();
                  }}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      closeMethods();
                    }
                  }}
                >
                  <div className="map-methods-sheet">
                    <div className="map-methods-sheet-bar">
                      <h2 id={methodsTitleId} tabIndex={-1}>
                        Filter by method
                      </h2>
                      <button type="button" onClick={closeMethods}>
                        Done
                      </button>
                    </div>
                    {methodsControl}
                  </div>
                </dialog>
              </div>
            ) : (
              <MethodCarousel
                methods={methodOptions}
                selected={selectedMethods}
                onToggle={handleToggleMethod}
                onClear={handleClearMethods}
                variant="carousel"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
