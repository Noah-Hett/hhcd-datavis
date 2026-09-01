import { useEffect, useId, useRef } from "react";

export default function HelpDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
      closeRef.current?.focus();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      id="help-dialog"
      ref={dialogRef}
      className="help-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="help-dialog-panel">
        <div className="help-dialog-bar">
          <h2 id={titleId}>How to use this catalogue</h2>
          <button
            type="button"
            ref={closeRef}
            className="help-dialog-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="help-dialog-body">
          <p>
            Two pages share one header and one report sidebar. Explore is a
            scrolling scene; Simple is a keyboard-first list of every report.
          </p>
          <h3>Three waypoints</h3>
          <ol>
            <li>
              <strong>Intro</strong> — the 64 graduate and associate reports
              sit on show, 2000–2017, not yet filed.
            </li>
            <li>
              <strong>Archive</strong> — scroll or swipe to file documents into
              magazine folders. Theme, Year, and Type appear once they are
              filed.
            </li>
            <li>
              <strong>Map</strong> — a year × type scatter, coloured by theme,
              with method pills that grey out when they are not active.
            </li>
          </ol>
          <h3>Grouping and methods</h3>
          <p>
            Folder grouping (Theme / Year / Type) only changes the archive.
            Method pills only filter the map. They never hide — inactive
            methods stay visible, greyed.
          </p>
          <h3>Search versus Simple view</h3>
          <p>
            The header search is a quick typeahead on Explore. Simple view is
            the full ranked list, with the same search engine and chips for
            what the query applied.
          </p>
          <h3>Keyboard</h3>
          <ul>
            <li>
              <kbd>/</kbd> focuses search
            </li>
            <li>
              Arrow keys move through search results, method pills, and map
              dots
            </li>
            <li>
              <kbd>Escape</kbd> closes help, search, or the report sidebar
            </li>
            <li>Skip links jump past the 3D archive to the list or map</li>
          </ul>
        </div>
      </div>
    </dialog>
  );
}
