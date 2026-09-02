import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelection } from "../../state/SelectionContext.jsx";
import { reports } from "../year-type-scatter/loadReports.js";
import { COLOR_GROUPS, mapReports } from "../year-type-scatter/mapReports.js";
import {
  MAP_SELECTION_SOURCE,
  reportsMatchingMethods,
  uniqueMethods,
} from "../year-type-scatter/mapFilters.js";
import {
  TOOLTIP_ESTIMATED_HEIGHT,
  TOOLTIP_WIDTH,
  shouldPeekFirst,
  tooltipAnchorAboveDot,
} from "../year-type-scatter/mapInteraction.js";
import ScatterPlot from "../year-type-scatter/ScatterPlot.jsx";
import Tooltip from "../year-type-scatter/Tooltip.jsx";
import MethodCarousel from "../year-type-scatter/MethodCarousel.jsx";
import "../year-type-scatter/styles.css";
import "./MapSection.css";

const MOBILE_QUERY = "(max-width: 799px)";
const TIP_LEAVE_MS = 160;

function relatedIsTooltip(event) {
  return Boolean(event?.relatedTarget?.closest?.(".tooltip"));
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
  const tooltipRef = useRef(null);
  const leaveTimer = useRef(null);
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

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const placeTooltip = useCallback((cluster) => {
    if (!cluster) return;
    const node = dotRefs.current.get(cluster.key);
    if (!node?.getBoundingClientRect) return;
    const rect = node.getBoundingClientRect();
    const tip = tooltipRef.current;
    const next = tooltipAnchorAboveDot({
      dot: rect,
      tipWidth: tip?.offsetWidth || TOOLTIP_WIDTH,
      tipHeight: tip?.offsetHeight || TOOLTIP_ESTIMATED_HEIGHT,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      allowShift: !isCoarsePointer() && !window.matchMedia?.(MOBILE_QUERY)?.matches,
    });
    setTipPos((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
  }, []);

  const handleHover = useCallback(
    (cluster) => {
      cancelLeave();
      setHovered(cluster);
      placeTooltip(cluster);
    },
    [cancelLeave, placeTooltip],
  );

  const handleLeave = useCallback((event) => {
    if (relatedIsTooltip(event)) return;
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => {
      setHovered(null);
      leaveTimer.current = null;
    }, TIP_LEAVE_MS);
  }, [cancelLeave]);

  const clearPeek = useCallback((restoreFocus = false) => {
    const key = peekRestoreKey.current ?? lastTapKey.current;
    cancelLeave();
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
  }, [cancelLeave]);

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

  const handlePeek = useCallback(
    (cluster) => {
      cancelLeave();
      lastTapKey.current = cluster.key;
      peekRestoreKey.current = cluster.key;
      setPeeked(cluster);
      setHovered(cluster);
      placeTooltip(cluster);
    },
    [cancelLeave, placeTooltip],
  );

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

  const handleTooltipActivate = useCallback(
    (event) => {
      const cluster = peeked ?? hovered;
      if (!cluster) return;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      cancelLeave();
      const trigger = dotRefs.current.get(cluster.key) ?? event?.currentTarget;
      lastTapKey.current = cluster.key;
      peekRestoreKey.current = cluster.key;
      openCluster(cluster, trigger);
    },
    [cancelLeave, hovered, openCluster, peeked],
  );

  const handleTooltipEnter = useCallback(() => {
    cancelLeave();
    setHovered((current) => current ?? peeked);
  }, [cancelLeave, peeked]);

  const handleTooltipLeave = useCallback(
    (event) => {
      if (event?.relatedTarget?.closest?.(".dot")) return;
      if (peeked) return;
      handleLeave(event);
    },
    [handleLeave, peeked],
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

  useEffect(() => () => cancelLeave(), [cancelLeave]);

  useLayoutEffect(() => {
    if (!tipCluster) return undefined;
    placeTooltip(tipCluster);
    const onReposition = () => placeTooltip(tipCluster);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [placeTooltip, tipCluster]);

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
              <Tooltip
                ref={tooltipRef}
                cluster={tipCluster}
                x={tipPos.x}
                y={tipPos.y}
                interactive
                peeked={Boolean(peeked)}
                onActivate={handleTooltipActivate}
                onPointerEnter={handleTooltipEnter}
                onPointerLeave={handleTooltipLeave}
              />
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
