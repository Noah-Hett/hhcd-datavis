import { useSelection } from "../state/SelectionContext.jsx";
import "./help-guide.css";

export default function HelpGuide({ titleId, headingRef }) {
  const { reduceMotion, setReduceMotion } = useSelection();

  return (
    <div className="sidebar-help">
      <h2
        id={titleId}
        className="report-sidebar-title"
        tabIndex={-1}
        ref={headingRef}
      >
        How to use this catalogue
      </h2>
      <p className="report-sidebar-lede">
        Two pages share one header and one sidebar. Explore is a scrolling
        scene with the archive and map. Simple view is a keyboard-first list of
        every report — it does not load the 3D archive or the year × type
        graph.
      </p>
      <h3>Mode switch</h3>
      <p>
        The house Home control and the Folders / Map / Simple toggle track what
        you are looking at. Scrolling Explore updates the selection: the
        unsorted pile selects Home, filed folders select Folders, and the
        scatter selects Map.
      </p>
      <ol>
        <li>
          <strong>Home</strong> — the unsorted pile of reports at the top of
          Explore. Scroll down to file them into folders.
        </li>
        <li>
          <strong>Folders</strong> — the archive once reports are filed into
          magazine folders. Theme, Year, and Type appear once they are filed.
          Scroll up to return to the pile, or down to the map. If the 3D scene
          cannot run, a folder list is the fallback.
        </li>
        <li>
          <strong>Map</strong> — a year × type scatter, coloured by theme, with
          method pills that grey out when they are not active. On a phone, the
          first tap peeks a map tooltip; the second tap opens the sidebar.
        </li>
        <li>
          <strong>Simple</strong> — a keyboard-first list of every report. It
          does not load the 3D archive or the year × type graph.
        </li>
      </ol>
      <h3>Browse from a report</h3>
      <p>
        Theme, type, year, and method on a report are buttons. Choose Health
        and wellbeing to see every report in that theme, then open another.
        Connected reports and “More in this theme” work the same way. Opening
        Sidebar with nothing selected starts from Browse. Help lives in this
        same panel.
      </p>
      <h3>Grouping and methods</h3>
      <p>
        Folder grouping (Theme / Year / Type) only changes the archive. Method
        pills only filter the map. They never hide — inactive methods stay
        visible, greyed.
      </p>
      <h3>Search versus Simple view</h3>
      <p>
        The header field is a typeahead that uses the same ranking as Simple
        view. Choosing a match opens the shared sidebar. A footer link opens
        Simple view with that query. Simple view lists every report — title,
        author, year, theme, and type — with chips for filters the query
        applied. You can read the catalogue without touching the 3D scene or
        the graph.
      </p>
      <h3>Keyboard</h3>
      <ul className="help-keys">
        <li>
          <kbd>/</kbd> focuses search — the header typeahead on Explore, or the
          list search on Simple view
        </li>
        <li>
          Arrow keys move through typeahead suggestions, the Simple list,
          method pills, and map dots
        </li>
        <li>
          <kbd>Enter</kbd> opens the selected report in the sidebar
        </li>
        <li>
          <kbd>Escape</kbd> leaves Help for the previous sidebar view, or
          closes the sidebar. On Simple view it also returns focus to the
          search box
        </li>
        <li>
          Skip links jump past the 3D archive to the map, or to the folder
          list fallback
        </li>
      </ul>
      <h3>Motion</h3>
      <label className="help-reduce-motion">
        <input
          type="checkbox"
          checked={reduceMotion}
          onChange={(event) => setReduceMotion(event.currentTarget.checked)}
        />
        <span>
          Reduce motion
          <span className="help-reduce-motion-copy">
            Skip Explore scroll-snap and the archive filing animation. Your
            system’s reduced-motion setting still applies.
          </span>
        </span>
      </label>
    </div>
  );
}
