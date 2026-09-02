import { useEffect, useId, useRef } from "react";
import "./help-dialog.css";

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
            scrolling scene with the archive and map. Simple view is a
            keyboard-first list of every report — it does not load the 3D
            archive or the year × type graph.
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
              filed. If the 3D scene cannot run, a folder list is the fallback.
            </li>
            <li>
              <strong>Map</strong> — a year × type scatter, coloured by theme,
              with method pills that grey out when they are not active. On a
              phone, the first tap peeks a map tooltip; the second tap opens
              the sidebar. Scroll up from the map to stop on the folders;
              scroll up again after a pause to return to the intro.
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
            The header field is a typeahead that uses the same ranking as
            Simple view. Choosing a match opens the shared sidebar. A footer
            link opens Simple view with that query. Simple view lists every
            report — title, author, year, theme, and type — with chips for
            filters the query applied. You can read the catalogue without
            touching the 3D scene or the graph.
          </p>
          <h3>Keyboard</h3>
          <ul className="help-keys">
            <li>
              <kbd>/</kbd> focuses search — the header typeahead on Explore,
              or the list search on Simple view
            </li>
            <li>
              Arrow keys move through typeahead suggestions, the Simple list,
              method pills, and map dots
            </li>
            <li>
              <kbd>Enter</kbd> opens the selected report in the sidebar
            </li>
            <li>
              <kbd>Escape</kbd> closes help, the typeahead, or the sidebar.
              On Simple view it also returns focus to the search box
            </li>
            <li>
              Skip links jump past the 3D archive to the map, or to the
              folder list fallback
            </li>
          </ul>
        </div>
      </div>
    </dialog>
  );
}
