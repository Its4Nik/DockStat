/** Argon2id password hashing (Bun runtime). */

export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 4,
  })
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash)
}

/**
 * Unusable hash for OIDC-only users (no local password will ever verify
 * against it — the salt makes it non-constant).
 */
export function unusablePasswordHash(): Promise<string> {
  return Bun.password.hash(crypto.randomUUID(), {
    algorithm: "argon2id",
    memoryCost: 8192,
    timeCost: 1,
  })
}
