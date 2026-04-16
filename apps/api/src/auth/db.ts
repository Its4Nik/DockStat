import type DB from "@dockstat/sqlite-wrapper"
import { column } from "@dockstat/sqlite-wrapper"
import { DockStatDB } from "../database"
import type { AuthDB } from "./types"

export const getAuthTable = (db: DB) =>
  db.createTable<AuthDB>(
    "auth",
    {
      id: column.uuid(),
      name: column.text(),
      pass: column.text(),
      token: column.text(),
      type: column.enum(["api-key", "user", "oidc"]),
    },
    { ifNotExists: true }
  )
