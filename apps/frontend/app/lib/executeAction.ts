import { submit } from "~/lib/submit"
import type { Schemas as ServerSchemas } from "~/.server/schemas"

export const executeAction = {
	"user.basic.locallogin": submit<typeof ServerSchemas.User.Basic._ops>("localLogin","/api/v3/user/basic"),
	"user.basic.register": submit<typeof ServerSchemas.User.Basic._ops>("register","/api/v3/user/basic"),
	"config.pin.pin": submit<typeof ServerSchemas.Config.Pin._ops>("pin","/api/v3/config/pin"),
	"config.pin.unpin": submit<typeof ServerSchemas.Config.Pin._ops>("unpin","/api/v3/config/pin")
}