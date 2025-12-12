// packages/create-plugin/src/index.ts
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const TEMPLATE_DIR = path.resolve(import.meta.dir, "../templates/basic")

function usage() {
  console.log(
    [
      "Usage:",
      "  bun create @dockstat/plugin <dir>",
      "",
      "Example:",
      "  bun create @dockstat/plugin my-awesome-plugin",
    ].join("\n")
  )
}

async function copyDir(src: string, dst: string, vars: { NAME: string; PACKAGE_NAME: string }) {
  await mkdir(dst, { recursive: true })
  const entries = await readdir(src)

  for (const name of entries) {
    const srcPath = path.join(src, name)
    const dstName = name.replaceAll("__NAME__", vars.NAME)
    const dstPath = path.join(dst, dstName)

    const s = await stat(srcPath)
    if (s.isDirectory()) {
      await copyDir(srcPath, dstPath, vars)
      continue
    }

    const raw = await readFile(srcPath, "utf8")
    const rendered = raw
      .replaceAll("__NAME__", vars.NAME)
      .replaceAll("__PACKAGE_NAME__", vars.PACKAGE_NAME)

    await writeFile(dstPath, rendered, "utf8")
  }
}

async function main() {
  const [, , ...args] = process.argv

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  const dir = args[0] || "./"
  const pluginName = dir
  const packageName = `@dockstat/plugin-${pluginName}`

  const target = path.resolve(process.cwd(), dir)

  await copyDir(TEMPLATE_DIR, target, {
    NAME: pluginName,
    PACKAGE_NAME: packageName,
  })

  console.log(`Created DockStat plugin in: ${target}`)
  console.log("")
  console.log("Next steps:")
  console.log(`  cd ${dir}`)
  console.log("  bun install")
  console.log("  bun run dev")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
