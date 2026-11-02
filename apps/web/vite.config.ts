import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules") &&
            (id.includes("/three/") || id.includes("@react-three"))
          )
            return "three-vendor";
          if (
            id.includes("node_modules") &&
            (id.includes("/gsap/") ||
              id.includes("/motion/") ||
              id.includes("/lenis/"))
          )
            return "motion";
        },
      },
    },
  },
});
