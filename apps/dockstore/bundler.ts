import { Glob } from "bun";

const pluginPath = "src/content/plugins"
const plugins = new Glob(`${pluginPath}/*/index.ts`)

const getPluginBuildDir = (path: string) => {
  const t = path.replaceAll("/index.ts", "")
  return `${t}/bundle`
}

const getPluginName = (path: string) => {
  return path.replaceAll("/index.ts", "").replaceAll(`${pluginPath}/`, "")
}

for (const plug of plugins.scanSync()) {
  console.log(`Building Plugin ${plug}`)
  const build = await Bun.build({
    entrypoints: [plug],
    outdir: getPluginBuildDir(plug),
    minify: true,
    sourcemap: "inline",
    splitting: false,
    env: `${getPluginName(plug).toUpperCase()}_*`,
    banner: `/*　Bundled by DockStore　*/`
  })
  const artifact = build.outputs[0] as Bun.BuildArtifact
  artifact && console.log(`Bundled Plugin:
    loader: ${artifact.loader}
    entry: ${plug}
    out: ${getPluginBuildDir(plug)}/index.js
    env: ${getPluginName(plug).toUpperCase().replaceAll("-", "_")}_*
`)
}
