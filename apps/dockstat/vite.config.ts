import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [react(), tailwindcss()],
  publicDir: "./public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@WSS": path.resolve(__dirname, "./src/lib/websocketEffects/index.ts"),
    },
  },
})
