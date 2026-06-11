import { Type } from "@sinclair/typebox"
import Ajv from "ajv"
import type { CompiledSchema, FieldType, LibAdapter, SchemaDef } from "./shared"

function fieldToTypeBox(field: FieldType): unknown {
  switch (field.kind) {
    case "string": {
      const opts: Record<string, unknown> = {}
      if (field.minLength !== undefined) opts.minLength = field.minLength
      if (field.maxLength !== undefined) opts.maxLength = field.maxLength
      return Type.String(opts)
    }
    case "number": {
      const opts: Record<string, unknown> = {}
      if (field.min !== undefined) opts.minimum = field.min
      if (field.max !== undefined) opts.maximum = field.max
      return Type.Number(opts)
    }
    case "integer": {
      const opts: Record<string, unknown> = {}
      if (field.min !== undefined) opts.minimum = field.min
      if (field.max !== undefined) opts.maximum = field.max
      return Type.Integer(opts)
    }
    case "boolean":
      return Type.Boolean()
    case "null":
      return Type.Null()
    case "array":
      return Type.Array(fieldToTypeBox(field.items) as any)
    case "object":
      return Type.Object(
        Object.fromEntries(
          Object.entries(field.fields).map(([k, v]) => [k, fieldToTypeBox(v) as any])
        )
      )
    case "enum":
      return Type.Union(field.values.map((v) => Type.Literal(v)))
    case "literal":
      return Type.Literal(field.value)
    case "optional":
      return Type.Optional(fieldToTypeBox(field.inner) as any)
    case "nullable":
      return Type.Union([fieldToTypeBox(field.inner) as any, Type.Null()])
  }
}

function defToTypeBoxSchema(def: SchemaDef): unknown {
  return Type.Object(
    Object.fromEntries(Object.entries(def.fields).map(([k, v]) => [k, fieldToTypeBox(v) as any]))
  )
}

const ajv = new Ajv({ strict: false })

interface TypeBoxCompiled extends CompiledSchema {
  check: ReturnType<typeof ajv.compile>
}

export const typeboxAdapter: LibAdapter = {
  compile(def: SchemaDef): CompiledSchema {
    const schema = defToTypeBoxSchema(def) as any
    const check = ajv.compile(schema)
    return { check, dispose() {} } satisfies TypeBoxCompiled
  },
  name: "typebox + ajv",

  validate(compiled: CompiledSchema, data: unknown): boolean {
    const { check } = compiled as TypeBoxCompiled
    return check(data) as boolean
  },
}
