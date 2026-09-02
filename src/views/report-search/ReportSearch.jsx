import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { reports } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import { appliedChips, buildIndex, buildVocab, search } from "./search.js";
import {
  isEditableTarget,
  isOverlayTarget,
  searchListKeyAction,
  stepActive,
} from "./listKeyboard.js";
import "./styles.css";

const vocab = buildVocab(reports);
const index = buildIndex(reports);

export default function ReportSearch() {
  const { selectedReportNo, openReport } = useSelection();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = search || "";
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef(new Map());

  const result = useMemo(
    () => search(reports, query, { vocab, index }),
    [query],
  );
  const chips = result.chips.length ? result.chips : appliedChips(result.filters);
  const rows = result.all;

  useEffect(() => {
    const fromUrl = searchParams.get("q") ?? "";
    if (fromUrl !== query) setQuery(fromUrl);
    // Only sync incoming URL changes, not every local keystroke loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function writeQuery(next) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next.trim()) params.set("q", next);
        else params.delete("q");
        return params;
      },
      { replace: true },
    );
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function focusRow(next) {
    const row = rows[next];
    if (row) itemRefs.current.get(row.key)?.focus();
  }

  function openRow(row, trigger) {
    if (!row?.report?.reportNo) return;
    openReport(row.report.reportNo, {
      source: "search",
      returnFocus: trigger ?? itemRefs.current.get(row.key),
    });
  }

  useEffect(() => {
    function onKey(event) {
      const typing = isEditableTarget(event.target);
      const inInput = event.target === inputRef.current;
      const overlayOpen =
        isOverlayTarget(event.target) ||
        Boolean(document.querySelector("#help-dialog")?.open) ||
        Boolean(document.querySelector("#report-sidebar.is-open")) ||
        Boolean(document.querySelector("#report-sidebar[open]"));
      const action = searchListKeyAction({
        key: event.key,
        typing,
        inInput,
        overlayOpen,
        length: rows.length,
      });
      if (!action) return;

      if (action.type === "focus-input") {
        event.preventDefault();
        focusInput();
        return;
      }
      if (action.type === "escape-input") {
        if (query) {
          event.preventDefault();
          setQuery("");
          writeQuery("");
        } else {
          inputRef.current?.blur();
        }
        return;
      }
      if (action.type === "focus-row") {
        event.preventDefault();
        setActive(action.index);
        focusRow(action.index);
        return;
      }
      if (action.type === "move") {
        event.preventDefault();
        setActive((value) => {
          const next = stepActive(value, action.key, rows.length);
          const row = rows[next];
          if (row) itemRefs.current.get(row.key)?.focus();
          return next;
        });
        return;
      }
      if (action.type === "open") {
        if (event.target?.closest?.(".search-row")) return;
        const row = rows[active];
        if (row?.report?.reportNo) {
          event.preventDefault();
          openRow(row);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // focusRow / openRow / writeQuery close over the current rows and query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, query, rows, openReport]);

  function onChange(event) {
    const next = event.target.value;
    setQuery(next);
    writeQuery(next);
  }

  return (
    <div className="view-search">
      <div className="search-waypoints-slot">
        <nav className="explore-waypoints" aria-label="Explore waypoints">
          <Link to={{ pathname: "/", search: queryString, hash: "archive" }}>
            Folders
          </Link>
          <Link to={{ pathname: "/", search: queryString, hash: "map" }}>
            Map
          </Link>
          <Link
            to={{ pathname: "/search", search: queryString }}
            aria-current="true"
          >
            Simple
          </Link>
        </nav>
      </div>
      <div className="search-page">
        <header className="search-page-head">
          {result.idle ? null : (
            <p className="search-page-eyebrow">{rows.length} reports</p>
          )}
          <h1>Simple view</h1>
          <p className="search-page-lede">
            A keyboard-first list of every report — no 3D archive, no graph.
            Type to rank by meaning; chips show the filters the query applied.
            Arrow keys move, Enter opens the shared sidebar, Escape returns
            here.
          </p>
          <label className="search-page-box">
            <span className="sr-only">Search all reports</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={onChange}
              placeholder="lighting, growing older, interviews…"
              autoComplete="off"
              spellCheck="false"
              enterKeyHint="search"
              autoFocus
              aria-controls="search-report-list"
              aria-keyshortcuts="/"
            />
          </label>
          {chips.length > 0 ? (
            <ul className="search-chips" aria-label="Applied filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <span className="search-chip">{chip.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.corrections.length > 0 ? (
            <p className="search-didyou">
              Treating{" "}
              {result.corrections.map((item, i) => (
                <span key={`${item.from}-${item.to}`}>
                  {i ? ", " : ""}
                  <s>{item.from}</s> as {item.to}
                </span>
              ))}
            </p>
          ) : null}
        </header>

        <p className="search-count" aria-live="polite">
          {result.idle
            ? `${rows.length} reports`
            : `${result.pops.length} close matches · ${rows.length} in the list`}
        </p>

        <ul
          id="search-report-list"
          className="search-list"
          aria-label="All reports"
        >
          {rows.map((item, i) => {
            const report = item.report;
            const current =
              String(report.reportNo) === String(selectedReportNo);
            const author = report.author || "Unknown author";
            const year = report.year ?? "—";
            const theme = report.category || "—";
            const type = report.projectType || "—";
            return (
              <li key={item.key}>
                <button
                  type="button"
                  ref={(node) => {
                    if (node) itemRefs.current.set(item.key, node);
                    else itemRefs.current.delete(item.key);
                  }}
                  className={[
                    "search-row",
                    i === active ? "is-active" : "",
                    current ? "is-current" : "",
                    !result.idle ? `is-${item.glow}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  tabIndex={i === active ? 0 : -1}
                  aria-current={current ? "true" : undefined}
                  aria-label={`${report.title}, ${author}, ${year}, theme ${theme}, type ${type}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={(event) =>
                    openRow(item, event.currentTarget)
                  }
                >
                  <span className="search-row-title">{report.title}</span>
                  <span className="search-row-meta">
                    <span>
                      <span className="sr-only">Author </span>
                      {author}
                    </span>
                    <span>
                      <span className="sr-only">Year </span>
                      {year}
                    </span>
                    <span>
                      <span className="sr-only">Theme </span>
                      {theme}
                    </span>
                    <span>
                      <span className="sr-only">Type </span>
                      {type}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
