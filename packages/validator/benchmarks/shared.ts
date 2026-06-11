// ─── Seeded PRNG (mulberry32) ──────────────────────────────────────────────

export class Random {
  private state: number

  constructor(seed = 42) {
    this.state = seed
  }

  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6b2f0965) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  float(min = 0, max = 1): number {
    return this.next() * (max - min) + min
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }

  string(len: number): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let s = ""
    for (let i = 0; i < len; i++) s += chars[this.int(0, chars.length - 1)]
    return s
  }
}

// ─── Schema descriptor types ───────────────────────────────────────────────

export type FieldType =
  | { kind: "string"; minLength?: number; maxLength?: number }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "integer"; min?: number; max?: number }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "array"; items: FieldType }
  | { kind: "object"; fields: Record<string, FieldType> }
  | { kind: "enum"; values: string[] }
  | { kind: "literal"; value: string | number | boolean }
  | { kind: "optional"; inner: FieldType }
  | { kind: "nullable"; inner: FieldType }

export interface SchemaDef {
  name: string
  fields: Record<string, FieldType>
}

// ─── Library adapter interface ────────────────────────────────────────────

export interface CompiledSchema {
  /** Called to release resources after the benchmark. */
  dispose(): void
}

export interface LibAdapter {
  name: string
  /** Create and compile a schema, returning the compiled handle. */
  compile(def: SchemaDef): CompiledSchema
  /** Validate a single data point against a compiled schema. No throw. */
  validate(compiled: CompiledSchema, data: unknown): boolean
}

// ─── Data generators ─────────────────────────────────────────────────────

export function generateValid(field: FieldType, rand: Random): unknown {
  switch (field.kind) {
    case "string": {
      const min = field.minLength ?? 1
      const max = field.maxLength ?? 20
      return rand.string(rand.int(min, max))
    }
    case "number": {
      const lo = field.min ?? 0
      const hi = field.max ?? 10000
      return rand.float(lo, hi)
    }
    case "integer": {
      const lo = field.min ?? 0
      const hi = field.max ?? 10000
      return rand.int(lo, hi)
    }
    case "boolean":
      return rand.float() > 0.5
    case "null":
      return null
    case "array": {
      const n = rand.int(1, 5)
      return Array.from({ length: n }, () => generateValid(field.items, rand))
    }
    case "object": {
      const obj: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(field.fields)) {
        obj[k] = generateValid(v, rand)
      }
      return obj
    }
    case "enum":
      return rand.pick(field.values)
    case "literal":
      return field.value
    case "optional":
      return rand.float() > 0.25 ? generateValid(field.inner, rand) : undefined
    case "nullable":
      return rand.float() > 0.25 ? generateValid(field.inner, rand) : null
  }
}

export function generateValidData(def: SchemaDef, rand: Random): unknown {
  const obj: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(def.fields)) {
    obj[k] = generateValid(v, rand)
  }
  return obj
}

function generateWrongType(rand: Random): unknown {
  const pick = rand.int(0, 4)
  switch (pick) {
    case 0:
      return rand.int(0, 1000)
    case 1:
      return rand.string(10)
    case 2:
      return true
    case 3:
      return null
    default:
      return [rand.string(5)]
  }
}

export function generateInvalidData(def: SchemaDef, rand: Random): unknown {
  const obj: Record<string, unknown> = {}
  const keys = Object.keys(def.fields)
  const mutateKey = rand.pick(keys)
  for (const [k, v] of Object.entries(def.fields)) {
    if (k === mutateKey) {
      obj[k] = generateWrongType(rand)
    } else {
      obj[k] = generateValid(v, rand)
    }
  }
  return obj
}

// ─── Benchmark runner ──────────────────────────────────────────────────────

export function bench(fn: () => void): number {
  // Warmup
  for (let i = 0; i < 500; i++) fn()

  // Calibrate: find iterations that take at least 250ms
  let batch = 10000
  let elapsed: number
  do {
    const t0 = performance.now()
    for (let i = 0; i < batch; i++) fn()
    elapsed = performance.now() - t0
    if (elapsed < 50) batch *= 10
    else if (elapsed < 250) batch = Math.ceil((batch * 250) / elapsed)
    else break
  } while (elapsed < 250)

  // Measure
  const t0 = performance.now()
  for (let i = 0; i < batch; i++) fn()
  const t1 = performance.now()

  return batch / ((t1 - t0) / 1000)
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US")
}
