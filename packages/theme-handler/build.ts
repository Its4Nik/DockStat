import dts from 'bun-plugin-dts'

const start = Date.now()

console.info(`Start at ${new Date(start).toISOString()}`)

await Bun.build({
  entrypoints: ['./index.ts', './src/index.ts'],
  outdir: './dist',
  plugins: [dts()],
  minify: true,
  target: 'bun',
  external: ['react', 'react-dom'],
  sourcemap: 'inline',
})

const end = Date.now()
const duration = end - start

console.info(`Done at ${new Date(end).toISOString()} - took ${duration}ms`)
