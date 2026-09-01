import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReportSidebar from "../../components/ReportSidebar.jsx";
import ArchiveSection, {
  applyOrganizeDelta,
  isArchiveFiled,
} from "./ArchiveSection.jsx";
import MapSection from "./MapSection.jsx";

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Explore() {
  const { hash } = useLocation();
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const organizeDeltaRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [organize, setOrganize] = useState(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const isFiled = isArchiveFiled(organize, reduceMotion);
  organizeRef.current = organize;
  const wasFiledRef = useRef(isFiled);

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
    if (id === "archive" || id === "map") {
      setOrganize(1);
    }
    const node = id ? document.getElementById(id) : null;
    if (!node) return;
    node.scrollIntoView({ block: "start" });
  }, [hash]);

  useEffect(() => {
    if (isFiled && !wasFiledRef.current && hash !== "#map") {
      document.getElementById("archive")?.scrollIntoView({ block: "start" });
    }
    wasFiledRef.current = isFiled;
  }, [isFiled, hash]);

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

    const pastArchive = () => {
      const map = document.getElementById("map");
      if (!map) return false;
      return scroller.scrollTop >= map.offsetTop - 12;
    };

    const onWheel = (event) => {
      const current = organizeRef.current;
      const down = event.deltaY > 0;
      if (current > 0 && current < 1) {
        event.preventDefault();
        apply(event.deltaY);
        return;
      }
      if (current <= 0 && down && !pastArchive()) {
        event.preventDefault();
        apply(event.deltaY);
        return;
      }
      if (current >= 1 && !down && !pastArchive()) {
        event.preventDefault();
        apply(event.deltaY);
      }
    };

    let touchY = null;
    const onTouchStart = (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event) => {
      if (touchY == null) return;
      const y = event.touches[0]?.clientY;
      if (y == null) return;
      const dy = touchY - y;
      const current = organizeRef.current;
      if (current > 0 && current < 1) {
        event.preventDefault();
        apply(dy);
      } else if (current <= 0 && dy > 0 && !pastArchive()) {
        event.preventDefault();
        apply(dy);
      } else if (current >= 1 && dy < 0 && !pastArchive()) {
        event.preventDefault();
        apply(dy);
      }
      touchY = y;
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
    };
  }, [reduceMotion]);

  return (
    <div className="view-explore">
      <div
        className={
          isFiled ? "explore-scroll is-filed" : "explore-scroll is-filing"
        }
        ref={scrollRef}
      >
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
        <ReportSidebar />
      </div>
    </div>
  );
}
