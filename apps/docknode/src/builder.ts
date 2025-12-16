import { build } from "bun"

await build({
  sourcemap: "linked",
  compile: false,
  entrypoints: ["./index.ts"],
  minify: {
    identifiers: false,
    syntax: true,
    whitespace: true,
    keepNames: false,
  },
  outdir: "./dist",
})
