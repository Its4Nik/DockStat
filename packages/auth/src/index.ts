export {
  buildApiKey,
  type CreatedApiKey,
  createApiKey,
  generateApiKeySecret,
  type NewApiKey,
  parseApiKey,
  revokeApiKey,
  type ValidApiKey,
  verifyApiKey,
} from "./api-keys"
export {
  clearSessionCookie,
  DEFAULT_SESSION_COOKIE,
  extractCredentials,
  isSecureRequest,
  readCookie,
  serializeCookie,
  sessionCookie,
} from "./cookies"
export {
  AUTH_AUDIENCE,
  AUTH_ISSUER,
  BASE_URL,
  CRYPTO_SECRET,
  FRONTEND_URL,
  JWT_SECRET,
  WS_TOKEN_AUDIENCE,
} from "./env"
export {
  refreshSessionToken,
  type SessionPayload,
  sessionPayloadToUser,
  signSessionToken,
  signWsToken,
  verifySessionToken,
  verifyWsToken,
  type WsTokenPayload,
} from "./jwt"
export { type OauthLoginCookies, OidcService, type ProviderInput } from "./oidc"
export { hashPassword, unusablePasswordHash, verifyPassword } from "./passwords"
export {
  AuthError,
  hasAnyRole,
  hasRole,
  hasScopes,
  parseScopes,
  requireAuth,
  requireRole,
  requireScopes,
  roleRank,
  scopeMatches,
} from "./scopes"
export {
  AuthService,
  type IssuedSessionCookies,
  type LocalLoginResult,
  type RegisterResult,
} from "./service"
export {
  createSession,
  extendSession,
  type IssuedSession,
  isSessionValid,
  pruneExpiredSessions,
  revokeAllSessions,
  revokeSession,
} from "./sessions"
export {
  type ApiKeysTable,
  type AuthMethod,
  type AuthServiceOptions,
  type AuthUser,
  type BuiltinRole,
  type ProvidersTable,
  ROLE_RANK,
  type Role,
  type SessionClaims,
  type SessionsTable,
  type UsersTable,
} from "./types"
