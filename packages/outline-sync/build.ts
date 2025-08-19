import { chmodSync } from "node:fs";

function now() {
  return new Date();
}

const NOW = now();

console.info(`Start at ${NOW}`);

await Bun.build({
  entrypoints: ["./bin/cli.ts"],
  outdir: "./dist",
  plugins: [],
  minify: true,
  target: "node",
  sourcemap: "inline",
});

// Make the CLI executable
chmodSync("./dist/cli.js", 0o755);

console.info(
  `Done at ${now()} - took ${new Date(now().getTime() - NOW.getTime()).getSeconds()}`,
);
