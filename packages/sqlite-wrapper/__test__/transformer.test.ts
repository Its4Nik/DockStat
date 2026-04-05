import { afterAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"
import {
  getParserSummary,
  hasTransformations,
  transformFromDb,
  transformRowsFromDb,
  transformRowsToDb,
  transformToDb,
} from "../src/utils"

/**
 * Tests for Transformer utilities including:
 * - transformFromDb (deserialization)
 * - transformRowsFromDb (batch deserialization)
 * - transformToDb (serialization)
 * - transformRowsToDb (batch serialization)
 * - hasTransformations
 * - getParserSummary
 */

describe("transformFromDb - JSON parsing", () => {
  test("Parse JSON string to object", () => {
    const row = { data: '{"key":"value","count":42}', id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformFromDb<{ id: number; data: unknown }>(row, { parser })

    expect(result.data).toEqual({ count: 42, key: "value" })
  })

  test("Parse JSON array", () => {
    const row = { id: 1, items: "[1,2,3,4,5]" }
    const parser = { JSON: ["items" as const] }

    const result = transformFromDb<{ id: number; items: unknown }>(row, { parser })

    expect(result.items).toEqual([1, 2, 3, 4, 5])
  })

  test("Parse nested JSON object", () => {
    const row = { id: 1, nested: '{"level1":{"level2":{"value":"deep"}}}' }
    const parser = { JSON: ["nested" as const] }

    const result = transformFromDb<{ id: number; nested: unknown }>(row, { parser })

    expect(result.nested).toEqual({ level1: { level2: { value: "deep" } } })
  })

  test("Keep null values as null", () => {
    const row = { data: null, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformFromDb<{ id: number; data: unknown }>(row, { parser })

    expect(result.data).toBeNull()
  })

  test("Keep undefined values as undefined", () => {
    const row = { data: undefined, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformFromDb<{ id: number; data: unknown }>(row, { parser })

    expect(result.data).toBeUndefined()
  })

  test("Keep original value on JSON parse failure", () => {
    const row = { data: "not valid json{", id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformFromDb<{ id: number; data: unknown }>(row, { parser })

    expect(result.data).toBe("not valid json{")
  })

  test("Handle multiple JSON columns", () => {
    const row = {
      config: '{"theme":"dark"}',
      id: 1,
      metadata: '{"version":1}',
    }
    const parser = { JSON: ["config" as const, "metadata" as const] }

    const result = transformFromDb<{
      id: number
      config: unknown
      metadata: unknown
    }>(row, { parser })

    expect(result.config).toEqual({ theme: "dark" })
    expect(result.metadata).toEqual({ version: 1 })
  })

  test("Non-string JSON column values are kept as-is", () => {
    const row = { data: 12345, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformFromDb<{ id: number; data: unknown }>(row, { parser })

    expect(result.data).toBe(12345)
  })
})

describe("transformFromDb - Boolean parsing", () => {
  test("Convert 1 to true", () => {
    const row = { active: 1, id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(true)
  })

  test("Convert 0 to false", () => {
    const row = { active: 0, id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(false)
  })

  test("Keep null as null", () => {
    const row = { active: null, id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean | null }>(row, { parser })

    expect(result.active).toBeNull()
  })

  test("Keep undefined as undefined", () => {
    const row = { active: undefined, id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean | undefined }>(row, { parser })

    expect(result.active).toBeUndefined()
  })

  test("Keep existing boolean as-is", () => {
    const row = { active: true, id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(true)
  })

  test("Convert string '1' to true", () => {
    const row = { active: "1", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(true)
  })

  test("Convert string '0' to false", () => {
    const row = { active: "0", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(false)
  })

  test("Convert string 'true' to true", () => {
    const row = { active: "true", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(true)
  })

  test("Convert string 'false' to false", () => {
    const row = { active: "false", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(false)
  })

  test("Convert string 'yes' to true", () => {
    const row = { active: "yes", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(true)
  })

  test("Convert string 'no' to false", () => {
    const row = { active: "no", id: 1 }
    const parser = { BOOLEAN: ["active" as const] }

    const result = transformFromDb<{ id: number; active: boolean }>(row, { parser })

    expect(result.active).toBe(false)
  })

  test("Handle multiple boolean columns", () => {
    const row = { active: 1, id: 1, premium: 1, verified: 0 }
    const parser = { BOOLEAN: ["active" as const, "verified" as const, "premium" as const] }

    const result = transformFromDb<{
      id: number
      active: boolean
      verified: boolean
      premium: boolean
    }>(row, { parser })

    expect(result.active).toBe(true)
    expect(result.verified).toBe(false)
    expect(result.premium).toBe(true)
  })
})

describe("transformFromDb - Combined JSON and Boolean", () => {
  test("Transform both JSON and Boolean columns", () => {
    const row = {
      active: 1,
      config: '{"theme":"dark"}',
      id: 1,
    }
    const parser = {
      BOOLEAN: ["active" as const],
      JSON: ["config" as const],
    }

    const result = transformFromDb<{
      id: number
      config: unknown
      active: boolean
    }>(row, { parser })

    expect(result.config).toEqual({ theme: "dark" })
    expect(result.active).toBe(true)
  })
})

describe("transformFromDb - Edge cases", () => {
  test("Return null/undefined input as-is", () => {
    expect(transformFromDb(null)).toBeNull()
    expect(transformFromDb(undefined)).toBeUndefined()
  })

  test("Return row unchanged when no parser provided", () => {
    const row = { data: '{"key":"value"}', id: 1 }

    const result = transformFromDb(row)

    expect(result.data).toBe('{"key":"value"}')
  })

  test("Return row unchanged when parser is empty", () => {
    const row = { data: '{"key":"value"}', id: 1 }

    const result = transformFromDb(row, { parser: {} })

    expect(result.data).toBe('{"key":"value"}')
  })

  test("Handle empty JSON arrays in parser", () => {
    const row = { data: '{"key":"value"}', id: 1 }
    const parser = { JSON: [] }

    const result = transformFromDb(row, { parser })

    expect(result.data).toBe('{"key":"value"}')
  })
})

describe("transformRowsFromDb - Batch transformation", () => {
  test("Transform multiple rows", () => {
    const rows = [
      { active: 1, data: '{"a":1}', id: 1 },
      { active: 0, data: '{"b":2}', id: 2 },
      { active: 1, data: '{"c":3}', id: 3 },
    ]
    const parser = {
      BOOLEAN: ["active" as const],
      JSON: ["data" as const],
    }

    const results = transformRowsFromDb(rows, { parser })

    expect(results.length).toBe(3)
    expect(results[0].data).toEqual({ a: 1 })
    expect(results[0].active).toBe(true)
    expect(results[1].data).toEqual({ b: 2 })
    expect(results[1].active).toBe(false)
    expect(results[2].data).toEqual({ c: 3 })
    expect(results[2].active).toBe(true)
  })

  test("Return empty array for null/undefined input", () => {
    expect(transformRowsFromDb(null as unknown as unknown[])).toEqual([])
    expect(transformRowsFromDb(undefined as unknown as unknown[])).toEqual([])
  })

  test("Return empty array for non-array input", () => {
    expect(transformRowsFromDb("not array" as unknown as unknown[])).toEqual([])
  })
})

describe("transformToDb - Serialization", () => {
  test("Serialize object to JSON string", () => {
    const row = { data: { count: 42, key: "value" }, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformToDb(row, { parser })

    expect(result.data).toBe('{"key":"value","count":42}')
  })

  test("Serialize array to JSON string", () => {
    const row = { id: 1, items: [1, 2, 3, 4, 5] }
    const parser = { JSON: ["items" as const] }

    const result = transformToDb(row, { parser })

    expect(result.items).toBe("[1,2,3,4,5]")
  })

  test("Keep null values as null", () => {
    const row = { data: null, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformToDb(row, { parser })

    expect(result.data).toBeNull()
  })

  test("Keep undefined values as undefined", () => {
    const row = { data: undefined, id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformToDb(row, { parser })

    expect(result.data).toBeUndefined()
  })

  test("Keep non-object JSON column values as-is", () => {
    const row = { data: "just a string", id: 1 }
    const parser = { JSON: ["data" as const] }

    const result = transformToDb(row, { parser })

    expect(result.data).toBe("just a string")
  })

  test("Serialize nested objects", () => {
    const row = { id: 1, nested: { level1: { level2: { value: "deep" } } } }
    const parser = { JSON: ["nested" as const] }

    const result = transformToDb(row, { parser })

    expect(result.nested).toBe('{"level1":{"level2":{"value":"deep"}}}')
  })

  test("Return row unchanged when no parser", () => {
    const row = { data: { key: "value" }, id: 1 }

    const result = transformToDb(row)

    expect(result.data).toEqual({ key: "value" })
  })

  test("Return null/undefined input as-is", () => {
    expect(transformToDb(null as unknown as Record<string, unknown>)).toBeNull()
    expect(transformToDb(undefined as unknown as Record<string, unknown>)).toBeUndefined()
  })
})

describe("transformRowsToDb - Batch serialization", () => {
  test("Serialize multiple rows", () => {
    interface Row extends Record<string, unknown> {
      id: number
      data: Record<string, unknown>
    }

    const rows: Array<Row> = [
      { data: { a: 1 }, id: 1 },
      { data: { b: 2 }, id: 2 },
      { data: { c: 3 }, id: 3 },
    ]
    const parser = { JSON: ["data" as const] }

    const results = transformRowsToDb<Row>(rows, { parser })

    expect(results.length).toBe(3)
    expect(results[0].data).toBe('{"a":1}')
    expect(results[1].data).toBe('{"b":2}')
    expect(results[2].data).toBe('{"c":3}')
  })

  test("Return empty array for null/undefined input", () => {
    expect(transformRowsToDb(null as unknown as Record<string, unknown>[])).toEqual([])
    expect(transformRowsToDb(undefined as unknown as Record<string, unknown>[])).toEqual([])
  })

  test("Return empty array for non-array input", () => {
    expect(transformRowsToDb("not array" as unknown as Record<string, unknown>[])).toEqual([])
  })
})

describe("hasTransformations", () => {
  test("Returns false for undefined parser", () => {
    expect(hasTransformations(undefined)).toBe(false)
  })

  test("Returns false for empty parser", () => {
    expect(hasTransformations({})).toBe(false)
  })

  test("Returns false for empty JSON array", () => {
    expect(hasTransformations({ JSON: [] })).toBe(false)
  })

  test("Returns false for empty BOOLEAN array", () => {
    expect(hasTransformations({ BOOLEAN: [] })).toBe(false)
  })

  test("Returns false for empty MODULE object", () => {
    expect(hasTransformations({ MODULE: {} })).toBe(false)
  })

  test("Returns true when JSON columns defined", () => {
    expect(hasTransformations({ JSON: ["data"] })).toBe(true)
  })

  test("Returns true when BOOLEAN columns defined", () => {
    expect(hasTransformations({ BOOLEAN: ["active"] })).toBe(true)
  })

  test("Returns true when MODULE columns defined", () => {
    expect(hasTransformations({ MODULE: { fn: {} } })).toBe(true)
  })

  test("Returns true with multiple transformation types", () => {
    expect(
      hasTransformations<{ data: unknown; active: boolean; fn: unknown }>({
        BOOLEAN: ["active"],
        JSON: ["data"],
        MODULE: { fn: {} },
      })
    ).toBe(true)
  })
})

describe("getParserSummary", () => {
  test("Returns 'none' for undefined parser", () => {
    expect(getParserSummary(undefined)).toBe("none")
  })

  test("Returns 'none' for empty parser", () => {
    expect(getParserSummary({})).toBe("none")
  })

  test("Returns JSON count", () => {
    expect(getParserSummary({ JSON: ["data", "config"] })).toBe("JSON(2)")
  })

  test("Returns BOOLEAN count", () => {
    expect(getParserSummary({ BOOLEAN: ["active", "verified", "premium"] })).toBe("BOOL(3)")
  })

  test("Returns MODULE count", () => {
    expect(getParserSummary({ MODULE: { fn1: {}, fn2: {} } })).toBe("MODULE(2)")
  })

  test("Returns combined summary", () => {
    const summary = getParserSummary<{
      data: unknown
      active: boolean
      verified: boolean
      fn: unknown
    }>({
      BOOLEAN: ["active", "verified"],
      JSON: ["data"],
      MODULE: { fn: {} },
    })

    expect(summary).toContain("JSON(1)")
    expect(summary).toContain("BOOL(2)")
    expect(summary).toContain("MODULE(1)")
  })

  test("Omits empty arrays from summary", () => {
    const summary = getParserSummary({
      BOOLEAN: ["active"],
      JSON: [],
      MODULE: {},
    })

    expect(summary).toBe("BOOL(1)")
    expect(summary).not.toContain("JSON")
    expect(summary).not.toContain("MODULE")
  })
})

describe("Integration: Transformer with actual database", () => {
  const db = new DB(":memory:")

  const table = db.createTable<{
    id: number
    config: Record<string, unknown>
    metadata: unknown
    active: boolean
    verified: boolean
  }>("transform_test", {
    active: column.boolean({ default: true }),
    config: column.json(),
    id: column.id(),
    metadata: column.json({ notNull: false }),
    verified: column.boolean({ notNull: false }),
  })

  afterAll(() => {
    db.close()
  })

  test("End-to-end: Insert and retrieve with transformations", () => {
    const insertData = {
      active: true,
      config: { fontSize: 14, theme: "dark" },
      metadata: { version: "1.0" },
      verified: false,
    }

    const result = table.insert(insertData)
    expect(result.insertId).toBeGreaterThan(0)

    const retrieved = table.where({ id: result.insertId }).first()

    expect(retrieved).not.toBeNull()
    expect(retrieved?.config).toEqual({ fontSize: 14, theme: "dark" })
    expect(retrieved?.metadata).toEqual({ version: "1.0" })
    expect(retrieved?.active).toBe(true)
    expect(retrieved?.verified).toBe(false)
  })

  test("End-to-end: Update with JSON transformations", () => {
    const insertId = table.insert({
      active: true,
      config: { initial: true },
    }).insertId

    table.where({ id: insertId }).update({
      config: { newField: "value", updated: true },
    })

    const updated = table.where({ id: insertId }).first()

    expect(updated?.config).toEqual({ newField: "value", updated: true })
  })

  test("End-to-end: Handle null JSON and boolean values", () => {
    const insertId = table.insert({
      active: true,
      config: {},
      metadata: null,
      //@ts-expect-error
      verified: null,
    }).insertId

    const retrieved = table.where({ id: insertId }).first()

    expect(retrieved?.metadata).toBeNull()
    expect(retrieved?.verified).toBeNull()
  })

  test("End-to-end: Bulk insert with transformations", () => {
    const rows = [
      { active: true, config: { item: 1 }, verified: true },
      { active: false, config: { item: 2 }, verified: false },
      { active: true, config: { item: 3 }, verified: null },
    ]

    // @ts-expect-error
    table.insertBatch(rows)

    const results = table.whereOp("id", ">", 0).orderBy("id").all()

    expect(results.length).toBeGreaterThanOrEqual(3)
    // Check that transformations were applied
    const lastThree = results.slice(-3)
    expect(lastThree[0].config).toHaveProperty("item")
  })
})
