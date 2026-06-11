// ─── Internal markers ──────────────────────────────────────────────────────

export const OptionalKind: unique symbol = Symbol("Optional")

// ─── String ────────────────────────────────────────────────────────────────

export interface StringOptions {
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
}

export interface TString extends StringOptions {
  type: "string"
}

// ─── Number / Integer ──────────────────────────────────────────────────────

export interface NumberOptions {
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number
}

export interface TNumber extends NumberOptions {
  type: "number"
}

export interface TInteger extends NumberOptions {
  type: "integer"
}

// ─── Boolean ───────────────────────────────────────────────────────────────

export interface TBoolean {
  type: "boolean"
}

// ─── Null ──────────────────────────────────────────────────────────────────

export interface TNull {
  type: "null"
}

// ─── Array ─────────────────────────────────────────────────────────────────

export interface ArrayOptions {
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export interface TArray<T extends TSchema = TSchema> extends ArrayOptions {
  type: "array"
  items: T
}

// ─── Object ────────────────────────────────────────────────────────────────

export interface ObjectOptions {
  additionalProperties?: boolean
}

export interface TObject<T extends Record<string, TSchema> = Record<string, TSchema>>
  extends ObjectOptions {
  type: "object"
  properties: T
  required: string[]
}

// ─── Record ────────────────────────────────────────────────────────────────

export interface TRecord<V extends TSchema = TAny> {
  type: "object"
  additionalProperties: V
}

// ─── Literal / Enum / Union ────────────────────────────────────────────────

export type TLiteralValue = string | number | boolean | null

export interface TLiteral<V extends TLiteralValue = TLiteralValue> {
  const: V
}

export interface TEnum<V extends TLiteralValue[] = TLiteralValue[]> {
  enum: [...V]
}

export interface TUnion<T extends TSchema[] = TSchema[]> {
  anyOf: [...T]
}

// ─── Optional / Nullable ──────────────────────────────────────────────────

export type TOptional<T extends TSchema = TSchema> = T & { [OptionalKind]?: "Optional" }

export interface TNullable<T extends TSchema = TSchema> {
  anyOf: [T, TNull]
}

// ─── Any / Never ───────────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noEmptyInterface: Required
export interface TAny {}

export interface TNever {
  // biome-ignore lint/complexity/noBannedTypes: Required
  not: {}
}

// ─── Schema union ──────────────────────────────────────────────────────────

export type TSchema =
  | TString
  | TNumber
  | TInteger
  | TBoolean
  | TNull
  | TArray<TAny>
  | TObject<any>
  | TRecord<TAny>
  | TLiteral<any>
  | TEnum<any>
  | TUnion<any>
  | TOptional<TAny>
  | TNullable<TAny>
  | TAny
  | TNever

// ─── Type inference ────────────────────────────────────────────────────────

export type Infer<T> = T extends TString
  ? string
  : T extends TNumber
    ? number
    : T extends TInteger
      ? number
      : T extends TBoolean
        ? boolean
        : T extends TNull
          ? null
          : T extends TArray<infer I>
            ? Infer<I>[]
            : T extends TObject<infer P>
              ? InferObject<P>
              : T extends TRecord<infer V>
                ? Record<string, Infer<V>>
                : T extends TLiteral<infer V>
                  ? V
                  : T extends TEnum<infer V>
                    ? V[number]
                    : T extends TUnion<infer S>
                      ? Infer<S[number]>
                      : T extends TOptional<infer I>
                        ? Infer<I>
                        : T extends TNullable<infer I>
                          ? Infer<I> | null
                          : T extends TAny
                            ? any
                            : T extends TNever
                              ? never
                              : unknown

type Prettify<T> = { [K in keyof T]: T[K] } & {}

type InferObject<P extends Record<string, TSchema>> = Prettify<
  {
    [K in keyof P as P[K] extends TOptional<any> ? never : K]: Infer<P[K]>
  } & {
    [K in keyof P as P[K] extends TOptional<any> ? K : never]?: Infer<P[K]>
  }
>

// ─── Validation result (mirrors Rust types) ───────────────────────────────

export interface ValidationErrorDetail {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationErrorDetail[]
}

// ─── Standard Schema V1 ───────────────────────────────────────────────────

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1Props<Input, Output>
}

export interface StandardSchemaV1Props<Input = unknown, Output = Input> {
  readonly version: 1
  readonly vendor: string
  readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>
  readonly types?: StandardTypes<Input, Output>
}

export type StandardResult<Output> = StandardSuccessResult<Output> | StandardFailureResult

export interface StandardSuccessResult<Output> {
  readonly value: Output
  readonly issues?: undefined
}

export interface StandardFailureResult {
  readonly issues: ReadonlyArray<StandardIssue>
}

export interface StandardIssue {
  readonly message: string
  readonly path?: ReadonlyArray<PropertyKey>
}

export interface StandardTypes<Input = unknown, Output = Input> {
  readonly input: Input
  readonly output: Output
}
