import { afterAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

const testDb = new DB(":memory:")

const testTable = testDb.createTable<{
  id: number
  jsonCol: unknown | null
  booleanCol: boolean | null
}>(
  "test_table",
  {
    booleanCol: column.boolean({ notNull: false }),
    id: column.id(),
    jsonCol: column.json({ notNull: false }),
  },
  {
    parser: {
      BOOLEAN: ["booleanCol"],
      JSON: ["jsonCol"],
    },
  }
)

afterAll(() => {
  testDb.close()
})

describe("JSON parsing tests", () => {
  test("JSON parsing with nested objects", () => {
    const testData = {
      array: ["item1", "item2"],
      nested: {
        data: "value",
      },
    }

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: testData })
  })

  test("JSON parsing with arrays", () => {
    const testData = [1, 2, 3, "four", { five: 5 }]

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: testData })
  })

  test("JSON parsing with null value", () => {
    const insertId = testTable.insert({ jsonCol: null }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: null })
  })

  test("JSON parsing with empty object", () => {
    const testData = {}

    const insertId = testTable.insert({ jsonCol: testData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: testData })
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
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: testData })
  })
})

describe("Boolean parsing tests", () => {
  test("Boolean true value parsing", () => {
    const insertId = testTable.insert({ booleanCol: true }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: true, id: insertId, jsonCol: null })
  })

  test("Boolean false value parsing", () => {
    const insertId = testTable.insert({ booleanCol: false }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: false, id: insertId, jsonCol: null })
  })

  test("Boolean null value parsing", () => {
    const insertId = testTable.insert({ booleanCol: null }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: null, id: insertId, jsonCol: null })
  })
})

describe("Combined JSON and Boolean parsing tests", () => {
  test("Both JSON and Boolean values in same row", () => {
    const jsonData = { count: 42, key: "value" }

    const insertId = testTable.insert({ booleanCol: true, jsonCol: jsonData }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: true, id: insertId, jsonCol: jsonData })
  })

  test("Update JSON column preserves Boolean parsing", () => {
    const initialJson = { initial: true }
    const updatedJson = { updated: true }

    const insertId = testTable.insert({ booleanCol: false, jsonCol: initialJson }).insertId

    testTable.where({ id: insertId }).update({ jsonCol: updatedJson })

    const result = testTable.select(["*"]).where({ id: insertId }).first()
    expect(result).toEqual({ booleanCol: false, id: insertId, jsonCol: updatedJson })
  })
})
