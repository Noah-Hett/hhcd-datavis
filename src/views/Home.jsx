import { Link } from "react-router-dom";
import { reports, categories, projectTypes, yearRange } from "../data/index.js";
import "./home.css";

const CARDS = [
  {
    to: "/folders",
    kicker: "3D archive",
    title: "Project folders",
    body: "Meet every report as a document in a side-on archive, then file them into magazine folders by theme, year, or project type.",
  },
  {
    to: "/year-type",
    kicker: "Chart",
    title: "Year \u00d7 project type",
    body: "See how report types sit across time from 2000 to 2017, coloured by research theme, and filter by research method.",
  },
  {
    to: "/search",
    kicker: "Find",
    title: "Report search",
    body: "Ask in plain language. Queries become method, year, and category filters plus a ranked, highlighted full-text search.",
  },
];

export default function Home() {
  return (
    <div className="view-home">
      <section className="home-hero">
        <p className="home-eyebrow">Helen Hamlyn Centre for Design</p>
        <h1>One catalogue, three ways to explore it.</h1>
        <p className="home-lede">
          {reports.length} graduate and associate research reports from{" "}
          {yearRange.min}–{yearRange.max}, brought together in a single place.
          Wander the archive in 3D, read it as a chart of type over time, or
          search it by meaning.
        </p>
        <dl className="home-stats">
          <div>
            <dt>Reports</dt>
            <dd>{reports.length}</dd>
          </div>
          <div>
            <dt>Years</dt>
            <dd>
              {yearRange.min}–{yearRange.max}
            </dd>
          </div>
          <div>
            <dt>Themes</dt>
            <dd>{categories.length}</dd>
          </div>
          <div>
            <dt>Project types</dt>
            <dd>{projectTypes.length}</dd>
          </div>
        </dl>
      </section>

      <nav className="home-cards" aria-label="Choose a visualisation">
        {CARDS.map((card) => (
          <Link key={card.to} to={card.to} className="home-card">
            <span className="home-card-kicker">{card.kicker}</span>
            <span className="home-card-title">{card.title}</span>
            <span className="home-card-body">{card.body}</span>
            <span className="home-card-go" aria-hidden="true">
              Open →
            </span>
          </Link>
        ))}
      </nav>

      <p className="home-note">
        These visualisations are early prototypes. Forms, styling, and
        accessibility are actively being refined — 3D content always has a
        keyboard-navigable list fallback.
      </p>
    </div>
  );
}
