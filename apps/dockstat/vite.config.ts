import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "grid-layout": ["react-grid-layout"],
          motion: ["framer-motion"],
          "query-vendor": ["@tanstack/react-query"],
          "react-vendor": ["react", "react-dom", "react-router"],
          xyflow: ["@xyflow/react"],
        },
      },
    },
  },
  clearScreen: false,
  // Some libraries (e.g. react-grid-layout v2's legacy entry) reference
  // `process.env.NODE_ENV` directly. Vite doesn't polyfill `process` in
  // browser bundles by default, so we define it statically here.
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  plugins: [react(), tailwindcss()],
  publicDir: "./public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@WSS": path.resolve(__dirname, "./src/lib/websocketEffects/index.ts"),
    },
  },
})
