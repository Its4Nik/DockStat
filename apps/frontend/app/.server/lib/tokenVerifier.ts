import { verifyAuthToken } from "@dockstat/auth"

export const TokenVerifier = async (token: string) => {
  const payload = await verifyAuthToken(token)
  return (payload?.user as Record<string, unknown>) ?? null
}
