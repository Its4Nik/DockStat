declare module "bun" {
  interface Env {
    DOCKSTAT_AUTH_CRYPTO_SECRET: string
    BASE_URL: string
    DOCKSTAT_AUTH_JWT_SECRET: string | undefined
    FRONTEND_URL: string
  }
}
