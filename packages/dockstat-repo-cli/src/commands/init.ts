// cli/commands/init.ts
import { Command } from "@commander-js/extra-typings"
import { repo } from "@dockstat/utils"
import type { Opts, RepoFile } from "../types"

export const initCommand = new Command("init")
  .description("Initializes a new repository")
  .option("-t, --themes-dir <path>", "Themes directory", "./content/themes")
  .option("-p, --plugin-dir <path>", "Plugins directory", "./content/plugins")
  .option("--plugin-bundle <dir>", "Plugin bundle output directory", "bundle")
  .option("-s, --stack-dir <path>", "Stacks directory", "./content/stacks")
  .requiredOption("-n, --name <name>", "The name of the repository")
  .option("-r, --relaxed", "Use relaxed verification", false)
  .option("-a, --verification-api <URL>", "Verification API base URL", undefined)
  .requiredOption("-v, --variant <type>", "Repository type (github, gitlab, gitea, http, local)")
  .action(async (options, cmd) => {
    const globalOptions = cmd.optsWithGlobals() as unknown as { root: string }

    if (!repo.isRepoType(options.variant)) {
      console.error("❌ Invalid variant. Use: github, gitlab, gitea, http, or local")
      process.exit(1)
    }

    const data: RepoFile = {
      config: {
        name: options.name,
        policy: options.relaxed ? "relaxed" : "strict",
        type: options.variant,
        verification_api: (options.verificationApi && String(options.verificationApi)) || null,
        themes: { dir: options.themesDir },
        plugins: { dir: options.pluginDir, bundle: options.pluginBundle },
        stacks: { dir: options.stackDir },
      },
      content: { plugins: [], themes: [], stacks: [] },
    }

    await Bun.write(globalOptions.root, JSON.stringify(data, null, 2))
    console.log(`✅ Created repository config: ${globalOptions.root}`)
  })
