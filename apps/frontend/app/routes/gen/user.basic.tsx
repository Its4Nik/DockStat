import type { Route } from "./+types/user.basic"
import { Schemas } from "~/.server/schemas"
import type { ActionFunction } from "react-router"

export const middleware: Route.MiddlewareFunction[] = [Schemas.User.Basic.middleware];
export const action: ActionFunction = Schemas.User.Basic.action;