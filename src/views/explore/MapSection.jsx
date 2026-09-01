import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSelection } from "../../state/SelectionContext.jsx";
import { reports } from "../year-type-scatter/loadReports.js";
import { COLOR_GROUPS, mapReports } from "../year-type-scatter/mapReports.js";
import ScatterPlot from "../year-type-scatter/ScatterPlot.jsx";
import Tooltip from "../year-type-scatter/Tooltip.jsx";
import MethodCarousel from "../year-type-scatter/MethodCarousel.jsx";
import "../year-type-scatter/styles.css";
import "./MapSection.css";

const MOBILE_QUERY = "(max-width: 799px)";

function uniqueMethods(allReports) {
  const counts = new Map();
  for (const report of allReports) {
    for (const method of report.methods) {
      counts.set(method, (counts.get(method) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function reportsMatchingMethods(allReports, selectedMethods) {
  if (selectedMethods.size === 0) return allReports;
  return allReports.filter((report) =>
    report.methods.some((method) => selectedMethods.has(method)),
  );
}

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

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(media.matches);
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

  const openCluster = useCallback(
    (cluster, trigger) => {
      const reportNo = cluster.reports[0]?.reportNo;
      if (!reportNo) return;
      openReport(reportNo, { source: "map", returnFocus: trigger });
    },
    [openReport],
  );

  const handlePeek = useCallback(
    (cluster, event) => {
      lastTapKey.current = cluster.key;
      setPeeked(cluster);
      if (event) setTipPos(tooltipPosition(event));
      setHovered(cluster);
    },
    [],
  );

  const handleActivate = useCallback(
    (cluster, event) => {
      const trigger = event?.currentTarget;
      const keyboard = event?.type === "keydown";
      const touchLike = !keyboard && isCoarsePointer();
      if (touchLike && lastTapKey.current !== cluster.key) {
        handlePeek(cluster, event);
        return;
      }
      lastTapKey.current = cluster.key;
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
                  type="button"
                  className="map-methods-launch"
                  aria-haspopup="dialog"
                  aria-expanded={methodsOpen}
                  onClick={() => setMethodsOpen(true)}
                >
                  Methods
                  {selectedMethods.size > 0
                    ? ` (${selectedMethods.size} active)`
                    : ""}
                </button>
                {methodsOpen ? (
                  <dialog
                    className="map-methods-dialog"
                    open
                    aria-labelledby={methodsTitleId}
                    onCancel={(event) => {
                      event.preventDefault();
                      setMethodsOpen(false);
                    }}
                    onClick={(event) => {
                      if (event.target === event.currentTarget) {
                        setMethodsOpen(false);
                      }
                    }}
                  >
                    <div className="map-methods-sheet">
                      <div className="map-methods-sheet-bar">
                        <h2 id={methodsTitleId}>Filter by method</h2>
                        <button
                          type="button"
                          onClick={() => setMethodsOpen(false)}
                        >
                          Done
                        </button>
                      </div>
                      {methodsControl}
                    </div>
                  </dialog>
                ) : null}
              </div>
            ) : (
              methodsControl
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
