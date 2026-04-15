export type UserTable = {
  id: string
  username: string
  passwordHash: string
  role: "user" | "admin" | "visitor"
  createdAt: Date
}

export type ApiTokensTable = {
  id: string
  name: string
  userId: string // FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  tokenHash: string
  expiresAt: Date
  createdAt: Date
}

export type OidcProvidersTable = {
  id: string
  name: string
  issuerUrl: string
  clientId: string
  clientSecret: string
  scope: string
  enabled: boolean
  createdAt: Date
}

export type UserOidcIdentitiesTable = {
  id: string
  userId: string
  providerId: string
  subject: string
  createdAt: Date
}
