import { forwardRef } from "react";
import { createPortal } from "react-dom";

const Tooltip = forwardRef(function Tooltip(
  {
    cluster,
    x,
    y,
    interactive = false,
    peeked = false,
    onActivate,
    onPointerEnter,
    onPointerLeave,
  },
  ref,
) {
  if (!cluster) return null;

  const className = [
    "tooltip",
    interactive ? "is-interactive" : "",
    peeked ? "is-peek" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const title = cluster.reports[0]?.title ?? "report";

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
      style={{ left: x, top: y }}
      aria-label={`Open report: ${title}`}
      onClick={handleActivate}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {cluster.reports.map((report) => (
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
