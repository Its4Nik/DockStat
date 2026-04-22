export const BASE_URL = Bun.env.BASE_URL ? Bun.env.BASE_URL : "http://localhost:3030/api/v2/auth"
export const FRONTEND_URL = Bun.env.FRONTEND_URL ? Bun.env.FRONTEND_URL : "http://localhost:5173"
export const CRYPTO_SECRET = Bun.env.CRYPTO_SECRET ? Bun.env.CRYPTO_SECRET : "PLEASE-CHANGE-ME"
export const JWT_SECRET = new TextEncoder().encode(
  Bun.env.JWT_SECRET || "your-secret-key-change-in-production"
)
