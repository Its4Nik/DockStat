export type ProvidersTable = {
  id: string
  issuer_url: string
  client_id: string
  client_secret: string
  scopes: string
  created_at: Date
  logout_url: string
}

export type LocalUsersTable = {
  id: string
  name: string
  passHash: string
  createdAt: Date
  updatedAt: Date
}

export type ApiKeysTable = {
  id: string
  userId: string
  name: string
  keyHash: string
  scopes: string
  expiresAt: Date | null
  lastUsedAt: Date | null
  createdAt: Date
  revokedAt: Date | null
}
