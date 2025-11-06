import { Glob } from "bun";
import YAML from "js-yaml"
const pluginPath = "src/content/plugins"
const plugins = new Glob(`${pluginPath}/*/index.ts`)

const BUNDLED_PLUGINS: string[] = []

const getPluginBuildDir = (path: string) => {
  const t = path.replaceAll("/index.ts", "")
  return `${t}/bundle`
}

const getPluginManifestPath = (path: string) => {
  const t = path.replaceAll("/index.ts", "")
  return `${t}/manifest.yml`
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

  console.log("Creating Manifest...")
  const { meta } = await import(`./${plug}`)

  Bun.write(getPluginManifestPath(plug), YAML.dump(meta))

  const artifact = build.outputs[0] as Bun.BuildArtifact
  artifact && console.log(`Bundled Plugin:
    loader: ${artifact.loader}
    entry: ${plug}
    out: ${getPluginBuildDir(plug)}/index.js
    env: ${getPluginName(plug).toUpperCase().replaceAll("-", "_")}_*
    manifest: ${getPluginManifestPath(plug)}
`)

  BUNDLED_PLUGINS.push(encodeURI(getPluginName(plug)))
}

const RepoManifestData = {
  plugins: BUNDLED_PLUGINS
}

const ymlDat = YAML.dump(RepoManifestData)
Bun.write("./manifest.yml", ymlDat)
console.log(`Wrote Repo Manifest`)
console.log("-".repeat(50), "\n")
console.log(ymlDat)
