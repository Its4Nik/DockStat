import z from "zod";

type OperationString = `__${string}__`

export const Schemas: Record<OperationString, z.ZodType> = {
  "__basic_user__": z.object({
    name: z.string(),
    pass: z.string(),
  })
}
