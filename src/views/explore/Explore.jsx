import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ArchiveSection from "./ArchiveSection.jsx";
import {
  FROM_MAP_LOCK_MS,
  applyOrganizeDelta,
  isFiled,
  isPastArchive,
  shouldParkOnArchive,
  shouldUnfileTowardIntro,
  waypointFromScroll,
} from "./archivePhysics.js";
import MapSection from "./MapSection.jsx";

const WAYPOINTS = [
  { id: "intro", label: "Intro" },
  { id: "archive", label: "Archive" },
  { id: "map", label: "Map" },
];

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { waypointFromScroll };

export default function Explore() {
  const { hash } = useLocation();
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const organizeDeltaRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [organize, setOrganize] = useState(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const [waypoint, setWaypoint] = useState(() => {
    const id = hash.replace(/^#/, "");
    return WAYPOINTS.some((item) => item.id === id) ? id : "intro";
  });
  const filed = isFiled(organize, reduceMotion);
  organizeRef.current = organize;
  const wasFiledRef = useRef(filed);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      const next = media.matches;
      setReduceMotion(next);
      if (next) setOrganize(1);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (id === "intro" && !reduceMotion) {
      setOrganize(0);
    }
    if (id === "archive" || id === "map") {
      setOrganize(1);
    }
    if (WAYPOINTS.some((item) => item.id === id)) {
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
  }, [hash, reduceMotion]);

  useEffect(() => {
    if (filed && !wasFiledRef.current && hash !== "#map") {
      document.getElementById("archive")?.scrollIntoView({ block: "start" });
    }
    wasFiledRef.current = filed;
  }, [filed, hash]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const syncWaypoint = () => {
      const archive = document.getElementById("archive");
      const map = document.getElementById("map");
      setWaypoint(
        waypointFromScroll({
          scrollTop: scroller.scrollTop,
          archiveTop: archive?.offsetTop,
          mapTop: map?.offsetTop,
          filed: isFiled(organizeRef.current, reduceMotion),
        }),
      );
    };

    scroller.addEventListener("scroll", syncWaypoint, { passive: true });
    syncWaypoint();
    return () => scroller.removeEventListener("scroll", syncWaypoint);
  }, [reduceMotion, filed]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || reduceMotion) return undefined;

    const apply = (dy) => {
      if (organizeDeltaRef.current) {
        return organizeDeltaRef.current(dy);
      }
      const next = applyOrganizeDelta(organizeRef.current, dy);
      if (next !== organizeRef.current) setOrganize(next);
      return next;
    };

    const onMap = () =>
      isPastArchive(
        scroller.scrollTop,
        document.getElementById("map")?.offsetTop,
      );

    const lockToIntro = () => {
      if (organizeRef.current >= 1) return;
      const archive = document.getElementById("archive");
      if (archive && scroller.scrollTop >= archive.offsetTop - 8) return;
      if (scroller.scrollTop > 1) scroller.scrollTop = 0;
    };

    const parkOnArchive = () => {
      const archive = document.getElementById("archive");
      if (!archive) return;
      const top = archive.offsetTop;
      if (Math.abs(scroller.scrollTop - top) > 2) {
        scroller.scrollTo({ top, behavior: "auto" });
      }
    };

    let fromMapLock = false;
    let fromMapTimer = 0;
    const armFromMapLock = () => {
      fromMapLock = true;
      window.clearTimeout(fromMapTimer);
      fromMapTimer = window.setTimeout(() => {
        fromMapLock = false;
      }, FROM_MAP_LOCK_MS);
    };

    const handleDelta = (deltaY, event) => {
      const current = organizeRef.current;
      const motion = {
        deltaY,
        onMap: onMap(),
        fromMapLock,
        organize: current,
      };
      // Mid-file: consume the wheel so snap cannot skip the archive.
      if (current > 0 && current < 1) {
        event.preventDefault();
        apply(deltaY);
        lockToIntro();
        return;
      }
      if (current <= 0 && deltaY > 0) {
        event.preventDefault();
        apply(deltaY);
        lockToIntro();
        return;
      }
      if (shouldParkOnArchive(motion)) {
        event.preventDefault();
        armFromMapLock();
        parkOnArchive();
        return;
      }
      if (shouldUnfileTowardIntro(motion)) {
        event.preventDefault();
        apply(deltaY);
      }
      // Filed + downward wheel is not captured — snap can release to #map.
    };

    const onWheel = (event) => {
      handleDelta(event.deltaY, event);
    };

    let touchY = null;
    const onTouchStart = (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event) => {
      if (touchY == null) return;
      const y = event.touches[0]?.clientY;
      if (y == null) return;
      handleDelta(touchY - y, event);
      touchY = y;
    };

    const onKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key !== "PageUp") return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      if (!onMap() && !fromMapLock) return;
      event.preventDefault();
      armFromMapLock();
      parkOnArchive();
    };

    const onScroll = () => {
      lockToIntro();
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(fromMapTimer);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [reduceMotion]);

  return (
    <div className="view-explore">
      <div
        className={
          filed ? "explore-scroll is-filed" : "explore-scroll is-filing"
        }
        ref={scrollRef}
      >
        <div className="explore-waypoints-slot">
          <nav className="explore-waypoints" aria-label="Explore waypoints">
            {WAYPOINTS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={waypoint === item.id ? "true" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="explore-archive-span">
          <ArchiveSection
            organize={organize}
            onOrganizeChange={setOrganize}
            onOrganizeDelta={organizeDeltaRef}
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
