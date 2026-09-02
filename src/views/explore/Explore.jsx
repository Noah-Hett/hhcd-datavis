import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ArchiveSection from "./ArchiveSection.jsx";
import { isFiled, organizeFromScroll } from "./archivePhysics.js";
import MapSection from "./MapSection.jsx";

const SCROLL_IDS = ["intro", "archive", "map"];

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Explore() {
  const { hash } = useLocation();
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(prefersReducedMotion);
  const [organize, setOrganize] = useState(() =>
    prefersReducedMotion() ? 1 : 0,
  );
  const filed = isFiled(organize, reduceMotion);
  organizeRef.current = organize;

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
    const scrollToHash = () => {
      const node = id && SCROLL_IDS.includes(id) ? document.getElementById(id) : null;
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
      const archiveTop = archive?.offsetTop ?? 0;
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
      <div className="explore-scroll" data-filed={filed ? "true" : "false"} ref={scrollRef}>
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
