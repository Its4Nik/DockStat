import type { Plugin, PluginMetaType } from "@dockstat/typings/types"

export const meta: PluginMetaType = {
  name: "BasicPlugin",
  repoType: "github",
  repository: "your-repo-url",
  version: "0.1.0",
  author: {
    license: "MIT",
    name: "Your Name",
    email: "your-email@example.com",
    website: "https://your-website.com",
  },
  description: "This is a basic template plugin for DockStat.",
  manifest: "src/content/plugins/basic-plugin/manifest.yml",
}

const BasicPlugin: Plugin = {
  ...meta,
  config: {
    actions: {
      exampleAction: ({ logger }) => {
        logger.debug("Running example action")

        return "Ran example action"
      },
      chainedAction: ({ logger, previousAction }) => {
        logger.debug("Running chained action")

        return {
          previousAction: previousAction,
          chainedAction: "Ran chained action",
        }
      },
    },
    apiRoutes: {
      "/example": {
        actions: ["exampleAction"],
        method: "GET",
      },
      "/faulty-chain": {
        actions: ["chainedAction"],
        method: "GET",
      },
      "/good-chain": {
        actions: ["exampleAction", "chainedAction"],
        method: "GET",
      },
    },
  },
  events: {
    // These events are triggered by the host
    "host:added": (_context, { logger }) => {
      logger.info("Handling Host Added event")
    },
  },
  init() {
    // Initial setup code here
    console.log("Plugin initialized")
  },
}

export default BasicPlugin
