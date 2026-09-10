import type { AuthUser } from "@dockstat/auth"
import { Auth } from "../singletons/auth"

/**
 * Verifies WebSocket handshake tokens (`?token=` on the upgrade request).
 * Accepts short-lived WS tokens minted by `/api/v3/auth/ws-token` and
 * regular session tokens.
 */
export const TokenVerifier = async (token: string): Promise<AuthUser | null> => {
  return Auth.verifyWsToken(token)
}
