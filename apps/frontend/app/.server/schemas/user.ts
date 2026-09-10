import { z } from "zod"
import { validate, withValidation } from "../middleware/withValidation"
import Actions from "../action"

export const basicUserSchema = z.object({ name: z.string().min(1), pass: z.string().min(8) })

const basicUserValidator = withValidation(
  {
    localLogin: validate(basicUserSchema, Actions.Auth.localLogin),
    register: validate(basicUserSchema, Actions.Auth.register),
  },
  // Mounted by the login page itself — not generated into the API tree.
  { ignored: true }
)

export const UserValidation = {
  Basic: basicUserValidator,
}
