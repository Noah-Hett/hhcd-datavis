import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelection } from "../../state/SelectionContext.jsx";
import ArchiveSection from "./ArchiveSection.jsx";
import {
  isFiled,
  isFilingScroll,
  organizeFromScroll,
} from "./archivePhysics.js";
import MapSection from "./MapSection.jsx";

const SCROLL_IDS = ["intro", "archive", "map"];

export default function Explore() {
  const { hash } = useLocation();
  const { reduceMotion } = useSelection();
  const scrollRef = useRef(null);
  const organizeRef = useRef(0);
  const [organize, setOrganize] = useState(() => (reduceMotion ? 1 : 0));
  const filed = isFiled(organize, reduceMotion);
  const filing = isFilingScroll(organize, reduceMotion);
  organizeRef.current = organize;

  useEffect(() => {
    if (reduceMotion) setOrganize(1);
  }, [reduceMotion]);

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
      <div
        className={`explore-scroll${filing ? " is-filing" : ""}`}
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
