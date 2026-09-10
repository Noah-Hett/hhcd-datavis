import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { reports } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import { themeColor, themeForCategory } from "../../theme/categories.js";
import ThemeBadge from "../../theme/ThemeBadge.jsx";
import {
  appliedChips,
  buildIndex,
  buildVocab,
  countFacets,
  emptyFilters,
  search,
} from "./search.js";
import {
  clearFacetState,
  filtersAreEmpty,
  setDimension,
} from "./filters.js";
import {
  isEditableTarget,
  isOverlayTarget,
  searchListKeyAction,
  stepActive,
} from "./listKeyboard.js";
import SearchFilters from "./SearchFilters.jsx";
import "./styles.css";

const vocab = buildVocab(reports);
const index = buildIndex(reports);
const facets = countFacets(reports);

export default function ReportSearch() {
  const { selectedReportNo, openReport } = useSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [manual, setManual] = useState(emptyFilters);
  const [suppressed, setSuppressed] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef(new Map());

  const result = useMemo(
    () => search(reports, query, { vocab, index, manual, suppressed }),
    [query, manual, suppressed],
  );
  const chips = result.chips.length ? result.chips : appliedChips(result.filters);
  const matches = result.idle ? [] : result.matches;
  const rest = result.idle ? result.all : result.rest;
  const rows = result.idle ? result.all : [...matches, ...rest];
  const urlQuery = searchParams.get("q") ?? "";
  const canClear = chips.length > 0 || !filtersAreEmpty(manual);

  useEffect(() => {
    const fromUrl = searchParams.get("q") ?? "";
    if (fromUrl !== query) setQuery(fromUrl);
    // Only sync incoming URL changes, not every local keystroke loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setActive(0);
  }, [query, manual, suppressed]);

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

  function applyFacetSet(dimension, value) {
    const next = setDimension({
      dimension,
      value,
      manual,
      suppressed,
      parsedFilters: result.parsed.filters,
    });
    setManual(next.manual);
    setSuppressed(next.suppressed);
  }

  function clearFilters() {
    const next = clearFacetState(result.parsed.filters);
    setManual(next.manual);
    setSuppressed(next.suppressed);
  }

  useEffect(() => {
    function onKey(event) {
      const typing = isEditableTarget(event.target);
      const inInput = event.target === inputRef.current;
      const inFilters = Boolean(event.target?.closest?.(".search-filters"));
      const overlayOpen =
        isOverlayTarget(event.target) ||
        Boolean(document.querySelector("#report-sidebar.is-open")) ||
        Boolean(document.querySelector("#report-sidebar[open]"));
      const action = searchListKeyAction({
        key: event.key,
        typing,
        inInput,
        overlayOpen,
        inFilters,
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
  }, [active, query, rows, openReport, manual, suppressed]);

  function onChange(event) {
    const next = event.target.value;
    setQuery(next);
    writeQuery(next);
  }

  function renderRow(item, i, restRow = false) {
    const report = item.report;
    const current = String(report.reportNo) === String(selectedReportNo);
    const author = report.author || "Unknown author";
    const year = report.year ?? "—";
    const theme = report.category || "—";
    const type = report.projectType || "—";
    const themeHex = themeForCategory(report.category)
      ? themeColor(report.category)
      : undefined;
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
            restRow ? "is-rest" : "",
            !result.idle ? `is-${item.glow}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={themeHex ? { "--theme-color": themeHex } : undefined}
          tabIndex={i === active ? 0 : -1}
          aria-current={current ? "true" : undefined}
          aria-label={`${report.title}, ${author}, ${year}, theme ${theme}, type ${type}`}
          onFocus={() => setActive(i)}
          onClick={(event) => openRow(item, event.currentTarget)}
        >
          <span className="search-row-spine" aria-hidden="true" />
          <span className="search-row-body">
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
                <span className="sr-only">Type </span>
                {type}
              </span>
            </span>
            {themeHex ? (
              <ThemeBadge category={report.category} />
            ) : (
              <span className="search-row-theme">{theme}</span>
            )}
          </span>
        </button>
      </li>
    );
  }

  return (
    <div className="view-search">
      <div className="search-page">
        <header className="search-page-head">
          <h1>Simple view</h1>
          <p className="search-page-lede">
            A keyboard-first list of every report — no 3D archive, no graph.
            Type to rank by meaning, or use the four filters. Arrow keys move
            the list, Enter opens the shared sidebar, Escape returns here.
            Theme colours match the map dots and the archive jackets.
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
              autoFocus={Boolean(urlQuery.trim())}
              aria-controls="search-report-list"
              aria-keyshortcuts="/"
            />
          </label>
          <SearchFilters
            facets={facets}
            chips={chips}
            canClear={canClear}
            onSet={applyFacetSet}
            onClear={clearFilters}
          />
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

        {result.idle ? null : (
          <p className="search-count" aria-live="polite">
            {matches.length} returned · {rest.length} in the rest of the catalogue
          </p>
        )}

        {result.idle ? (
          <ul
            id="search-report-list"
            className="search-list"
            aria-label="All reports"
          >
            {rows.map((item, i) => renderRow(item, i))}
          </ul>
        ) : (
          <div id="search-report-list" className="search-groups">
            <section className="search-group" aria-labelledby="search-returned-heading">
              <h2 id="search-returned-heading" className="search-group-title">
                Returned
                <span className="search-group-count">{matches.length}</span>
              </h2>
              {matches.length === 0 ? (
                <p className="search-group-empty">No reports match this search.</p>
              ) : (
                <ul
                  className="search-list"
                  aria-label={`Returned reports, ${matches.length}`}
                >
                  {matches.map((item, i) => renderRow(item, i))}
                </ul>
              )}
            </section>
            <section className="search-group" aria-labelledby="search-rest-heading">
              <h2 id="search-rest-heading" className="search-group-title">
                Rest of the catalogue
                <span className="search-group-count">{rest.length}</span>
              </h2>
              <ul
                className="search-list"
                aria-label={`Rest of the catalogue, ${rest.length} reports`}
              >
                {rest.map((item, i) => renderRow(item, matches.length + i, true))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
