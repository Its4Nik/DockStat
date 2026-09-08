import { z } from "zod"
import { validate, withValidation } from "../middleware/withValidation"
import Actions from "../action"

const basicUserSchema = z.object({ name: z.string().min(1), pass: z.string().min(8) })

const basicUserValidator = withValidation({
  localLogin: validate(basicUserSchema, Actions.Auth.localLogin),
  register: validate(basicUserSchema, Actions.Auth.register)
})

export const UserValidation = {
  Basic: basicUserValidator,
}
