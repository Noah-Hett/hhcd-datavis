import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { SelectionProvider } from "./state/SelectionContext.jsx";

// Explore owns the 3D archive; keep it (and Three.js) off the Simple route.
const Explore = lazy(() => import("./views/explore/Explore.jsx"));
const ReportSearch = lazy(() => import("./views/report-search/ReportSearch.jsx"));

export default function App() {
  return (
    <SelectionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Explore />} />
          <Route path="/search" element={<ReportSearch />} />
          <Route
            path="/folders"
            element={<Navigate to={{ pathname: "/", hash: "archive" }} replace />}
          />
          <Route
            path="/year-type"
            element={<Navigate to={{ pathname: "/", hash: "map" }} replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </SelectionProvider>
  );
}
