import Loaders from "~/.server/loader"

/** GET — revoke session and redirect to the provider's end-session URL */
export const loader = Loaders.Auth.oAuthLogout
