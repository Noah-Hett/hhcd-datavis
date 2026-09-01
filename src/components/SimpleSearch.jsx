import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { reports } from "../data/index.js";
import { useSelection } from "../state/SelectionContext.jsx";
import { buildIndex, buildVocab, search } from "../views/report-search/search.js";
import "../views/report-search/simple-search.css";

const vocab = buildVocab(reports);
const index = buildIndex(reports);

export default function SimpleSearch() {
  const { openReport } = useSelection();
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listId = useId();
  const labelId = useId();

  const result = useMemo(
    () => search(reports, query, { vocab, index }),
    [query],
  );
  const items = result.idle ? [] : [...result.pops, ...result.nearby];
  const open = listOpen && items.length > 0;
  const advancedHref = query.trim()
    ? `/search?q=${encodeURIComponent(query.trim())}`
    : "/search";

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        setListOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function choose(item) {
    const reportNo = item?.report?.reportNo;
    if (!reportNo) return;
    openReport(reportNo, {
      source: "search",
      returnFocus: inputRef.current,
    });
    setListOpen(false);
  }

  function onInputKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (open || query) {
        setListOpen(false);
        if (!open) setQuery("");
        return;
      }
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      if (!items.length) return;
      event.preventDefault();
      setListOpen(true);
      setActive((value) => Math.min(items.length - 1, value + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      if (!items.length) return;
      event.preventDefault();
      setListOpen(true);
      setActive((value) => Math.max(0, value - 1));
      return;
    }
    if (event.key === "Enter") {
      if (open && items[active]) {
        event.preventDefault();
        choose(items[active]);
      }
    }
  }

  return (
    <div className="simple-search">
      <label className="simple-search-label" id={labelId}>
        <span className="sr-only">Search reports</span>
        <input
          ref={inputRef}
          type="search"
          className="simple-search-input"
          role="combobox"
          placeholder="Search reports"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          value={query}
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && items[active] ? `${listId}-${items[active].key}` : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setListOpen(true);
          }}
          onFocus={() => setListOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setListOpen(false), 120);
          }}
          onKeyDown={onInputKeyDown}
        />
      </label>
      {listOpen && !result.idle ? (
        <div className="simple-search-pop">
          <ul
            id={listId}
            className="simple-search-list"
            role="listbox"
            aria-label="Search suggestions"
          >
            {items.map((item, i) => (
              <li key={item.key} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${item.key}`}
                  role="option"
                  aria-selected={i === active}
                  className={
                    i === active
                      ? "simple-search-option is-active"
                      : "simple-search-option"
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(item)}
                >
                  <span className="simple-search-year">
                    {item.report.year ?? "—"}
                  </span>
                  <span className="simple-search-copy">
                    <strong>{item.report.title}</strong>
                    <em>{item.report.author}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {items.length === 0 ? (
            <p className="simple-search-empty">No close matches yet.</p>
          ) : null}
          <p className="simple-search-footer">
            {pathname.startsWith("/search") ? (
              <span>Showing ranking from the catalogue search.</span>
            ) : (
              <Link to={advancedHref}>Open advanced search</Link>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
