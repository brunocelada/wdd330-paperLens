import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        paper_details: resolve(__dirname, "src/paper_details/index.html"),
        saved_papers: resolve(__dirname, "src/saved_papers/index.html"),
        search_results: resolve(__dirname, "src/search_results/index.html"),
      },
    },
  },
});
