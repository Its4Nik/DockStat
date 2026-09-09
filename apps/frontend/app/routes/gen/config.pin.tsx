import type { Route } from "./+types/config.pin"
import { Schemas } from "~/.server/schemas"
import type { ActionFunction } from "react-router"

export const middleware: Route.MiddlewareFunction[] = [Schemas.Config.Pin.middleware];
export const action: ActionFunction = Schemas.Config.Pin.action;