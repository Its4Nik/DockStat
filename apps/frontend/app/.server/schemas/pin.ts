import z from "zod";
import { validate, withValidation } from "../middleware/withValidation";
import Actions from "../action";

const pinSchema = z.object({
  slug: z.string(),
  path: z.string()
})

const pinValidator = withValidation(
  {
    pin: validate(pinSchema, Actions.DB.pinItem),
    unpin: validate(pinSchema, Actions.DB.unpinItem),
  },
  { path: "config/pin" }
)

export const PinValidator = pinValidator
