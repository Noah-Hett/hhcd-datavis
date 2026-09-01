import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { reports } from "../../data/index.js";
import { useSelection } from "../../state/SelectionContext.jsx";
import { appliedChips, buildIndex, buildVocab, search } from "./search.js";
import { stepActive } from "./listKeyboard.js";
import "./styles.css";

const vocab = buildVocab(reports);
const index = buildIndex(reports);

export default function ReportSearch() {
  const { selectedReportNo, openReport } = useSelection();
  const [searchParams, setSearchParams] = useSearchParams();
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

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (event.key === "Escape") {
        if (query && document.activeElement === inputRef.current) {
          setQuery("");
          writeQuery("");
        }
        return;
      }
      if (typing && event.target === inputRef.current) {
        if (event.key === "ArrowDown" && rows.length) {
          event.preventDefault();
          setActive(0);
          itemRefs.current.get(rows[0]?.key)?.focus();
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        setActive((value) => {
          const next = stepActive(value, event.key, rows.length);
          const row = rows[next];
          if (row) itemRefs.current.get(row.key)?.focus();
          return next;
        });
      }
      if (event.key === "Enter") {
        const row = rows[active];
        if (row?.report?.reportNo) {
          event.preventDefault();
          openReport(row.report.reportNo, {
            source: "search",
            returnFocus: itemRefs.current.get(row.key),
          });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, query, rows, openReport]);

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

  function onChange(event) {
    const next = event.target.value;
    setQuery(next);
    writeQuery(next);
  }

  return (
    <div className="view-search">
      <div className="search-page">
        <header className="search-page-head">
          <p className="search-page-eyebrow">{reports.length} reports</p>
          <h1>Simple view</h1>
          <p className="search-page-lede">
            A keyboard-first list of every report. Type to rank by meaning;
            chips show the filters the query applied. Enter opens the shared
            sidebar.
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

        <ul className="search-list" aria-label="All reports">
          {rows.map((item, i) => {
            const report = item.report;
            const current =
              String(report.reportNo) === String(selectedReportNo);
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
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={(event) =>
                    openReport(report.reportNo, {
                      source: "search",
                      returnFocus: event.currentTarget,
                    })
                  }
                >
                  <span className="search-row-title">{report.title}</span>
                  <span className="search-row-meta">
                    <span>{report.author || "Unknown author"}</span>
                    <span>{report.year ?? "—"}</span>
                    <span>{report.category || "—"}</span>
                    <span>{report.projectType || "—"}</span>
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
