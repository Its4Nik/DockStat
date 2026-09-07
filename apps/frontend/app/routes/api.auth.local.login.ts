import { Actions } from "~/.server/action"
import { Loaders } from "~/.server/loader"

export const loader = Loaders.Auth.localLoginPage
export const action = Actions.Auth.localLogin
