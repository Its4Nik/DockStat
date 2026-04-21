declare module "bun" {
  interface Env {
    BASE_URL: string
    JWT_SECRET: string
    FRONTEND_URL: string
  }
}
