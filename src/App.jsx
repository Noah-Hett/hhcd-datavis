import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./views/Home.jsx";

// Views are code-split so the heavy 3D archive (Three.js) only loads when the
// visitor opens it, keeping the initial page light.
const ProjectFolders = lazy(() => import("./views/project-folders/ProjectFolders.jsx"));
const YearTypeScatter = lazy(() => import("./views/year-type-scatter/YearTypeScatter.jsx"));
const ReportSearch = lazy(() => import("./views/report-search/ReportSearch.jsx"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/folders" element={<ProjectFolders />} />
        <Route path="/year-type" element={<YearTypeScatter />} />
        <Route path="/search" element={<ReportSearch />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
