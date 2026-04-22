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
