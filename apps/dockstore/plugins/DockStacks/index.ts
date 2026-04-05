import { pluginBuilder } from "@dockstat/plugin-builder"
import type { StackConfig } from "./src/types"

const DockStacks = pluginBuilder<StackConfig>()
  .name("DockStacks")
  .version("1.0.0")
  .author({
    email: "dockstat@itsnik.de",
    license: "MIT",
    name: "Its4Nik",
    website: "https://itsnik.de",
  })
  .description("Manage Docker container stacks from a centralized point")
  .tags(["Remote Hosts", "Docker Compose", "Local"])
  .build()

export default DockStacks
