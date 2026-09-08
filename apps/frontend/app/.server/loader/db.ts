import { configCache } from "../cache"
import { fail, type RouteArgs } from "../lib/http"
import Singletons from "../singletons"

export const DbLoaders = {
    getConfig: () =>
      configCache.getOrCompute("config", () => Singletons.DB.configTable.select(["*"]).all()[0]),
    getDetails: () => {
      const schema = Singletons.DB._sqliteWrapper.getSchema()
      const info: Record<string, unknown> = {}
      for (const table of schema) {
        info[table.name] = {
          info: Singletons.DB._sqliteWrapper.getTableInfo(table.name),
          table,
        }
      }
      return {
        backups: Singletons.DB._sqliteWrapper.listBackups(),
        info,
        integrity: Singletons.DB._sqliteWrapper.integrityCheck(),
        path: Singletons.DB._dbPath,
      }
    },
    getRepository: ({ params }: RouteArgs<{ id: string }>) => {
      const id = Number(params.id)
      const found = Singletons.DB.repositoriesTable.select(["*"]).where({ id }).get()
      if (!found) {
        return fail(404, `Repository with id ${params.id} not found`)
      }
      return { data: found, message: "Repository found", success: true }
    },
    getTableRows: ({ params }: RouteArgs<{ tableName: string }>) =>
      Singletons.DB._sqliteWrapper
        .table(params.tableName as string)
        .select(["*"])
        .all(),
    listRepositories: () => ({
      data: Singletons.DB.repositoriesTable.select(["*"]).all(),
      message: `Found ${Singletons.DB.repositoriesTable.select(["*"]).all().length} repositories`,
      success: true,
    }),

}
