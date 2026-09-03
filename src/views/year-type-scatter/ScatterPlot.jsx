import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Y_BANDS, clusterAriaLabel } from "./mapReports.js";
import { Y_COL, plotLayout } from "./plotLayout.js";
import {
  DOT_HOVER_PAD,
  dotIsDimmed,
  dotPaintOrder,
  nearestDotAt,
  pointerToSvgPoint,
} from "./mapInteraction.js";

function xForYear(year, yearMin, yearMax, layout) {
  const span = Math.max(yearMax - yearMin, 1);
  const pad = 0.6;
  const t = (year - yearMin + pad) / (span + pad * 2);
  return layout.left + t * layout.innerWidth;
}

function yForBand(yBand, layout) {
  const n = Y_BANDS.length;
  const top = layout.top;
  const bottom = layout.originY - 18;
  if (n <= 1) return (top + bottom) / 2;
  const t = yBand / (n - 1);
  return bottom - t * (bottom - top);
}

function usePlotSize() {
  const frameRef = useRef(null);
  const scrollRef = useRef(null);
  const [size, setSize] = useState({ viewportWidth: 0, height: 0 });

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const scroll = scrollRef.current;
    if (!frame || !scroll) return undefined;

    const read = () => {
      // Prefer frame width minus the fixed Y column so a leftover horizontal
      // scrollbar cannot shrink clientWidth and keep the plot "scrollable".
      const frameWidth = Math.round(frame.clientWidth);
      const fromFrame = frameWidth - Y_COL;
      const fromScroll = Math.round(scroll.clientWidth);
      const viewportWidth = Math.max(
        fromFrame > 1 ? fromFrame : fromScroll,
        1,
      );
      const height = Math.round(
        scroll.clientHeight || frame.getBoundingClientRect().height,
      );
      if (height < 2 || viewportWidth < 2) return;
      setSize((prev) =>
        Math.abs(prev.viewportWidth - viewportWidth) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
          ? prev
          : { viewportWidth, height },
      );
    };

    read();
    const raf = requestAnimationFrame(read);
    const observer = new ResizeObserver(read);
    observer.observe(frame);
    observer.observe(scroll);
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  return { frameRef, scrollRef, size };
}

function AxisArrowMarker({ id }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="8"
      markerHeight="8"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text)" />
    </marker>
  );
}

