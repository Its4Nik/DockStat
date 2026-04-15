import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { UserTable } from "./types"

export const getUserByID = (id: string, table: QueryBuilder<UserTable>) =>
  table.select(["*"]).where({ id: id }).first()
export const getUserByToken = (token: string, db: DB) => {
  db.run(`
      SELECT u.* FROM api_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token_hash = ?
      AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))
    `)
}
