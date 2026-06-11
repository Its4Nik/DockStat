import { describe, expect, test } from "bun:test"
import { t, v, validateSchema, compileSchema, validate, freeSchema } from "../index"
import type { Infer } from "../index"

describe("Schema builder", () => {
  test("t.String()", () => {
    const schema = t.String()
    const result = validateSchema(schema, "hello")
    expect(result.valid).toBe(true)
  })

  test("t.String({ minLength: 7 }) rejects short strings", () => {
    const schema = t.String({ minLength: 7 })
    expect(validateSchema(schema, "short").valid).toBe(false)
    expect(validateSchema(schema, "long enough").valid).toBe(true)
  })

  test("t.Number()", () => {
    expect(validateSchema(t.Number(), 42).valid).toBe(true)
    expect(validateSchema(t.Number(), "not a number").valid).toBe(false)
  })

  test("t.Integer()", () => {
    expect(validateSchema(t.Integer(), 7).valid).toBe(true)
    expect(validateSchema(t.Integer(), 3.14).valid).toBe(false)
  })

  test("t.Boolean()", () => {
    expect(validateSchema(t.Boolean(), true).valid).toBe(true)
    expect(validateSchema(t.Boolean(), "yes").valid).toBe(false)
  })

  test("t.Null()", () => {
    expect(validateSchema(t.Null(), null).valid).toBe(true)
    expect(validateSchema(t.Null(), 0).valid).toBe(false)
  })

  test("t.Array(t.String())", () => {
    const schema = t.Array(t.String())
    expect(validateSchema(schema, ["a", "b"]).valid).toBe(true)
    expect(validateSchema(schema, [1, "b"]).valid).toBe(false)
  })

  test("t.Object({...})", () => {
    const schema = t.Object({
      name: t.String(),
      age: t.Number(),
    })
    expect(validateSchema(schema, { name: "Alice", age: 30 }).valid).toBe(true)
    expect(validateSchema(schema, { name: "Alice" }).valid).toBe(false)
    expect(validateSchema(schema, { name: "Alice", age: "30" }).valid).toBe(false)
  })

  test("t.Object with t.Optional", () => {
    const schema = t.Object({
      name: t.String(),
      nickname: t.Optional(t.String()),
    })
    expect(validateSchema(schema, { name: "Alice" }).valid).toBe(true)
    expect(validateSchema(schema, { name: "Alice", nickname: "Ally" }).valid).toBe(true)
    expect(validateSchema(schema, {}).valid).toBe(false)
  })

  test("t.Record()", () => {
    const schema = t.Record(t.Number())
    expect(validateSchema(schema, { a: 1, b: 2 }).valid).toBe(true)
    expect(validateSchema(schema, { a: "x" }).valid).toBe(false)
  })

  test("t.Record() without args defaults to any", () => {
    const schema = t.Record()
    expect(validateSchema(schema, { anything: "goes", num: 42 }).valid).toBe(true)
  })

  test("t.Literal()", () => {
    const schema = t.Literal("hello")
    expect(validateSchema(schema, "hello").valid).toBe(true)
    expect(validateSchema(schema, "world").valid).toBe(false)
  })

  test("t.Enum()", () => {
    const schema = t.Enum("red", "green", "blue")
    expect(validateSchema(schema, "red").valid).toBe(true)
    expect(validateSchema(schema, "yellow").valid).toBe(false)
  })

  test("t.Union()", () => {
    const schema = t.Union(t.String(), t.Number())
    expect(validateSchema(schema, "hello").valid).toBe(true)
    expect(validateSchema(schema, 42).valid).toBe(true)
    expect(validateSchema(schema, true).valid).toBe(false)
  })

  test("t.Nullable()", () => {
    const schema = t.Nullable(t.String())
    expect(validateSchema(schema, "hello").valid).toBe(true)
    expect(validateSchema(schema, null).valid).toBe(true)
    expect(validateSchema(schema, 42).valid).toBe(false)
  })

  test("t.Any() accepts everything", () => {
    const schema = t.Any()
    expect(validateSchema(schema, "string").valid).toBe(true)
    expect(validateSchema(schema, 42).valid).toBe(true)
    expect(validateSchema(schema, null).valid).toBe(true)
  })

  test("t.Never() rejects everything", () => {
    const schema = t.Never()
    expect(validateSchema(schema, "anything").valid).toBe(false)
  })

  test("full example from README", () => {
    const schema = t.Object({
      string1: t.String(),
      boolean: t.Boolean(),
      arraysAsWell: t.Array(t.String()),
      recordsAlso: t.Record(t.Number()),
      string2: t.String({ minLength: 7 }),
    })

    expect(
      validateSchema(schema, {
        string1: "hello",
        boolean: true,
        arraysAsWell: ["a", "b"],
        recordsAlso: { x: 1 },
        string2: "long enough",
      }).valid,
    ).toBe(true)

    expect(
      validateSchema(schema, {
        string1: "hello",
        boolean: true,
        arraysAsWell: ["a", "b"],
        recordsAlso: { x: 1 },
        string2: "short",
      }).valid,
    ).toBe(false)
  })
})

describe("compileSchema / validate / freeSchema", () => {
  test("manual compile-validate-free cycle", () => {
    const id = compileSchema(t.Object({ name: t.String() }))
    expect(id).toBeGreaterThan(0)
    const result = validate(id, { name: "test" })
    expect(result.valid).toBe(true)
    freeSchema(id)
  })
})

describe("v alias", () => {
  test("v is the same as t", () => {
    expect(v).toBe(t)
  })
})

describe("Standard Schema (~standard)", () => {
  test("t.String()['~standard'].validate() success", () => {
    const schema = t.String()
    const result = schema["~standard"].validate("hello")
    expect(result.issues).toBeUndefined()
    if ("value" in result) expect(result.value).toBe("hello")
  })

  test("t.String()['~standard'].validate() failure", () => {
    const schema = t.String()
    const result = schema["~standard"].validate(42)
    expect(result.issues).toBeDefined()
    if (result.issues) expect(result.issues.length).toBeGreaterThan(0)
  })

  test("vendor and version", () => {
    const schema = t.String()
    expect(schema["~standard"].version).toBe(1)
    expect(schema["~standard"].vendor).toBe("@dockstat/validator")
  })
})

describe("Infer type", () => {
  test("inference compiles (structural check)", () => {
    const schema = t.Object({
      name: t.String(),
      age: t.Number(),
      tags: t.Array(t.String()),
    })
    type MyType = Infer<typeof schema>

    const _data: MyType = { name: "Alice", age: 30, tags: ["dev"] }
    expect(_data.name).toBe("Alice")
  })
})
