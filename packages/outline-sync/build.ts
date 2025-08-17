import dts from "bun-plugin-dts";
import { chmodSync } from "node:fs";

function now() {
  return new Date();
}

const NOW = now();

console.info(`Start at ${NOW}`);

await Bun.build({
  entrypoints: ["./sync.ts"],
  outdir: "./dist",
  plugins: [dts()],
  minify: true,
  target: "node",
  sourcemap: "inline",
});

// Make the CLI executable
chmodSync("./dist/sync.js", 0o755);

console.info(
  `Done at ${now()} - took ${new Date(now().getTime() - NOW.getTime()).getSeconds()}`,
);
