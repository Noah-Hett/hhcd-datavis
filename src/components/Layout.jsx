import { Suspense, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import HelpDialog from "./HelpDialog.jsx";
import SimpleSearch from "./SimpleSearch.jsx";
import { useSelection } from "../state/SelectionContext.jsx";

function viewKey(pathname) {
  if (pathname.startsWith("/search")) return "search";
  return "explore";
}

function keepSearch(search) {
  return search || "";
}

export default function Layout() {
  const { pathname, search } = useLocation();
  const { sidebarOpen, setSidebarOpen, selectedReportNo } = useSelection();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButtonRef = useRef(null);
  const fill = !pathname.startsWith("/search");
  const query = keepSearch(search);

  return (
    <div className="app" data-view={viewKey(pathname)}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      {fill ? (
        <a className="skip-link skip-link-archive" href="#map">
          Skip 3D archive
        </a>
      ) : null}
      <header className="app-header">
        <NavLink to="/" className="app-brand" end>
          <span className="app-brand-wordmark">HHCD</span>
        </NavLink>

        <div className="app-chrome">
          <SimpleSearch />

          <div className="mode-toggle" role="group" aria-label="View mode">
            <NavLink
              to={{ pathname: "/", search: query }}
              end
              className="mode-toggle-btn"
            >
              Explore
            </NavLink>
            <NavLink
              to={{ pathname: "/search", search: query }}
              className="mode-toggle-btn mode-toggle-simple"
            >
              Simple
            </NavLink>
          </div>

          <button
            type="button"
            ref={helpButtonRef}
            className="chrome-btn chrome-btn-accent"
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            aria-controls="help-dialog"
            onClick={() => setHelpOpen(true)}
          >
            Help
          </button>

          <button
            type="button"
            className="chrome-btn chrome-btn-accent"
            aria-expanded={sidebarOpen}
            aria-controls="report-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            Sidebar
            {selectedReportNo ? (
              <span className="chrome-btn-dot" aria-hidden="true" />
            ) : null}
          </button>
        </div>
      </header>
      <HelpDialog
        open={helpOpen}
        onClose={() => {
          setHelpOpen(false);
          helpButtonRef.current?.focus();
        }}
      />
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
