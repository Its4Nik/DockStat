import dts from "bun-plugin-dts"

function now() {
  return new Date()
}

const NOW = now()

console.info(`Start at ${NOW}`)

await Bun.build({
  entrypoints: ["./index.ts"],
  minify: true,
  outdir: "./dist",
  plugins: [dts()],
  sourcemap: "inline",
  target: "bun",
})

console.info(`Done at ${now()} - took ${new Date(now().getTime() - NOW.getTime()).getSeconds()}`)
