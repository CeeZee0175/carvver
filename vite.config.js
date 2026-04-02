import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function getManualChunkName(id) {
  const normalizedId = id.split(path.sep).join("/");

  if (!normalizedId.includes("/node_modules/")) {
    return undefined;
  }

  if (
    normalizedId.includes("/@react-leaflet/") ||
    normalizedId.includes("/react-leaflet/") ||
    normalizedId.includes("/leaflet/")
  ) {
    return "maps";
  }

  if (normalizedId.includes("/@supabase/")) {
    return "supabase";
  }

  if (normalizedId.includes("/framer-motion/")) {
    return "motion";
  }

  if (
    normalizedId.includes("/react-hot-toast/") ||
    normalizedId.includes("/goober/")
  ) {
    return "feedback";
  }

  if (normalizedId.includes("/lucide-react/")) {
    return "icons";
  }

  if (
    normalizedId.includes("/react/") ||
    normalizedId.includes("/react-dom/") ||
    normalizedId.includes("/scheduler/")
  ) {
    return "react-vendor";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunkName,
      },
    },
  },
});
