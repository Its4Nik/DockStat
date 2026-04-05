// cli/commands/badges.ts
import { Command } from "@commander-js/extra-typings"
import { COLORS, createBadge, type IconName } from "../utils/badge"
import { log } from "../utils/logger"
import { loadRepo } from "../utils/repo"

export const badgesCommand = new Command("badges")
  .description("Generate SVG badges for the repository")
  .option("-o, --output <dir>", "Output directory for badges", ".badges")
  .option("--style <style>", "Badge style (flat, flat-square)", "flat")
  .option("--plugins", "Generate plugins count badge", true)
  .option("--themes", "Generate themes count badge", true)
  .option("--stacks", "Generate stacks count badge", true)
  .option("--version", "Generate version badge", true)
  .option("--type", "Generate repository type badge", true)
  .option("--status", "Generate build status badge", true)
  .action(async (options, cmd) => {
    const globalOptions = cmd.optsWithGlobals() as unknown as { root: string }

    const repoData = await loadRepo(globalOptions.root)
    if (!repoData) {
      console.error(`❌ Repository file not found: ${globalOptions.root}`)
      console.error("   Run 'init' first to create a repository.")
      process.exit(1)
    }

    const { config, content } = repoData
    const style = options.style as "flat" | "flat-square"
    const outputDir = options.output

    console.log("\n🏷️  DockStat Badge Generator\n")

    const badges: { name: string; svg: string }[] = []

    // Right after `const badges: { name: string; svg: string }[] = []`

    type CountBadgeKey = "plugins" | "themes" | "stacks"

    const countBadgeConfigs: {
      optionKey: CountBadgeKey
      name: string
      label: string
      color: string
      icon: IconName
      getCount: () => number
    }[] = [
      {
        color: COLORS.blue,
        getCount: () => content.plugins.length,
        icon: "puzzle",
        label: "plugins",
        name: "plugins",
        optionKey: "plugins",
      },
      {
        color: COLORS.purple,
        getCount: () => content.themes.length,
        icon: "palette",
        label: "themes",
        name: "themes",
        optionKey: "themes",
      },
      {
        color: COLORS.teal,
        getCount: () => content.stacks.length,
        icon: "layers",
        label: "stacks",
        name: "stacks",
        optionKey: "stacks",
      },
    ]

    for (const cfg of countBadgeConfigs) {
      if (!options[cfg.optionKey]) continue
      const count = cfg.getCount()
      badges.push({
        name: cfg.name,
        svg: createBadge({
          color: count > 0 ? cfg.color : COLORS.lightgrey,
          icon: cfg.icon,
          label: cfg.label,
          message: count.toString(),
          style,
        }),
      })
    }

    if (options.type) {
      const typeConfig: Record<string, { color: string; icon: IconName }> = {
        gitea: { color: COLORS.green, icon: "server" },
        github: { color: COLORS.grey, icon: "github" },
        gitlab: { color: COLORS.orange, icon: "gitlab" },
        http: { color: COLORS.blue, icon: "globe" },
        local: { color: COLORS.lightgrey, icon: "folder" },
      }
      const cfg = typeConfig[config.type] ?? {
        color: COLORS.grey,
        icon: "server" as IconName,
      }
      badges.push({
        name: "type",
        svg: createBadge({
          color: cfg.color,
          icon: cfg.icon,
          label: "repo",
          message: config.type,
          style,
        }),
      })
    }

    if (options.status) {
      const isStrict = config.policy === "strict"
      badges.push({
        name: "policy",
        svg: createBadge({
          color: isStrict ? COLORS.green : COLORS.yellow,
          icon: isStrict ? "shieldCheck" : "shield",
          label: "policy",
          message: config.policy,
          style,
        }),
      })
    }

    for (const badge of badges) {
      const path = `${outputDir}/${badge.name}.svg`
      await Bun.write(path, badge.svg)
      log("✅", `Created ${badge.name} badge`, path)
    }

    const mdSnippet = badges.map((b) => `![${b.name}](./${outputDir}/${b.name}.svg)`).join(" ")

    const mdPath = `${outputDir}/README.md`
    const mdContent = `# Repository Badges

## Usage

\`\`\`markdown
${mdSnippet}
\`\`\`

## Preview

${mdSnippet}
`

    await Bun.write(mdPath, mdContent)
    log("📄", "Created badge documentation", mdPath)

    console.log(`\n✨ Generated ${badges.length} badge(s) in ${outputDir}/\n`)
  })
