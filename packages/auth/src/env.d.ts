declare module "bun" {
  interface Env {
    CRYPTO_SECRET: string
    BASE_URL: string
    JWT_SECRET: string
    FRONTEND_URL: string
  }
}
