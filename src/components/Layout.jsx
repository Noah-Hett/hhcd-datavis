import { Suspense } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { reports, yearRange } from "../data/index.js";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/folders", label: "Project folders" },
  { to: "/year-type", label: "Year \u00d7 type" },
  { to: "/search", label: "Search" },
];

// Full-bleed views own the whole viewport below the header (no page scroll);
// everything else scrolls normally.
const FILL_ROUTES = new Set(["/folders", "/year-type"]);

function viewKey(pathname) {
  if (pathname.startsWith("/folders")) return "folders";
  if (pathname.startsWith("/year-type")) return "year-type";
  if (pathname.startsWith("/search")) return "search";
  return "home";
}

export default function Layout() {
  const { pathname } = useLocation();
  const fill = FILL_ROUTES.has(pathname);

  return (
    <div className="app" data-view={viewKey(pathname)}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app-header">
        <NavLink to="/" className="app-brand" end>
          <span className="app-brand-mark" aria-hidden="true">
            HH
          </span>
          <span className="app-brand-text">
            <span className="app-brand-name">HHCD DataVis</span>
            <span className="app-brand-meta">
              {reports.length} reports · {yearRange.min}–{yearRange.max}
            </span>
          </span>
        </NavLink>
        <nav className="app-nav" aria-label="Visualisations">
          <ul>
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className={fill ? "app-main is-fill" : "app-main is-scroll"}>
        <Suspense
          fallback={
            <p className="app-loading" role="status">
              Loading…
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
