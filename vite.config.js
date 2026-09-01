import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single-page app served from the domain root. React Router handles the
// in-app view routes (folders, year-type, search); Vite's dev/preview servers
// fall back to index.html for unknown paths.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
