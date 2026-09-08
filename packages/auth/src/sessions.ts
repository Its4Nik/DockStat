import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { SessionsTable } from "./types"

/**
 * Server-side session tracking: every issued session JWT carries a `jti`
 * that must exist here, which makes sessions revocable (logout, admin kill).
 */

export interface IssuedSession {
  jti: string
  userId: string
  expiresAt: Date
}

export function createSession(
  sessions: QueryBuilder<SessionsTable>,
  jti: string,
  userId: string,
  ttlSec: number
): IssuedSession {
  const expiresAt = new Date(Date.now() + ttlSec * 1000)
  sessions.insert({ expiresAt, jti, userId })
  return { expiresAt, jti, userId }
}

/** A session is valid while its row exists and hasn't expired. */
export function isSessionValid(sessions: QueryBuilder<SessionsTable>, jti?: string): boolean {
  if (!jti) return false
  const row = sessions.select(["expiresAt"]).where({ jti }).first()
  if (!row) return false
  return !row.expiresAt || row.expiresAt >= new Date()
}

/** Slides a session's expiry forward (paired with token re-signing). */
export function extendSession(
  sessions: QueryBuilder<SessionsTable>,
  jti: string,
  ttlSec: number
): void {
  sessions.where({ jti }).update({ expiresAt: new Date(Date.now() + ttlSec * 1000) })
}

/** Deletes one session (logout / revoke). */
export function revokeSession(sessions: QueryBuilder<SessionsTable>, jti: string): void {
  sessions.where({ jti }).delete()
}

/** Deletes every session of a user. Returns nothing (fire and forget). */
export function revokeAllSessions(sessions: QueryBuilder<SessionsTable>, userId: string): void {
  sessions.where({ userId }).delete()
}

/** Removes expired rows. Called opportunistically; keeps the table small. */
export function pruneExpiredSessions(sessions: QueryBuilder<SessionsTable>): void {
  const now = new Date()
  const expired = sessions
    .select(["jti"])
    .all()
    .filter((row) => row.expiresAt < now)
  for (const row of expired) sessions.where({ jti: row.jti }).delete()
}
