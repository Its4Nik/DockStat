import { compileSchema, freeSchema, type TSchema, t, validate } from "../src/index"
import type { CompiledSchema, FieldType, LibAdapter, SchemaDef } from "./shared"

function fieldToDockstat(field: FieldType): TSchema {
  switch (field.kind) {
    case "string":
      return t.String(
        Object.fromEntries(
          Object.entries({
            maxLength: field.maxLength,
            minLength: field.minLength,
          }).filter(([, v]) => v !== undefined)
        )
      )
    case "number":
      return t.Number(
        Object.fromEntries(
          Object.entries({
            maximum: field.max,
            minimum: field.min,
          }).filter(([, v]) => v !== undefined)
        )
      )
    case "integer":
      return t.Integer(
        Object.fromEntries(
          Object.entries({
            maximum: field.max,
            minimum: field.min,
          }).filter(([, v]) => v !== undefined)
        )
      )
    case "boolean":
      return t.Boolean()
    case "null":
      return t.Null()
    case "array":
      return t.Array(fieldToDockstat(field.items) as any)
    case "object":
      return t.Object(
        Object.fromEntries(
          Object.entries(field.fields).map(([k, v]) => [k, fieldToDockstat(v) as any])
        )
      )
    case "enum":
      return t.Enum(...(field.values as any))
    case "literal":
      return t.Literal(field.value)
    case "optional":
      return t.Optional(fieldToDockstat(field.inner) as any)
    case "nullable":
      return t.Nullable(fieldToDockstat(field.inner) as any)
  }
}

function defToDockstatSchema(def: SchemaDef): TSchema {
  const props: Record<string, TSchema> = {}
  const optionalKeys: string[] = []

  for (const [key, field] of Object.entries(def.fields)) {
    if (field.kind === "optional") {
      optionalKeys.push(key)
    }
    props[key] = fieldToDockstat(field)
  }

  // Mark optional fields using the OptionalKind symbol
  for (const key of optionalKeys) {
    const schema = props[key] as Record<string, unknown>
    schema.Optional = "Optional"
  }

  return t.Object(props)
}

interface DockstatCompiled extends CompiledSchema {
  id: number
}

export const dockstatAdapter: LibAdapter = {
  compile(def: SchemaDef): DockstatCompiled {
    const schema = defToDockstatSchema(def)
    const id = compileSchema(schema)
    return {
      dispose() {
        freeSchema(id)
      },
      id: id,
    } satisfies DockstatCompiled
  },
  name: "@dockstat/validator",

  validate(compiled: CompiledSchema, data: unknown): boolean {
    const { id } = compiled as DockstatCompiled
    const result = validate(id, data)
    return result.valid
  },
}
