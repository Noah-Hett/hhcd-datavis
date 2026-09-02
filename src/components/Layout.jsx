import { Suspense, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import HelpDialog from "./HelpDialog.jsx";
import ReportSidebar from "./ReportSidebar.jsx";
import SimpleSearch from "./SimpleSearch.jsx";
import { useSelection } from "../state/SelectionContext.jsx";

function viewKey(pathname) {
  if (pathname.startsWith("/search")) return "search";
  return "explore";
}

function keepSearch(search) {
  return search || "";
}

function modeFromLocation(pathname, hash) {
  if (pathname.startsWith("/search")) return "simple";
  if (hash.replace(/^#/, "") === "map") return "map";
  return "folders";
}

function ChromeIcon({ children }) {
  return (
    <svg
      className="chrome-btn-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const MODE_SEGMENTS = [
  {
    id: "folders",
    label: "Folders",
    to: (query) => ({ pathname: "/", search: query, hash: "archive" }),
    icon: (
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M2.25 4.75h4.1l1.15 1.4H13.75v6.6H2.25z"
      />
    ),
  },
  {
    id: "map",
    label: "Map",
    to: (query) => ({ pathname: "/", search: query, hash: "map" }),
    icon: (
      <>
        <circle cx="5" cy="5.25" r="1.15" fill="currentColor" />
        <circle cx="11.1" cy="6.6" r="1.15" fill="currentColor" />
        <circle cx="7.4" cy="11.1" r="1.15" fill="currentColor" />
      </>
    ),
  },
  {
    id: "simple",
    label: "Simple",
    to: (query) => ({ pathname: "/search", search: query }),
    icon: (
      <>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          d="M5.5 4.5h7M5.5 8h7M5.5 11.5h7"
        />
        <circle cx="3.25" cy="4.5" r="0.9" fill="currentColor" />
        <circle cx="3.25" cy="8" r="0.9" fill="currentColor" />
        <circle cx="3.25" cy="11.5" r="0.9" fill="currentColor" />
      </>
    ),
  },
];

export default function Layout() {
  const { pathname, search, hash } = useLocation();
  const { sidebarOpen, setSidebarOpen } = useSelection();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButtonRef = useRef(null);
  const fill = !pathname.startsWith("/search");
  const query = keepSearch(search);
  const mode = modeFromLocation(pathname, hash);

  return (
    <div
      className={sidebarOpen ? "app is-sidebar-open" : "app"}
      data-view={viewKey(pathname)}
    >
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      {fill ? (
        <a className="skip-link skip-link-archive" href="#map">
          Skip 3D archive
        </a>
      ) : null}
      <header className="app-header">
        <div className="app-header-start">
          <NavLink to="/" className="app-brand" end>
            <ChromeIcon>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                d="M2.5 7.5 8 2.75 13.5 7.5v6.25H9.25v-3.5H6.75v3.5H2.5z"
              />
            </ChromeIcon>
            <span className="sr-only">Home</span>
          </NavLink>
          <SimpleSearch />
        </div>

        <div className="mode-toggle" role="group" aria-label="View mode">
          {MODE_SEGMENTS.map((segment) => {
            const current = mode === segment.id;
            return (
              <Link
                key={segment.id}
                className="mode-toggle-seg"
                to={segment.to(query)}
                aria-current={current ? "true" : undefined}
              >
                <ChromeIcon>{segment.icon}</ChromeIcon>
                {segment.label}
              </Link>
            );
          })}
        </div>

        <div className="app-chrome">
          <button
            type="button"
            ref={helpButtonRef}
            className="chrome-btn"
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            aria-controls="help-dialog"
            onClick={() => setHelpOpen(true)}
          >
            <ChromeIcon>
              <circle
                cx="8"
                cy="8"
                r="5.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M6.35 6.2c.15-1.05.95-1.75 1.75-1.75.95 0 1.75.7 1.75 1.65 0 .85-.55 1.3-1.25 1.65-.5.25-.75.55-.75 1.15"
              />
              <circle cx="8" cy="11.2" r="0.8" fill="currentColor" />
            </ChromeIcon>
            Help
          </button>

          <button
            type="button"
            className="chrome-btn"
            aria-expanded={sidebarOpen}
            aria-controls="report-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChromeIcon>
              <rect
                x="2.25"
                y="3"
                width="11.5"
                height="10"
                rx="1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                d="M6.5 3v10"
              />
            </ChromeIcon>
            Sidebar
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
      <div className="app-body">
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
        <ReportSidebar />
      </div>
    </div>
  );
}
