import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReportSidebar from "../../components/ReportSidebar.jsx";
import { reports, yearRange } from "../../data/index.js";

export default function Explore() {
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <div className="view-explore">
      <div className="explore-scroll">
        <section
          id="intro"
          className="explore-section explore-intro"
          aria-labelledby="explore-intro-title"
        >
          <div className="explore-intro-copy">
            <p className="explore-intro-eyebrow">
              Helen Hamlyn Centre for Design
            </p>
            <h1 id="explore-intro-title">
              Graduate and associate research reports
            </h1>
            <p className="explore-intro-lead">
              {reports.length} reports, {yearRange.min}–{yearRange.max}. The
              documents are on show — not yet divided into folders. Scroll to
              file them, then continue to the year × type map.
            </p>
          </div>
        </section>
        <section
          id="archive"
          className="explore-section explore-archive"
          aria-label="Project folder archive"
        >
          {/* ArchiveSection mounts here in Wave 1 */}
        </section>
        <section
          id="map"
          className="explore-section explore-map"
          aria-label="Year by project type map"
        >
          {/* MapSection mounts here in Wave 1 */}
        </section>
        <ReportSidebar />
      </div>
    </div>
  );
}
