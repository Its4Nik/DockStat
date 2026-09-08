import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { ApiKeysTable } from "./types"

/**
 * API keys embed their row id so validation is a single indexed lookup plus
 * one argon2 verify — instead of scanning and hashing every key in the table.
 *
 * Format: `dockstat_<uuid>_<32-byte hex secret>`
 * The full key is returned exactly once at creation; only the argon2id hash
 * of the secret half is stored.
 */

const KEY_PREFIX = "dockstat_"

export interface NewApiKey {
  name: string
  userId: string
  scopes?: string
  expiresAt?: Date | null
}

export interface CreatedApiKey {
  /** Row id (embedded in the key for lookup). */
  id: string
  /** The only time the full key is ever visible. */
  apiKey: string
  name: string
  scopes: string
  expiresAt: Date | null
}

export interface ValidApiKey {
  userId: string
  scopes: string
  roles: string[]
}

export function generateApiKeySecret(): string {
  return crypto
    .getRandomValues(new Uint8Array(32))
    .reduce((hex, byte) => hex + byte.toString(16).padStart(2, "0"), "")
}

export function buildApiKey(id: string, secret: string): string {
  return `${KEY_PREFIX}${id}_${secret}`
}

/** Splits a presented key into its row id and secret. */
export function parseApiKey(key: string): { id: string; secret: string } | null {
  if (!key.startsWith(KEY_PREFIX)) return null
  const rest = key.slice(KEY_PREFIX.length)
  const separator = rest.indexOf("_")
  if (separator === -1) return null
  const id = rest.slice(0, separator)
  const secret = rest.slice(separator + 1)
  if (!id || !secret) return null
  return { id, secret }
}

/**
 * Creates an API key record and returns the full key exactly once.
 * The row must be inserted by the caller-provided table.
 */
export async function createApiKey(
  apiKeys: QueryBuilder<ApiKeysTable>,
  input: NewApiKey
): Promise<CreatedApiKey> {
  const secret = generateApiKeySecret()
  const keyHash = await Bun.password.hash(secret, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  })

  const id = crypto.randomUUID()
  const record = apiKeys.insertAndGet({
    expiresAt: input.expiresAt ?? null,
    id,
    keyHash,
    lastUsedAt: null,
    name: input.name,
    revokedAt: null,
    scopes: input.scopes || "*",
    userId: input.userId,
  })

  if (!record) throw new Error("Failed to insert API key record")

  return {
    apiKey: buildApiKey(record.id, secret),
    expiresAt: record.expiresAt ?? null,
    id: record.id,
    name: record.name,
    scopes: record.scopes,
  }
}

/**
 * Validates a presented API key: looks up its row by id, checks revocation
 * and expiry, verifies the secret hash and stamps `lastUsedAt`.
 */
export async function verifyApiKey(
  apiKeys: QueryBuilder<ApiKeysTable>,
  presented: string
): Promise<ValidApiKey | null> {
  const parsed = parseApiKey(presented)
  if (!parsed) return null

  const record = apiKeys
    .select(["id", "userId", "keyHash", "scopes", "expiresAt", "revokedAt"])
    .where({ id: parsed.id })
    .first()
  if (!record) return null

  if (record.revokedAt) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null

  const valid = await Bun.password.verify(parsed.secret, record.keyHash)
  if (!valid) return null

  apiKeys.where({ id: record.id }).update({ lastUsedAt: new Date() })
  return { userId: record.userId, scopes: record.scopes, roles: [] }
}

/** Revokes a key by row id. Returns false when the key doesn't exist. */
export function revokeApiKey(apiKeys: QueryBuilder<ApiKeysTable>, id: string): boolean {
  const record = apiKeys.select(["id", "revokedAt"]).where({ id }).first()
  if (!record) return false
  if (record.revokedAt) return false
  apiKeys.where({ id }).update({ revokedAt: new Date() })
  return true
}
