import { redirect } from "react-router"
import Actions from "~/.server/action"

/** GET — browsers land on the app's login page */
export const loader = () => redirect("/login")

/** POST — JSON username/password login (sets the HttpOnly session cookie) */
export const action = Actions.Auth.localLogin
