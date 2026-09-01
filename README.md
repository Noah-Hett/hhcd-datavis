# hhcd-datavis

A single, unified web app for exploring the **Helen Hamlyn Centre for Design**
graduate & associate research catalogue (64 reports, 2000–2017). It brings
together visualisations that began life as separate prototypes in
[`HHCD-Proto-1`](https://github.com/Noah-Hett/HHCD-Proto-1) behind one
accessible navigation shell:

- **Project folders** (`/folders`) — a 3D archive (Three.js) where reports file
  themselves into magazine folders by theme, year, or project type. Always
  paired with a keyboard-navigable list fallback.
- **Year × project type** (`/year-type`) — an SVG scatter of report type over
  time, coloured by research theme, filterable by research method.
- **Report search** (`/search`) — plain-language search that turns queries into
  method / year / category filters plus ranked, highlighted full-text results.

The three views share one dataset (`src/data/`) instead of one runtime. These
are early prototypes: forms, styling, and accessibility are being actively
refined.

## Getting started

Requires Node.js 22.

```bash
npm install      # install dependencies
npm run dev      # start Vite on http://localhost:5173
```

## Scripts

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Start the local dev server with hot-module reload.       |
| `npm run build`   | Build a production bundle to `dist/`.                    |
| `npm run preview` | Preview the production build locally.                    |
| `npm run lint`    | Run ESLint over the project.                             |
| `npm run test`    | Run the report-search unit tests (`node --test`).        |

## Project structure

```
src/
  main.jsx                 # React root + router
  App.jsx                  # Route table
  index.css                # Design tokens, reset, app shell/nav
  components/Layout.jsx     # Shared header, nav, skip link, <main>
  data/                    # Inlined report catalogue (was @hhcd/data)
    reports.json
    index.js
  views/
    Home.jsx               # Landing page
    project-folders/       # 3D archive view (+ scoped styles.css)
    year-type-scatter/     # Scatter view (+ scoped styles.css)
    report-search/         # Search view (+ scoped styles.css, tests)
```

### How the merge works

Each view keeps its own component tree and a **scoped stylesheet** wrapped under
a single class (`.view-folders`, `.view-year-type`, `.view-search`). This lets
the three prototypes reuse generic class names (`.panel`, `.field`, `.stage`,
`.legend`) without colliding. Native CSS nesting is flattened at build time by
`postcss-nesting`. Global tokens, the reset, and the app shell live in
`src/index.css`.

Routing uses `react-router-dom`. Full-bleed views (`/folders`, `/year-type`)
fill the viewport below the header; other routes scroll normally.

## Data

Import from `src/data/index.js` (exports `reports`, `categories`,
`projectTypes`, `years`, `yearRange`, `countBy`). The catalogue uses
`methodsPrimary` (array) for research methods; categories include both
`Mobility and Transport` and a separate `Transport`.

## Deploy and branch previews (Vercel)

This is a Vite SPA. `vercel.json` tells Vercel to `npm ci`, `npm run build`,
serve `dist/`, and rewrite every client route to `index.html` so React Router
paths (`/folders`, `/year-type`, `/search`) work on preview URLs.

Once the GitHub repo is connected to a Vercel project, **every push** gets a
deployment:

- **`main`** → production (`https://<project>.vercel.app`)
- **any other branch or pull request** → a unique preview URL, posted as a
  comment on the PR. Teammates do not need their own Vercel accounts to open
  those links.

### One-time: connect the GitHub repo

Someone with access to this GitHub repo does this once.

1. Open [vercel.com/new](https://vercel.com/new) and import
   `Noah-Hett/hhcd-datavis`.
2. Root Directory: repo root (`.`).
3. Framework: **Vite** (or leave auto-detect). Leave build settings — this
   repo’s `vercel.json` already sets install, build, and output.
4. Deploy.

If the Vercel GitHub App is not already installed on the account, GitHub will
ask you to grant it access to this repository. After that, branch pushes and
PRs deploy automatically. Fork PRs need a one-click authorisation the first
time, so preview env vars are not leaked.

## Cloud Agent environment

`.cursor/environment.json` runs `npm install` on setup and keeps a `dev`
terminal (`npm run dev`) serving the app on port `5173`.
