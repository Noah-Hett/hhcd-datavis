import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { reports } from "../data/index.js";
import { useSelection } from "../state/SelectionContext.jsx";
import { buildIndex, buildVocab, search } from "../views/report-search/search.js";
import { isEditableTarget } from "../views/report-search/listKeyboard.js";
import "../views/report-search/simple-search.css";

const vocab = buildVocab(reports);
const index = buildIndex(reports);

export default function SimpleSearch() {
  const { openReport } = useSelection();
  const { pathname } = useLocation();
  const onSimpleView = pathname.startsWith("/search");
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listId = useId();
  const labelId = useId();
  const statusId = useId();

  const result = useMemo(
    () => search(reports, query, { vocab, index }),
    [query],
  );
  const items = result.idle ? [] : [...result.pops, ...result.nearby];
  const open = listOpen && items.length > 0;
  const showPop = listOpen && !result.idle;
  const trimmed = query.trim();
  const advancedHref = trimmed
    ? `/search?q=${encodeURIComponent(trimmed)}`
    : "/search";

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onKey(event) {
      if (onSimpleView) return;
      if (event.key !== "/") return;
      if (isEditableTarget(event.target)) return;
      if (event.target?.closest?.("dialog[open]")) return;
      event.preventDefault();
      inputRef.current?.focus();
      setListOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSimpleView]);

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
      if (open || showPop) {
        setListOpen(false);
        return;
      }
      if (query) {
        setQuery("");
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
      <label className="simple-search-label" id={labelId} htmlFor={`${listId}-input`}>
        <span className="sr-only">Search reports</span>
        <input
          id={`${listId}-input`}
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
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-keyshortcuts={onSimpleView ? undefined : "/"}
          aria-describedby={statusId}
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
      <p id={statusId} className="sr-only" aria-live="polite">
        {showPop
          ? items.length
            ? `${items.length} suggestions. Use arrows and Enter to open a report.`
            : "No close matches yet."
          : ""}
      </p>
      {showPop ? (
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
            {onSimpleView ? (
              <span>Showing ranking from the catalogue search.</span>
            ) : (
              <Link to={advancedHref}>
                See all reports{trimmed ? ` for “${trimmed}”` : ""} in Simple view
              </Link>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
