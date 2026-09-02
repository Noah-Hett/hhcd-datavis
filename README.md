# hhcd-datavis

A single, unified web app for exploring the **Helen Hamlyn Centre for Design**
graduate & associate research catalogue (64 reports, 2000–2017). Two pages
share one mint chrome, one report sidebar, and one catalogue (`src/data/`):

- **Explore** (`/`) — a full-viewport scroller with three waypoints: intro
  (documents on show), archive (wheel files them into magazine folders), and
  the year × type map (band tracks + method pills). The 3D scene is lazy-loaded
  on this route only.
- **Simple** (`/search`) — a keyboard-first list of every report, ranked by
  the existing NLP search. Header typeahead on Explore uses the same ranking.

Deep links: `/folders` → `/#archive`, `/year-type` → `/#map`, `?report=` opens
the sidebar. Selecting a report in folders, the map, or search highlights it
everywhere.

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
  components/Layout.jsx     # Wordmark, search, Explore/Simple, help, sidebar
  state/SelectionContext.jsx
  data/                    # Inlined report catalogue (was @hhcd/data)
    reports.json
    index.js
  views/
    explore/               # Snap scroller, ArchiveSection, MapSection
    project-folders/       # Three.js archive (mounted from Explore)
    year-type-scatter/     # Scatter + method carousel (mounted from Explore)
    report-search/         # Simple-view list (+ search.js, tests)
```

### How the merge works

Each view keeps its own component tree and a **scoped stylesheet** wrapped under
a single class (`.view-folders`, `.view-year-type`, `.view-search`). This lets
the three prototypes reuse generic class names (`.panel`, `.field`, `.stage`,
`.legend`) without colliding. Native CSS nesting is flattened at build time by
`postcss-nesting`. Global tokens, the reset, and the app shell live in
`src/index.css`.

Routing uses `react-router-dom`. Explore fills the viewport below the header
and snaps between sections; Simple view scrolls normally.

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
