declare module "bun" {
  interface Env {
    BASE_URL: string
    FRONTEND_URL: string
    DOCKSTAT_API_PORT: number
  }
}
