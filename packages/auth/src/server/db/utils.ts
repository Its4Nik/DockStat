import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { UserTable } from "./types"

export const getUserByID = (id: string, table: QueryBuilder<UserTable>) =>
  table.select(["*"]).where({ id: id }).first()
export const getUserByToken = (token: string, db: DB) => {}
