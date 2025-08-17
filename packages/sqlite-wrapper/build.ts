import dts from "bun-plugin-dts";

function now() {
  return new Date();
}

const NOW = now();

console.info(`Start at ${NOW}`);

await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  plugins: [dts()],
  minify: true,
  target: "bun",
  sourcemap: "inline",
});

console.info(
  `Done at ${now()} - took ${new Date(now().getTime() - NOW.getTime()).getSeconds()}`,
);
