import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveSection from "./ArchiveSection.jsx";
import {
  isFiled,
  organizeFromScroll,
  waypointFromScroll,
} from "./archivePhysics.js";
import MapSection from "./MapSection.jsx";

const SCROLL_IDS = ["intro", "archive", "map"];

const WAYPOINTS = [
  { id: "archive", label: "Folders", href: "#archive" },
  { id: "map", label: "Map", href: "#map" },
  { id: "simple", label: "Simple", to: "/search" },
];

function keepSearch(search) {
  return search || "";
}

export { waypointFromScroll };

export default function Explore() {
  const { hash, search } = useLocation();
  const { reduceMotion } = useSelection();
  const query = keepSearch(search);
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const [organize, setOrganize] = useState(() => (reduceMotion ? 1 : 0));
  const [waypoint, setWaypoint] = useState(() => {
    const id = hash.replace(/^#/, "");
    return SCROLL_IDS.includes(id) ? id : "intro";
  });
  const filed = isFiled(organize, reduceMotion);
  organizeRef.current = organize;

  useEffect(() => {
    if (reduceMotion) setOrganize(1);
  }, [reduceMotion]);

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (SCROLL_IDS.includes(id)) {
      setWaypoint(id);
    }
    const scrollToHash = () => {
      const node = id ? document.getElementById(id) : null;
      node?.scrollIntoView({ block: "start" });
    };
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToHash);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const syncFromScroll = () => {
      const archive = document.getElementById("archive");
      const map = document.getElementById("map");
      const archiveTop = archive?.offsetTop ?? 0;
      const mapTop = map?.offsetTop;
      setWaypoint(
        waypointFromScroll({
          scrollTop: scroller.scrollTop,
          archiveTop,
          mapTop,
        }),
      );
      if (reduceMotion) {
        if (organizeRef.current !== 1) setOrganize(1);
        return;
      }
      const next = organizeFromScroll(scroller.scrollTop, archiveTop);
      if (Math.abs(next - organizeRef.current) > 0.004) {
        setOrganize(next);
      }
    };

    scroller.addEventListener("scroll", syncFromScroll, { passive: true });
    syncFromScroll();
    return () => scroller.removeEventListener("scroll", syncFromScroll);
  }, [reduceMotion]);

  return (
    <div className="view-explore">
      <div
        className="explore-scroll"
        data-filed={filed ? "true" : "false"}
        data-reduce-motion={reduceMotion ? "true" : "false"}
        ref={scrollRef}
      >
        <div className="explore-waypoints-slot">
          <nav className="explore-waypoints" aria-label="Explore waypoints">
            {WAYPOINTS.map((item) => {
              const current = item.id !== "simple" && waypoint === item.id;
              if (item.to) {
                return (
                  <Link
                    key={item.id}
                    to={{ pathname: item.to, search: query }}
                    aria-current={current ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={current ? "true" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="explore-archive-span">
          <ArchiveSection
            organize={organize}
            onOrganizeChange={setOrganize}
            captureWheel={false}
          />
          <section
            id="intro"
            className="explore-section"
            aria-label="Archive introduction"
          />
          <section
            id="archive"
            className="explore-section"
            aria-label="Project folder archive"
          />
        </div>
        <section
          id="map"
          className="explore-section explore-map"
          aria-label="Year by project type map"
        >
          <MapSection />
        </section>
      </div>
    </div>
  );
}
