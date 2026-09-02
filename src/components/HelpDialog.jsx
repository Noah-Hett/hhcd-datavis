import { useEffect, useId, useRef } from "react";
import { useSelection } from "../state/SelectionContext.jsx";
import "./help-dialog.css";

export default function HelpDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(null);
  const { reduceMotion, setReduceMotion } = useSelection();

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
          <h3>Mode switch</h3>
          <p>
            Folders, Map, and Simple are the header toggle — not three
            waypoints over the canvas. Intro is the start of Folders scroll,
            so Folders stays selected there and at the archive.
          </p>
          <ol>
            <li>
              <strong>Folders</strong> — the archive. Scroll down from the
              intro to file documents into magazine folders; scroll up from
              the map to return here. Theme, Year, and Type appear once they
              are filed. If the 3D scene cannot run, a folder list is the
              fallback.
            </li>
            <li>
              <strong>Map</strong> — a year × type scatter, coloured by theme,
              with method pills that grey out when they are not active. On a
              phone, the first tap peeks a map tooltip; the second tap opens
              the sidebar.
            </li>
            <li>
              <strong>Simple</strong> — a keyboard-first list of every report.
              It does not load the 3D archive or the year × type graph.
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
          <h3>Motion</h3>
          <label className="help-reduce-motion">
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(event) =>
                setReduceMotion(event.currentTarget.checked)
              }
            />
            <span>
              Reduce motion
              <span className="help-reduce-motion-copy">
                Skip Explore scroll-snap and the archive filing animation.
                Your system’s reduced-motion setting still applies.
              </span>
            </span>
          </label>
        </div>
      </div>
    </dialog>
  );
}
