export type {
  ArrayOptions,
  Infer,
  NumberOptions,
  ObjectOptions,
  StandardFailureResult,
  StandardIssue,
  StandardResult,
  StandardSchemaV1,
  StandardSchemaV1Props,
  StandardSuccessResult,
  StandardTypes,
  StringOptions,
  TAny,
  TArray,
  TBoolean,
  TEnum,
  TInteger,
  TLiteral,
  TLiteralValue,
  TNever,
  TNull,
  TNullable,
  TNumber,
  TObject,
  TOptional,
  TRecord,
  TSchema,
  TString,
  TUnion,
  ValidationErrorDetail,
  ValidationResult,
} from "./typings"

import { symbols } from "./native/loader"
import type {
  ArrayOptions,
  Infer,
  NumberOptions,
  ObjectOptions,
  StandardFailureResult,
  StandardIssue,
  StandardResult,
  //StandardSchemaV1,
  StandardSuccessResult,
  StringOptions,
  TAny,
  TArray,
  TBoolean,
  TEnum,
  TInteger,
  TLiteral,
  TLiteralValue,
  TNever,
  TNull,
  TNullable,
  TNumber,
  TObject,
  TOptional,
  TRecord,
  TSchema,
  TString,
  TUnion,
  ValidationErrorDetail,
  ValidationResult,
} from "./typings"
import { OptionalKind } from "./typings"

// ─── Internal helpers ──────────────────────────────────────────────────────

const INTERNAL_KEYS = new Set(["~standard"])

/** Create a NUL-terminated C string buffer for FFI. */
function cstr(str: string): Buffer {
  return Buffer.concat([Buffer.from(str), Buffer.from([0])])
}

function nativeCompile(json: string): number {
  const id = Number(symbols.compile_schema(cstr(json)))
  symbols.free_last_result()
  return id
}

function nativeValidate(schemaId: number, dataJson: string): ValidationResult {
  symbols.validate(schemaId, cstr(dataJson))
  const ptr = symbols.get_last_result()
  const raw = ptr ? String(ptr) : null
  const result: ValidationResult = raw
    ? JSON.parse(raw)
    : { errors: [{ message: "No result returned from native validate", path: "$" }], valid: false }
  symbols.free_last_result()
  return result
}

function toPlainSchema(schema: unknown): unknown {
  if (schema === null || schema === undefined || typeof schema !== "object") return schema

  const obj = schema as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (INTERNAL_KEYS.has(key)) continue
    clean[key] = obj[key]
  }

  if ("properties" in clean && typeof clean.properties === "object" && clean.properties !== null) {
    const props: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(clean.properties as Record<string, unknown>)) {
      props[k] = toPlainSchema(v)
    }
    clean.properties = props
  }
  if ("items" in clean) {
    clean.items = toPlainSchema(clean.items)
  }
  if ("additionalProperties" in clean && typeof clean.additionalProperties === "object") {
    clean.additionalProperties = toPlainSchema(clean.additionalProperties)
  }
  if ("anyOf" in clean && Array.isArray(clean.anyOf)) {
    clean.anyOf = clean.anyOf.map(toPlainSchema)
  }

  return clean
}

function requiredKeys(properties: Record<string, TSchema>): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(properties)) {
    if (!(OptionalKind in (value as object))) {
      keys.push(key)
    }
  }
  return keys
}

// ─── Public API ────────────────────────────────────────────────────────────

export function compileSchema(schema: TSchema | string): number {
  const json = typeof schema === "string" ? schema : JSON.stringify(toPlainSchema(schema))
  return nativeCompile(json)
}

export function validate(schemaId: number, data: unknown): ValidationResult {
  return nativeValidate(schemaId, JSON.stringify(data))
}

export function validateSchema(schema: TSchema | string, data: unknown): ValidationResult {
  const id = compileSchema(schema)
  if (id === 0) {
    return { errors: [{ message: "Schema compilation failed", path: "$" }], valid: false }
  }
  const result = nativeValidate(id, JSON.stringify(data))
  symbols.free_schema(id)
  return result
}

export function freeSchema(schemaId: number): void {
  symbols.free_schema(schemaId)
}

// ─── Standard Schema helper ───────────────────────────────────────────────

function doValidate(schema: TSchema, value: unknown): StandardResult<unknown> {
  const result = validateSchema(schema, value)
  if (result.valid) {
    return { issues: undefined, value } as StandardSuccessResult<unknown>
  }
  return {
    issues: result.errors.map(
      (e: ValidationErrorDetail): StandardIssue => ({
        message: e.message,
        path: e.path === "$" ? [] : e.path.split("."),
      })
    ),
  } as StandardFailureResult
}

function addStd<S extends TSchema>(
  s: S
): S & {
  readonly "~standard": {
    version: 1
    vendor: string
    validate(value: unknown): StandardResult<Infer<S>>
  }
} {
  const schema = s as Record<string, unknown>
  schema["~standard"] = {
    validate: (value: unknown) => doValidate(s, value),
    vendor: "@dockstat/validator",
    version: 1 as const,
  }
  return s as S & {
    readonly "~standard": {
      version: 1
      vendor: string
      validate(value: unknown): StandardResult<Infer<S>>
    }
  }
}

// ─── Builder ───────────────────────────────────────────────────────────────

export const t = {
  Any() {
    return addStd({} as TAny)
  },

  Array<T extends TSchema>(items: T, opts?: ArrayOptions) {
    return addStd({ items, type: "array", ...opts } as TArray<T>)
  },

  Boolean() {
    return addStd({ type: "boolean" } satisfies TBoolean)
  },

  Enum<V extends TLiteralValue[]>(...values: V) {
    return addStd({ enum: values } as TEnum<V>)
  },

  Integer(opts?: NumberOptions) {
    return addStd({ type: "integer", ...opts } satisfies TInteger)
  },

  Literal<V extends TLiteralValue>(value: V) {
    return addStd({ const: value } as TLiteral<V>)
  },

  Never() {
    return addStd({ not: {} } as TNever)
  },

  Null() {
    return addStd({ type: "null" } satisfies TNull)
  },

  Nullable<T extends TSchema>(inner: T) {
    return addStd({ anyOf: [inner, { type: "null" }] } as TNullable<T>)
  },

  Number(opts?: NumberOptions) {
    return addStd({ type: "number", ...opts } satisfies TNumber)
  },

  Object<T extends Record<string, TSchema>>(properties: T, opts?: ObjectOptions) {
    return addStd({
      properties,
      required: requiredKeys(properties),
      type: "object",
      ...opts,
    } as TObject<T>)
  },

  Optional<T extends TSchema>(inner: T) {
    const copy = { ...(inner as Record<string, unknown>), [OptionalKind]: "Optional" as const }
    return addStd(copy as TOptional<T>)
  },

  Record<V extends TSchema = TAny>(valueSchema?: V) {
    return addStd({
      additionalProperties: (valueSchema ?? ({} as TAny)) as V,
      type: "object",
    } as TRecord<V>)
  },
  String(opts?: StringOptions) {
    return addStd({ type: "string", ...opts } satisfies TString)
  },

  Union<T extends TSchema[]>(...schemas: T) {
    return addStd({ anyOf: schemas } as TUnion<T>)
  },
}

/** Alias for `t` — barrel export of all available typings. */
export const v = t
