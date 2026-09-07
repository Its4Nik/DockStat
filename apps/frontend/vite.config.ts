import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import {reactRouterDevTools} from "react-router-devtools"

export default defineConfig({
  plugins: [tailwindcss(), reactRouterDevTools(),reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    watch: {
      // Runtime artifacts written by the SSR process — watching these causes
      // endless "(ssr) program reload" loops.
      ignored: [
        "**/.dockstat/**",
        "**/.backups/**",
        "**/*.sqlite",
        "**/*.sqlite-wal",
        "**/*.sqlite-shm",
      ],
    },
  },
})
