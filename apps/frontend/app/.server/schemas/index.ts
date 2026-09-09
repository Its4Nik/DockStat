import type { GenericSchema } from "../scripts";
import { PinValidator } from "./pin";
import { UserValidation } from "./user";

export const Schemas = {
  User: UserValidation,
  Config: {
    Pin: PinValidator
  },
  ignoredGroups: [] as string[]
} satisfies GenericSchema;
