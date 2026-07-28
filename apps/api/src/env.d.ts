declare module "bun" {
  interface Env {
    BASE_URL: string
    DOCKSTAT_CERT_MASTER_KEY: string
    DOCKSTAT_API_PORT: number
    FRONTEND_URL: string
  }
}