export default function ScatterPlot({
  clusters,
  yearMin,
  yearMax,
  hoveredKey,
  selectedKey,
  onHover,
  onLeave,
  onSelect,
  onActivate,
  onDotRef,
}) {
  const { frameRef, scrollRef, size } = usePlotSize();
  const layout = plotLayout(size.viewportWidth, size.height, yearMin, yearMax);
  const ready = size.viewportWidth > 1 && size.height > 1;
  const painted = useMemo(
    () => dotPaintOrder(clusters, hoveredKey, selectedKey),
    [clusters, hoveredKey, selectedKey],
  );
  const marks = useMemo(
    () =>
      clusters.map((cluster) => ({
        cluster,
        r: cluster.r,
        x: xForYear(cluster.year, yearMin, yearMax, layout) + cluster.dx,
        y: yForBand(cluster.yBand, layout) + cluster.dy,
      })),
    [clusters, layout, yearMin, yearMax],
  );

  function hitCluster(event) {
    const pt = pointerToSvgPoint(event, event.currentTarget);
    if (!pt) return null;
    return nearestDotAt(marks, pt.x, pt.y)?.cluster ?? null;
  }

  function handlePlotPointerMove(event) {
    const cluster = hitCluster(event);
    if (cluster) {
      if (cluster.key !== hoveredKey) onHover(cluster, event);
      return;
    }
    if (hoveredKey) onLeave(event);
  }

  function handlePlotPointerLeave(event) {
    if (hoveredKey) onLeave(event);
  }

  function handlePlotClick(event) {
    const cluster = hitCluster(event);
    if (cluster) onSelect(cluster, event);
  }

  function handleKeyDown(event, cluster) {
    if (event.key === "Enter") {
      event.preventDefault();
      (onActivate ?? onSelect)(cluster, event);
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      onSelect(cluster, event);
    }
  }

  return (
    <div
      className={
        layout.scrollable ? "scatter-frame is-scrollable" : "scatter-frame"
      }
      ref={frameRef}
    >
      <div className="scatter-y-col">
        {ready ? (
          <svg
            className="scatter-y"
            width={Y_COL}
            height={layout.height}
            viewBox={`0 0 ${Y_COL} ${layout.height}`}
            overflow="visible"
            aria-hidden="true"
            style={{ width: Y_COL, height: layout.height }}
          >
            {Y_BANDS.map((band) => {
              const y = yForBand(band.id, layout);
              return (
                <foreignObject
                  key={band.id}
                  x={8}
                  y={y - 22}
                  width={Y_COL - 16}
                  height={44}
                >
                  <div xmlns="http://www.w3.org/1999/xhtml" className="y-label">
                    {band.label}
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        ) : null}
      </div>
      <div
        className="scatter-scroll"
        ref={scrollRef}
        tabIndex={layout.scrollable ? 0 : undefined}
        role={layout.scrollable ? "region" : undefined}
        aria-label={
          layout.scrollable
            ? "Year axis. Scroll horizontally to see later years."
            : undefined
        }
      >
        {ready ? (
          <div
            className="scatter-surface"
            style={{ width: layout.plotWidth, height: layout.height }}
          >
            <svg
              className="scatter-plot"
              width={layout.plotWidth}
              height={layout.height}
              viewBox={`0 0 ${layout.plotWidth} ${layout.height}`}
              preserveAspectRatio="none"
              overflow="visible"
              aria-label="HHCD reports by year and project type"
              aria-describedby="scatter-desc"
              style={{ width: layout.plotWidth, height: layout.height }}
              onPointerMove={handlePlotPointerMove}
              onPointerLeave={handlePlotPointerLeave}
              onClick={handlePlotClick}
            >
              <desc id="scatter-desc">
                Scatter plot of research associate reports. The horizontal axis
                is year. The vertical axis is project type, from conceptual
                framework at the bottom to products / media campaign at the top,
                each on a faint horizontal track. Each report is a same-size
                dot, coloured by research theme. Reports that share a year and
                type pack into a small cluster. Activate a dot to read the
                report. On a narrow window, scroll horizontally to keep year
                spacing readable.
              </desc>

              <defs>
                <AxisArrowMarker id="axis-arrow-x" />
              </defs>

              <rect
                className="scatter-hit-plane"
                x={0}
                y={0}
                width={layout.plotWidth}
                height={layout.height}
                fill="transparent"
              />

              {Y_BANDS.map((band) => (
                <line
                  key={band.id}
                  className="band-track"
                  x1={0}
                  y1={yForBand(band.id, layout)}
                  x2={layout.plotWidth}
                  y2={yForBand(band.id, layout)}
                />
              ))}

              <line
                className="axis-line"
                x1={0}
                y1={layout.originY}
                x2={layout.arrowRight}
                y2={layout.originY}
                markerEnd="url(#axis-arrow-x)"
              />

              {(() => {
                const ticks = [];
                const first = Math.ceil(Math.max(yearMin, 2000) / 5) * 5;
                for (let y = first; y <= yearMax; y += 5) ticks.push(y);
                return ticks.map((y) => (
                  <g key={y}>
                    <line
                      className="x-tick"
                      x1={xForYear(y, yearMin, yearMax, layout)}
                      y1={layout.originY}
                      x2={xForYear(y, yearMin, yearMax, layout)}
                      y2={layout.originY + 6}
                    />
                    <text
                      className="x-end"
                      x={xForYear(y, yearMin, yearMax, layout)}
                      y={layout.originY + 18}
                      textAnchor="middle"
                    >
                      {y}
                    </text>
                  </g>
                ));
              })()}

              {painted.map((cluster) => {
                const cx =
                  xForYear(cluster.year, yearMin, yearMax, layout) + cluster.dx;
                const cy = yForBand(cluster.yBand, layout) + cluster.dy;
                const selected = selectedKey === cluster.key;
                const active = hoveredKey === cluster.key || selected;
                const dimmed = dotIsDimmed({
                  clusterKey: cluster.key,
                  selectedKey,
                });
                return (
                  <g
                    key={cluster.key}
                    className={
                      [
                        "dot",
                        active ? "active" : "",
                        selected ? "is-selected" : "",
                        dimmed ? "is-dimmed" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                    transform={`translate(${cx} ${cy})`}
                    tabIndex={0}
                    role="button"
                    aria-label={clusterAriaLabel(cluster)}
                    aria-pressed={selected}
                    ref={(node) => onDotRef?.(cluster.key, node)}
                    onFocus={(event) => onHover(cluster, event)}
                    onBlur={onLeave}
                    onKeyDown={(event) => handleKeyDown(event, cluster)}
                  >
                    <circle
                      className="dot-hit"
                      r={cluster.r + DOT_HOVER_PAD}
                      fill="transparent"
                    />
                    <circle
                      className="dot-mark"
                      r={cluster.r}
                      fill={cluster.color}
                      stroke="var(--text)"
                      strokeWidth={active ? 1.6 : 1}
                    />
                    <circle className="dot-focus" r={cluster.r + 3.5} />
                  </g>
                );
              })}
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
