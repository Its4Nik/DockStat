import { expect, describe, test, afterAll } from "bun:test"
import { column, DB } from "../index"

/**
 * Tests for automatic detection of JSON and BOOLEAN columns from schema definition.
 * When using column.json() or column.boolean(), the parser should automatically
 * detect these columns without requiring explicit parser configuration.
 */

const autoDb = new DB(":memory:")

// Create table WITHOUT explicit parser - should auto-detect JSON and BOOLEAN columns
const autoTable = autoDb.createTable<{
  id: number
  data: unknown | null
  isActive: boolean | null
  metadata: unknown | null
  isVerified: boolean | null
}>("auto_table", {
  id: column.id(),
  data: column.json({ notNull: false }),
  isActive: column.boolean({ notNull: false }),
  metadata: column.json({ notNull: false }),
  isVerified: column.boolean({ notNull: false }),
})

afterAll(() => {
  autoDb.close()
})

describe("Auto-detection of JSON columns", () => {
  test("Auto-detect single JSON column", () => {
    const testData = { key: "value", nested: { count: 42 } }

    const insertId = autoTable.insert({ data: testData }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toEqual(testData)
  })

  test("Auto-detect multiple JSON columns", () => {
    const data1 = { type: "primary", values: [1, 2, 3] }
    const data2 = { source: "api", timestamp: 1234567890 }

    const insertId = autoTable.insert({ data: data1, metadata: data2 }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toEqual(data1)
    expect(result?.metadata).toEqual(data2)
  })

  test("Auto-detect JSON with array values", () => {
    const testData = ["item1", "item2", { nested: true }]

    const insertId = autoTable.insert({ data: testData }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toEqual(testData)
  })

  test("Auto-detect JSON handles null correctly", () => {
    const insertId = autoTable.insert({ data: null, metadata: null }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toBeNull()
    expect(result?.metadata).toBeNull()
  })
})

describe("Auto-detection of BOOLEAN columns", () => {
  test("Auto-detect single BOOLEAN column with true", () => {
    const insertId = autoTable.insert({ isActive: true }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.isActive).toBe(true)
  })

  test("Auto-detect single BOOLEAN column with false", () => {
    const insertId = autoTable.insert({ isActive: false }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.isActive).toBe(false)
  })

  test("Auto-detect multiple BOOLEAN columns", () => {
    const insertId = autoTable.insert({ isActive: true, isVerified: false }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.isActive).toBe(true)
    expect(result?.isVerified).toBe(false)
  })

  test("Auto-detect BOOLEAN handles null correctly", () => {
    const insertId = autoTable.insert({ isActive: null, isVerified: null }).insertId
    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.isActive).toBeNull()
    expect(result?.isVerified).toBeNull()
  })
})

describe("Combined auto-detection of JSON and BOOLEAN", () => {
  test("Auto-detect both JSON and BOOLEAN in same row", () => {
    const jsonData = { status: "active", metadata: { version: 1 } }

    const insertId = autoTable.insert({
      data: jsonData,
      isActive: true,
      metadata: { extra: "info" },
      isVerified: false,
    }).insertId

    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toEqual(jsonData)
    expect(result?.isActive).toBe(true)
    expect(result?.metadata).toEqual({ extra: "info" })
    expect(result?.isVerified).toBe(false)
  })

  test("Auto-detection works with updates", () => {
    const initialJson = { initial: true }
    const updatedJson = { updated: true, count: 99 }

    const insertId = autoTable.insert({ data: initialJson, isActive: false }).insertId

    autoTable.where({ id: insertId }).update({ data: updatedJson, isActive: true })

    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.data).toEqual(updatedJson)
    expect(result?.isActive).toBe(true)
  })

  test("Auto-detection works with bulk inserts", () => {
    const rows = [
      { data: { row: 1 }, isActive: true },
      { data: { row: 2 }, isActive: false },
      { data: { row: 3 }, isActive: true },
    ]

    autoTable.insertBatch(rows)

    const results = autoTable.select(["*"]).where({ isActive: true }).all()

    // Should find rows with isActive = true (including any previous test data)
    expect(results.length).toBeGreaterThanOrEqual(2)
    expect(results.every((r) => r.isActive === true)).toBe(true)
  })
})

describe("Auto-detection with explicit parser override", () => {
  test("Explicit parser merges with auto-detected columns", () => {
    const mixedDb = new DB(":memory:")

    // Create table with explicit parser for one column
    const mixedTable = mixedDb.createTable<{
      id: number
      jsonA: unknown | null
      jsonB: unknown | null
      boolA: boolean | null
    }>(
      "mixed_table",
      {
        id: column.id(),
        jsonA: column.json({ notNull: false }),
        jsonB: column.json({ notNull: false }),
        boolA: column.boolean({ notNull: false }),
      },
      {
        // Only explicitly specify jsonA, but jsonB and boolA should still be auto-detected
        parser: {
          JSON: ["jsonA"],
        },
      }
    )

    const testData = { jsonA: { a: 1 }, jsonB: { b: 2 }, boolA: true }
    const insertId = mixedTable.insert(testData).insertId

    const result = mixedTable.select(["*"]).where({ id: insertId }).first()

    // Both JSON columns should be parsed correctly
    expect(result?.jsonA).toEqual({ a: 1 })
    expect(result?.jsonB).toEqual({ b: 2 })
    // Boolean should also be parsed
    expect(result?.boolA).toBe(true)

    mixedDb.close()
  })
})
