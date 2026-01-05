import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
<<<<<<< HEAD
      "@Queries": path.resolve(__dirname, "./src/lib/queries/index.ts"),
      "@Actions": path.resolve(__dirname, "./src/lib/actions/index.ts"),
      "@WSS": path.resolve(__dirname, "./src/lib/websocketEffects/index.ts"),
=======
      "@Queries": path.resolve(__dirname, "./src/lib/queries"),
>>>>>>> main
    },
  },
})
