import type { SQLQueryBindings } from "bun:sqlite"
import Elysia, { t } from "elysia"
import { DockStatDB } from "../../database"

/**
 * Database schema and details routes
 */
const DatabaseDetailsRoutes = new Elysia({
  detail: {
    description: "Database schema and information endpoints",
    tags: ["Database"],
  },
})
  .get(
    "/details",
    () => {
      const schema = DockStatDB._sqliteWrapper.getSchema()
      const integrity = DockStatDB._sqliteWrapper.integrityCheck()
      const backups = DockStatDB._sqliteWrapper.listBackups()
      const path = DockStatDB._dbPath

      const info: Record<
        string,
        {
          table: {
            name: string
            type: string
            sql: string
          }
          info: {
            cid: number
            name: string
            type: string
            notnull: number
            dflt_value: SQLQueryBindings
            pk: number
          }[]
        }
      > = {}

      for (const table of schema) {
        const i = DockStatDB._sqliteWrapper.getTableInfo(table.name)
        info[table.name] = { info: i, table }
      }

      return {
        backups,
        info,
        integrity,
        path,
      }
    },
    {
      detail: {
        description:
          "Retrieves comprehensive information about the DockStat database including schema, table structures, integrity check results, and available backups.",
        responses: {
          200: { description: "Successfully retrieved database details" },
        },
        summary: "Get Database Details",
      },
    }
  )
  .get(
    "/details/:tableName/all",
    ({ params }) => DockStatDB._sqliteWrapper.table(params.tableName).select(["*"]).all(),
    {
      detail: {
        description:
          "Retrieves all records from a specific database table. Be careful with large tables as this may return many records.",
        responses: {
          200: { description: "Successfully retrieved all records from table" },
          404: { description: "Table not found" },
        },
        summary: "Get All Records from Table",
      },
      params: t.Object({
        tableName: t.String({
          description: "The name of the database table to query",
          examples: ["docker_clients", "hosts", "plugins", "config", "repositories"],
        }),
      }),
    }
  )

export default DatabaseDetailsRoutes
