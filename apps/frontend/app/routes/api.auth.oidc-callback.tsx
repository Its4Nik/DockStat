import Loaders from "~/.server/loader"

/** GET — provider redirect target: validates state, exchanges code, sets session */
export const loader = Loaders.Auth.oAuthCallback
