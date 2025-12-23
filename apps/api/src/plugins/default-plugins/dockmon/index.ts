import type { Plugin, PluginMetaType } from "@dockstat/typings/types"
import { config } from "./src/config"
import type { DockMonTable } from "./src/types"
import { mapFromContainerMetricHookToDb, mapFromHostMetricHookToDb } from "./src/utils/mapTo"

export const meta: PluginMetaType = {
  name: "DockMon",
  repoType: "default",
  repository: "its4nik/dockstat:dev/apps/dockstore",
  version: "0.2.0",
  author: {
    license: "MIT",
    name: "Its4Nik",
    email: "dockstat@itsnik.de",
    website: "https://itsnik.de",
  },
  description:
    "Default Plugin for DockStat that enables Monitoring and Metrics Pages. Listens for 'host:metrics' and 'container:metrics' events and saves the data to the database. Provides frontend pages for viewing metrics dashboards.",
  manifest: "src/content/plugins/dockmon/manifest.yml",
}

const DockMon: Plugin<DockMonTable> = {
  ...meta,
  config: config,
  events: {
    "host:metrics": (ctx, { table, logger }) => {
      try {
        logger.debug(`Saving Host metrics for host ${ctx.hostId}`)
        const data = mapFromHostMetricHookToDb(ctx)
        table.insert(data)
        logger.info(`Host metrics saved for host ${ctx.metrics.hostName} (ID: ${ctx.hostId})`)
      } catch (error) {
        logger.error(`Failed to save host metrics: ${error}`)
      }
    },
    "container:metrics": (ctx, { table, logger }) => {
      try {
        logger.debug(`Saving Container metrics for ${ctx.containerId}`)
        const data = mapFromContainerMetricHookToDb(ctx)
        table.insert(data)
        logger.info(`Container metrics saved for ${ctx.stats.name} (ID: ${ctx.containerId})`)
      } catch (error) {
        logger.error(`Failed to save container metrics: ${error}`)
      }
    },
  },
  init: () => {
    console.log("[DockMon] Plugin initialized - Monitoring metrics collection enabled")
  },
}

export default DockMon
