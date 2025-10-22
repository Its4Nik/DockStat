import DBFactory from "@dockstat/db"

const InitialDockStatDB = new DBFactory("DB", ["Elysia", "DockStat"])

export const DockStatDB = {
  _sqliteWrapper: InitialDockStatDB.getDB(),
  _dbPath: InitialDockStatDB.getDatabasePath(),
  configTable: InitialDockStatDB.getConfigTable()
}
