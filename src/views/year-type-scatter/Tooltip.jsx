import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TOOLTIP_FADE_MS } from "./mapInteraction.js";
import "./tooltip.css";

const Tooltip = forwardRef(function Tooltip(
  {
    cluster,
    x,
    y,
    placement = "above",
    interactive = false,
    peeked = false,
    onActivate,
    onPointerEnter,
    onPointerLeave,
  },
  ref,
) {
  const [rendered, setRendered] = useState(cluster);
  const [open, setOpen] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (cluster) {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setRendered(cluster);
      const frame = window.requestAnimationFrame(() => setOpen(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setOpen(false);
    hideTimer.current = window.setTimeout(() => {
      setRendered(null);
      hideTimer.current = null;
    }, TOOLTIP_FADE_MS + 40);
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [cluster]);

  if (!rendered) return null;

  const className = [
    "tooltip",
    open ? "is-open" : "",
    placement === "below" ? "is-below" : "",
    interactive ? "is-interactive" : "",
    peeked ? "is-peek" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const title = rendered.reports[0]?.title ?? "report";

  function handleActivate(event) {
    event.preventDefault();
    event.stopPropagation();
    onActivate?.(event);
  }

  const node = (
    <button
      ref={ref}
      type="button"
      className={className}
      style={{ position: "fixed", left: x, top: y }}
      aria-label={`Open report: ${title}`}
      onClick={handleActivate}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {rendered.reports.map((report) => (
        <div key={report.reportNo} className="tooltip-item">
          <strong>{report.title}</strong>
          <span>{report.author}</span>
          <span className="tooltip-meta">
            {report.category} · {report.projectType}
          </span>
        </div>
      ))}
    </button>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
});

export default Tooltip;
