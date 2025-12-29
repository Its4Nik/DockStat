import { expect, describe, test, afterAll } from "bun:test"
import { column, DB } from "../index"

const testDb = new DB(":memory:")

const testTable = testDb.createTable<{
  id: number
  jsonCol: unknown | null
  booleanCol: boolean | null
}>(
  "test_table",
  {
    id: column.id(),
    jsonCol: column.json({ notNull: false }),
    booleanCol: column.boolean({ notNull: false }),
  },
  {
    parser: {
      JSON: ["jsonCol"],
      BOOLEAN: ["booleanCol"],
    },
  }
)

afterAll(() => {
  testDb.close()
})

describe("JSON parsing tests", () => {
  test("JSON parsing with nested objects", () => {
    const testData = {
      nested: {
        data: "value",
      },
      array: ["item1", "item2"],
    }

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: testData, booleanCol: null })
  })

  test("JSON parsing with arrays", () => {
    const testData = [1, 2, 3, "four", { five: 5 }]

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: testData, booleanCol: null })
  })

  test("JSON parsing with null value", () => {
    const insertId = testTable.insert({ jsonCol: null }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: null, booleanCol: null })
  })

  test("JSON parsing with empty object", () => {
    const testData = {}

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: testData, booleanCol: null })
  })

  test("JSON parsing with deeply nested structure", () => {
    const testData = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deep",
            },
          },
        },
      },
    }

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: testData, booleanCol: null })
  })
})

describe("Boolean parsing tests", () => {
  test("Boolean true value parsing", () => {
    const insertId = testTable.insert({ booleanCol: true }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, booleanCol: true, jsonCol: null })
  })

  test("Boolean false value parsing", () => {
    const insertId = testTable.insert({ booleanCol: false }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, booleanCol: false, jsonCol: null })
  })

  test("Boolean null value parsing", () => {
    const insertId = testTable.insert({ booleanCol: null }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, booleanCol: null, jsonCol: null })
  })
})

describe("Combined JSON and Boolean parsing tests", () => {
  test("Both JSON and Boolean values in same row", () => {
    const jsonData = { key: "value", count: 42 }

    const insertId = testTable.insert({ jsonCol: jsonData, booleanCol: true }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: jsonData, booleanCol: true })
  })

  test("Update JSON column preserves Boolean parsing", () => {
    const initialJson = { initial: true }
    const updatedJson = { updated: true }

    const insertId = testTable.insert({ jsonCol: initialJson, booleanCol: false }).insertId

    testTable.where({ id: insertId }).update({ jsonCol: updatedJson })

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ id: insertId, jsonCol: updatedJson, booleanCol: false })
  })
})
