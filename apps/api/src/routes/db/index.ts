import Elysia from "elysia"
import ConfigRoutes from "./config"
import DatabaseDetailsRoutes from "./details"
import DBRepositoryRoutes from "./repositories"

/**
 * Database routes - composed from logical modules
 * Original 836-line file split into:
 * - details.ts: Database schema/info routes
 * - config.ts: Configuration CRUD routes
 * - repositories.ts: Repository CRUD routes (under /db prefix)
 */
const DBRoutes = new Elysia({
  detail: {
    description:
      "Database configuration and management endpoints for managing DockStat system settings, repositories, themes, and application data",
    tags: ["Database"],
  },
  name: "DatabaseElysiaInstance",
  prefix: "/db",
})
  .use(DatabaseDetailsRoutes)
  .use(ConfigRoutes)
  .use(DBRepositoryRoutes)

export default DBRoutes
