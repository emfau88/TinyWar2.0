import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the build works at the domain root and under a
  // sub-path (GitHub Pages serves at /<repo>/).
  base: "./",
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  }
});
