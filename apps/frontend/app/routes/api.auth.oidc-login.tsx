import Loaders from "~/.server/loader"

/** GET — start the OIDC flow (PKCE/state/nonce cookies + provider redirect) */
export const loader = Loaders.Auth.oAuthLogin
