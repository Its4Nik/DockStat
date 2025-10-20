import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  optimizeDeps: {
      exclude: ["ssh2", "cpu-features"],
    },
    build: {
      rollupOptions: {
        external: ["ssh2", "cpu-features"],
      }
      ,
    },
  plugins: [
    tsconfigPaths({ root: './', projects: ['./tsconfig.json'] }),
    tailwindcss(),
    reactRouter(),
  ],
})
