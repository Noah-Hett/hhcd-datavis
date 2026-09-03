import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveSection from "./ArchiveSection.jsx";
import {
  hashNeedsReplace,
  isFiled,
  normalizeExploreHash,
  organizeFromScroll,
  waypointFromScroll,
} from "./archivePhysics.js";
import MapSection from "./MapSection.jsx";

const SCROLL_IDS = ["intro", "archive", "map"];

export default function Explore() {
  const { hash, search } = useLocation();
  const navigate = useNavigate();
  const { reduceMotion } = useSelection();
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const waypointRef = useRef(normalizeExploreHash(hash));
  const hashRef = useRef(hash);
  const searchRef = useRef(search);
  const skipHashScrollRef = useRef(false);
  const suppressWaypointWriteRef = useRef(false);
  const [organize, setOrganize] = useState(() => (reduceMotion ? 1 : 0));
  const filed = isFiled(organize, reduceMotion);
  organizeRef.current = organize;
  hashRef.current = hash;
  searchRef.current = search;

  useEffect(() => {
    if (reduceMotion) setOrganize(1);
  }, [reduceMotion]);

  useEffect(() => {
    const id = normalizeExploreHash(hash);
    waypointRef.current = id;

    if (skipHashScrollRef.current) {
      skipHashScrollRef.current = false;
      return undefined;
    }

    const scroller = scrollRef.current;
    suppressWaypointWriteRef.current = true;

    const releaseSuppress = () => {
      suppressWaypointWriteRef.current = false;
    };

    const scrollToHash = () => {
      const node = SCROLL_IDS.includes(id) ? document.getElementById(id) : null;
      node?.scrollIntoView({ block: "start" });
    };
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToHash);
    });
    const timeout = window.setTimeout(releaseSuppress, 450);
    scroller?.addEventListener("scrollend", releaseSuppress, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      scroller?.removeEventListener("scrollend", releaseSuppress);
      releaseSuppress();
    };
  }, [hash]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const syncFromScroll = () => {
      const archive = document.getElementById("archive");
      const map = document.getElementById("map");
      const archiveTop = archive?.offsetTop ?? 0;
      const mapTop = map?.offsetTop ?? null;

      if (!reduceMotion) {
        const next = organizeFromScroll(scroller.scrollTop, archiveTop);
        if (Math.abs(next - organizeRef.current) > 0.004) {
          setOrganize(next);
        }
      } else if (organizeRef.current !== 1) {
        setOrganize(1);
      }

      if (suppressWaypointWriteRef.current) return;

      const waypoint = waypointFromScroll({
        scrollTop: scroller.scrollTop,
        archiveTop,
        mapTop,
      });
      if (waypoint === waypointRef.current) return;
      if (!hashNeedsReplace(hashRef.current, waypoint)) {
        waypointRef.current = waypoint;
        return;
      }

      waypointRef.current = waypoint;
      skipHashScrollRef.current = true;
      navigate(
        {
          pathname: "/",
          search: searchRef.current || "",
          hash: waypoint,
        },
        { replace: true },
      );
    };

    scroller.addEventListener("scroll", syncFromScroll, { passive: true });
    syncFromScroll();
    return () => scroller.removeEventListener("scroll", syncFromScroll);
  }, [reduceMotion, navigate]);

  return (
    <div className="view-explore">
      <div
        className="explore-scroll"
        data-filed={filed ? "true" : "false"}
        data-reduce-motion={reduceMotion ? "true" : "false"}
        ref={scrollRef}
      >
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
