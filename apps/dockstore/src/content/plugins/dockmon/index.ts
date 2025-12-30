import { column, pluginBuilder } from "@dockstat/plugin-builder"
import type { DockMonTable } from "./types"
import DockMonActions from "./actions"
import DockMonEvents from "./events"
import DockMonApiRoutes from "./routes/backend"
import DockMonFrontend from "./routes/frontend"

const DockMon = pluginBuilder<DockMonTable, typeof DockMonActions>()
  .name("DockMon")
  .version("1.0.0")
  .description(
    `DockMon is the default Metrics collector for DockStat. It works by listening on 'container:metrics' and 'host:metrics' events emitted by the DockerClientManager.

		It stores the metrics in a database and provides a REST API to query the metrics. These endpoints can also be used by other Plugins`
  )
  .tags(["metrics", "default"])
  .repository("its4nik/dockstat:dev/apps/dockstore", "github")
  .manifest("src/content/plugins/dockmon")
  .author({
    name: "Its4Nik",
    email: "dockstat@itsnik.de",
    license: "MIT",
    website: "https://itsnik.de",
  })
  .table({
    columns: {
      id: column.id(),
      type: column.enum(["CONTAINER", "HOST"]),
      host_id: column.integer(),
      docker_client_id: column.integer({ notNull: false }),
      container_id: column.text({ notNull: false }),
      data: column.json(),
      stored_on: column.createdAt(),
    },
    parser: {
      JSON: ["data"],
    },
    name: "dockmon",
  })
  .actions(DockMonActions)
  .events(DockMonEvents)
  .apiRoutes(DockMonApiRoutes)
  .frontend({
    routes: DockMonFrontend,
    globalState: {
      initial: {
        autoRefresh: true,
        refreshInterval: 30000,
      },
    },
  })

export default DockMon
