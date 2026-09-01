# hhcd-datavis

A modern data-visualization dashboard for healthcare activity and outcomes,
built with [Vite](https://vite.dev), [React](https://react.dev),
[TypeScript](https://www.typescriptlang.org/), and
[Recharts](https://recharts.org/).

The current app renders a demo dashboard (KPIs, encounter trends, department
mix, admissions, and patient-satisfaction charts) from seed data in
`src/data.ts`. Replace that with real data sources as the project grows.

## Getting started

Requires Node.js 20+ (the dev container uses Node 22).

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server on http://localhost:5173
```

## Scripts

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the local dev server with hot-module reload. |
| `npm run build`   | Type-check and build a production bundle to `dist`. |
| `npm run preview` | Preview the production build locally.              |
| `npm run lint`    | Run ESLint over the project.                       |

## Project structure

```
.
├── index.html          # App entry HTML
├── src/
│   ├── main.tsx        # React root
│   ├── App.tsx         # Dashboard layout & charts
│   ├── data.ts         # Seed/demo data
│   └── index.css       # Styles & theme tokens
├── vite.config.ts      # Vite configuration
└── .cursor/
    └── environment.json # Cloud Agent dev-environment config
```

## Cloud Agent environment

`.cursor/environment.json` configures the Cursor Cloud Agent environment:

- `install` runs `npm install` to set up dependencies.
- A `dev` terminal runs `npm run dev` so the dashboard is available on port
  `5173` whenever an agent starts.
