import { Command } from "@commander-js/extra-typings"
import { initCommand } from "./commands/init"
import { bundleCommand } from "./commands/bundle"
import { badgesCommand } from "./commands/badges"

const program = new Command()

program
  .name("dockstat-repo")
  .description("A CLI helper for managing DockStat repositories")
  .version("0.0.1")
  .option("-r, --root <repo.json>", "Defines the repository root file", "repo.json")

program.addCommand(initCommand)
program.addCommand(bundleCommand)
program.addCommand(badgesCommand)

program.parse()
