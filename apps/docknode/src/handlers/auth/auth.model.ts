import Elysia, { t } from "elysia"

const AuthObject = t.Object({
  handler: t.String(),
  key: t.String(),
})

export const authModel = new Elysia().model({ auth: AuthObject })

export type AuthObjectType = typeof AuthObject.static
