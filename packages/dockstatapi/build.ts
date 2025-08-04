import dts from "bun-plugin-dts";

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  plugins: [dts()],
  minify: true,
  target: "bun",
  sourcemap: "inline",
});
