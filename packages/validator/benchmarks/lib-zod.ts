import { z } from "zod"
import type { CompiledSchema, FieldType, LibAdapter, SchemaDef } from "./shared"

function fieldToZod(field: FieldType): unknown {
  switch (field.kind) {
    case "string": {
      let s = z.string()
      if (field.minLength !== undefined) s = s.min(field.minLength)
      if (field.maxLength !== undefined) s = s.max(field.maxLength)
      return s
    }
    case "number": {
      let s = z.number()
      if (field.min !== undefined) s = s.min(field.min)
      if (field.max !== undefined) s = s.max(field.max)
      return s
    }
    case "integer": {
      let s = z.number().int()
      if (field.min !== undefined) s = s.min(field.min)
      if (field.max !== undefined) s = s.max(field.max)
      return s
    }
    case "boolean":
      return z.boolean()
    case "null":
      return z.null()
    case "array":
      return z.array(fieldToZod(field.items) as any)
    case "object":
      return z.object(
        Object.fromEntries(Object.entries(field.fields).map(([k, v]) => [k, fieldToZod(v) as any]))
      )
    case "enum":
      return z.enum(field.values as [string, ...string[]])
    case "literal":
      return z.literal(field.value)
    case "optional":
      return fieldToZod(field.inner).optional()
    case "nullable":
      return fieldToZod(field.inner).nullable()
  }
}

function defToZodSchema(def: SchemaDef): unknown {
  return z.object(
    Object.fromEntries(Object.entries(def.fields).map(([k, v]) => [k, fieldToZod(v) as any]))
  )
}

interface ZodCompiled extends CompiledSchema {
  schema: z.ZodType
}

export const zodAdapter: LibAdapter = {
  compile(def: SchemaDef): CompiledSchema {
    const schema = defToZodSchema(def)
    return { dispose() {}, schema } satisfies ZodCompiled
  },
  name: "zod",

  validate(compiled: CompiledSchema, data: unknown): boolean {
    const { schema } = compiled as ZodCompiled
    return schema.safeParse(data).success
  },
}
