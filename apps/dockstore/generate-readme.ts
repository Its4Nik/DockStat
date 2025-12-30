import yaml from "js-yaml"

// =============================================================================
// Types
// =============================================================================

interface Author {
  name: string
  email?: string
  license: string
  website?: string
}

interface PluginMeta {
  name: string
  description: string
  version: string
  repository: string
  repoType: string
  manifest: string
  author: Author
  tags: string[]
}

interface ThemeMeta {
  name: string
  description: string
  version: string
  author: Author
  tags: string[]
  previewImage?: string
}

interface StackMeta {
  name: string
  description: string
  version: string
  author: Author
  tags: string[]
  category?: string
}

interface Manifest {
  plugins?: PluginMeta[]
  themes?: ThemeMeta[]
  stacks?: StackMeta[]
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(): string {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, "0")
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const year = now.getFullYear()
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")
  return `${day}.${month}.${year} at ${hours}:${minutes}:${seconds}`
}

function formatTags(tags: string[]): string {
  return tags.map((tag) => `\`${tag}\``).join(", ")
}

function formatAuthor(author: Author): string {
  let result = author.name
  if (author.website) {
    result = `[${author.name}](${author.website})`
  }
  return result
}

function getRepoUrl(repository: string, repoType: string): string | null {
  if (repoType === "github") {
    // Format: user/repo:branch/path or user/repo
    const [repoPart] = repository.split(":")
    return `https://github.com/${repoPart}`
  }
  if (repoType === "gitlab") {
    const [repoPart] = repository.split(":")
    return `https://gitlab.com/${repoPart}`
  }
  if (repoType === "http") {
    return repository
  }
  return null
}

// =============================================================================
// README Generators
// =============================================================================

function generatePluginSection(plugins: PluginMeta[]): string {
  if (plugins.length === 0) {
    return `## Plugins

*No plugins available yet.*

`
  }

  let section = `## Plugins

Browse available plugins for DockStat.

`

  for (const plugin of plugins) {
    const repoUrl = getRepoUrl(plugin.repository, plugin.repoType)
    const repoLink = repoUrl
      ? ` ([source](${repoUrl}/tree/main/apps/dockstore/${plugin.manifest}))`
      : ""

    // Clean up description - handle multi-line and tabs
    const description = plugin.description.replace(/\n\t+/g, " ").replace(/\s+/g, " ").trim()

    section += `### ${plugin.name}${repoLink}

${description}

| Property | Value |
|----------|-------|
| **Version** | ${plugin.version} |
| **Author** | ${formatAuthor(plugin.author)} |
| **License** | ${plugin.author.license} |
| **Tags** | ${formatTags(plugin.tags)} |
| **Manifest** | \`${plugin.manifest}\` |

---

`
  }

  return section
}

function generateThemeSection(themes: ThemeMeta[]): string {
  if (!themes || themes.length === 0) {
    return `## Themes

*No themes available yet. Stay tuned!*

`
  }

  let section = `## Themes

Browse available themes for DockStat.

`

  for (const theme of themes) {
    section += `### ${theme.name}

${theme.description}

| Property | Value |
|----------|-------|
| **Version** | ${theme.version} |
| **Author** | ${formatAuthor(theme.author)} |
| **License** | ${theme.author.license} |
| **Tags** | ${formatTags(theme.tags)} |

---

`
  }

  return section
}

function generateStackSection(stacks: StackMeta[]): string {
  if (!stacks || stacks.length === 0) {
    return `## Stacks

*No stacks available yet. Stay tuned!*

`
  }

  let section = `## Stacks

Browse available Docker stacks and compose configurations.

`

  for (const stack of stacks) {
    const category = stack.category ? ` (${stack.category})` : ""

    section += `### ${stack.name}${category}

${stack.description}

| Property | Value |
|----------|-------|
| **Version** | ${stack.version} |
| **Author** | ${formatAuthor(stack.author)} |
| **License** | ${stack.author.license} |
| **Tags** | ${formatTags(stack.tags)} |

---

`
  }

  return section
}

function generateReadme(manifest: Manifest): string {
  const pluginCount = manifest.plugins?.length ?? 0
  const themeCount = manifest.themes?.length ?? 0
  const stackCount = manifest.stacks?.length ?? 0
  const totalCount = pluginCount + themeCount + stackCount

  let readme = `# DockStore

Welcome to DockStore! Here you can browse Plugins, themes and more. Currently only this GitHub based viewing is supported.

`

  // Summary badges
  readme += `![Plugins](https://img.shields.io/badge/Plugins-${pluginCount}-blue)
![Themes](https://img.shields.io/badge/Themes-${themeCount}-purple)
![Stacks](https://img.shields.io/badge/Stacks-${stackCount}-green)
![Total](https://img.shields.io/badge/Total-${totalCount}-orange)

`

  // Table of contents
  readme += `## Table of Contents

- [Plugins](#plugins)
- [Themes](#themes)
- [Stacks](#stacks)

`

  // Generate each section
  readme += generatePluginSection(manifest.plugins ?? [])
  readme += generateThemeSection(manifest.themes ?? [])
  readme += generateStackSection(manifest.stacks ?? [])

  // Footer
  readme += `---

> Generated on ${formatDate()}
`

  return readme
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log("📖 DockStore README Generator\n")

  // Read manifest
  const manifestPath = "./manifest.yaml"
  const manifestFile = Bun.file(manifestPath)

  if (!(await manifestFile.exists())) {
    console.error(`❌ Manifest not found at ${manifestPath}`)
    console.log("   Run 'bun run bundle' first to generate the manifest.")
    process.exit(1)
  }

  const manifestContent = await manifestFile.text()
  const manifest = yaml.load(manifestContent) as Manifest

  console.log(`📦 Found ${manifest.plugins?.length ?? 0} plugin(s)`)
  console.log(`🎨 Found ${manifest.themes?.length ?? 0} theme(s)`)
  console.log(`📚 Found ${manifest.stacks?.length ?? 0} stack(s)`)
  console.log("")

  // Generate README
  const readme = generateReadme(manifest)

  // Write README
  const readmePath = "./README.md"
  await Bun.write(readmePath, readme)

  console.log(`✅ README generated at ${readmePath}`)
}

await main()
