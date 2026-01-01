import { afterAll, beforeEach, describe, expect, test } from "bun:test"
import { column, DB } from "../index"

/**
 * Comprehensive tests for InsertQueryBuilder operations
 *
 * Tests cover:
 * - Basic single row insert
 * - Insert multiple rows
 * - Insert with conflict resolution (IGNORE, REPLACE, ABORT, FAIL, ROLLBACK)
 * - Insert and get (returns inserted row)
 * - Batch inserts with transaction support
 * - Insert with JSON columns
 * - Insert with boolean columns
 * - Insert with default values
 * - Error handling
 */

describe("Basic INSERT operations", () => {
  const db = new DB(":memory:")

  const users = db.createTable<{
    id: number
    name: string
    email: string
    age: number | null
  }>("users", {
    id: column.id(),
    name: column.text({ notNull: true }),
    email: column.text({ notNull: true, unique: true }),
    age: column.integer({ notNull: false }),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert single row returns insertId and changes", () => {
    const result = users.insert({
      name: "Alice",
      email: "alice@example.com",
      age: 25,
    })

    expect(result.insertId).toBe(1)
    expect(result.changes).toBe(1)
  })

  test("Insert row with null value", () => {
    const result = users.insert({
      name: "Bob",
      email: "bob@example.com",
      age: null,
    })

    expect(result.insertId).toBe(2)

    const bob = users.where({ id: result.insertId }).first()
    expect(bob?.age).toBeNull()
  })

  test("Insert row without optional field", () => {
    const result = users.insert({
      name: "Charlie",
      email: "charlie@example.com",
    })

    expect(result.insertId).toBe(3)

    const charlie = users.where({ id: result.insertId }).first()
    expect(charlie?.age).toBeNull()
  })

  test("Insert multiple rows sequentially", () => {
    const result1 = users.insert({ name: "User1", email: "user1@example.com" })
    const result2 = users.insert({ name: "User2", email: "user2@example.com" })
    const result3 = users.insert({ name: "User3", email: "user3@example.com" })

    expect(result1.insertId).toBeLessThan(result2.insertId)
    expect(result2.insertId).toBeLessThan(result3.insertId)
  })

  test("Insert throws on duplicate unique constraint", () => {
    users.insert({ name: "Unique", email: "unique@example.com" })

    expect(() => {
      users.insert({ name: "Duplicate", email: "unique@example.com" })
    }).toThrow()
  })

  test("Insert throws on NOT NULL constraint violation", () => {
    expect(() => {
      users.insert({ name: null as unknown as string, email: "test@example.com" })
    }).toThrow()
  })
})

describe("INSERT with conflict resolution", () => {
  let db: DB
  let items: ReturnType<
    typeof db.createTable<{
      id: number
      code: string
      name: string
      quantity: number
    }>
  >

  beforeEach(() => {
    db = new DB(":memory:")
    items = db.createTable<{
      id: number
      code: string
      name: string
      quantity: number
    }>("items", {
      id: column.id(),
      code: column.text({ notNull: true, unique: true }),
      name: column.text({ notNull: true }),
      quantity: column.integer({ default: 0 }),
    })

    // Insert initial data
    items.insert({ code: "A001", name: "Item A", quantity: 10 })
    items.insert({ code: "B002", name: "Item B", quantity: 20 })
  })

  afterAll(() => {
    db?.close()
  })

  test("insertOrIgnore ignores duplicates without error", () => {
    const result = items.insertOrIgnore({ code: "A001", name: "Duplicate", quantity: 99 })

    expect(result.changes).toBe(0)

    // Original row should be unchanged
    const item = items.where({ code: "A001" }).first()
    expect(item?.name).toBe("Item A")
    expect(item?.quantity).toBe(10)
  })

  test("insertOrIgnore inserts new row normally", () => {
    const result = items.insertOrIgnore({ code: "C003", name: "Item C", quantity: 30 })

    expect(result.changes).toBe(1)

    const item = items.where({ code: "C003" }).first()
    expect(item?.name).toBe("Item C")
  })

  test("insertOrReplace replaces existing row", () => {
    const result = items.insertOrReplace({ code: "A001", name: "Replaced Item A", quantity: 100 })

    expect(result.changes).toBe(1)

    const item = items.where({ code: "A001" }).first()
    expect(item?.name).toBe("Replaced Item A")
    expect(item?.quantity).toBe(100)
  })

  test("insertOrReplace inserts new row normally", () => {
    const result = items.insertOrReplace({ code: "D004", name: "Item D", quantity: 40 })

    expect(result.changes).toBe(1)

    const item = items.where({ code: "D004" }).first()
    expect(item?.name).toBe("Item D")
  })

  test("insertOrAbort aborts on constraint violation", () => {
    expect(() => {
      items.insertOrAbort({ code: "A001", name: "Abort Test", quantity: 0 })
    }).toThrow()
  })

  test("insertOrFail fails on constraint violation", () => {
    expect(() => {
      items.insertOrFail({ code: "B002", name: "Fail Test", quantity: 0 })
    }).toThrow()
  })

  test("insertOrRollback throws on constraint violation", () => {
    expect(() => {
      items.insertOrRollback({ code: "A001", name: "Rollback Test", quantity: 0 })
    }).toThrow()
  })

  test("Insert with explicit options object - orIgnore", () => {
    const result = items.insert({ code: "A001", name: "Test", quantity: 0 }, { orIgnore: true })

    expect(result.changes).toBe(0)
  })

  test("Insert with explicit options object - orReplace", () => {
    const result = items.insert(
      { code: "A001", name: "Options Replace", quantity: 999 },
      { orReplace: true }
    )

    expect(result.changes).toBe(1)

    const item = items.where({ code: "A001" }).first()
    expect(item?.name).toBe("Options Replace")
  })
})

describe("INSERT and get operations", () => {
  const db = new DB(":memory:")

  const products = db.createTable<{
    id: number
    name: string
    price: number
    active: boolean
  }>("products", {
    id: column.id(),
    name: column.text({ notNull: true }),
    price: column.real({ notNull: true }),
    active: column.boolean({ default: true }),
  })

  afterAll(() => {
    db.close()
  })

  test("insertAndGet returns the inserted row", () => {
    const inserted = products.insertAndGet({
      name: "Widget",
      price: 29.99,
      active: true,
    })

    expect(inserted).not.toBeNull()
    expect(inserted?.id).toBe(1)
    expect(inserted?.name).toBe("Widget")
    expect(inserted?.price).toBe(29.99)
    expect(inserted?.active).toBe(true)
  })

  test("insertAndGet with auto-generated id", () => {
    const inserted = products.insertAndGet({
      name: "Gadget",
      price: 49.99,
    })

    expect(inserted?.id).toBeGreaterThan(0)
    expect(inserted?.name).toBe("Gadget")
  })

  test("insertAndGet returns null on conflict with orIgnore", () => {
    // Create table with unique constraint
    const uniqueTable = db.createTable<{
      id: number
      code: string
    }>("unique_products", {
      id: column.id(),
      code: column.text({ notNull: true, unique: true }),
    })

    uniqueTable.insert({ code: "EXISTING" })

    const result = uniqueTable.insertAndGet({ code: "EXISTING" }, { orIgnore: true })

    expect(result).toBeNull()
  })

  test("insertAndGet with boolean default value", () => {
    const inserted = products.insertAndGet({
      name: "Default Active",
      price: 10.0,
    })

    expect(inserted?.active).toBe(true)
  })
})

describe("Batch INSERT operations", () => {
  let db: DB
  let logs: ReturnType<
    typeof db.createTable<{
      id: number
      message: string
      level: string
      timestamp: number
    }>
  >

  beforeEach(() => {
    db = new DB(":memory:")
    logs = db.createTable<{
      id: number
      message: string
      level: string
      timestamp: number
    }>("logs", {
      id: column.id(),
      message: column.text({ notNull: true }),
      level: column.text({ default: "info" }),
      timestamp: column.integer({ notNull: true }),
    })
  })

  afterAll(() => {
    db?.close()
  })

  test("insertBatch inserts multiple rows", () => {
    const now = Date.now()
    const result = logs.insertBatch([
      { message: "Log 1", level: "info", timestamp: now },
      { message: "Log 2", level: "warning", timestamp: now + 1 },
      { message: "Log 3", level: "error", timestamp: now + 2 },
    ])

    expect(result.changes).toBe(3)
    expect(logs.count()).toBe(3)
  })

  test("insertBatch returns last insert id", () => {
    const result = logs.insertBatch([
      { message: "First", level: "info", timestamp: 1000 },
      { message: "Second", level: "info", timestamp: 2000 },
    ])

    expect(result.insertId).toBe(2) // Last inserted ID
  })

  test("insertBatch with single row", () => {
    const result = logs.insertBatch([{ message: "Single", level: "debug", timestamp: 1000 }])

    expect(result.changes).toBe(1)
    expect(result.insertId).toBe(1)
  })

  test("insertBatch with empty array throws", () => {
    expect(() => {
      logs.insertBatch([])
    }).toThrow()
  })

  test("insertBatch is atomic (transaction)", () => {
    const uniqueTable = db.createTable<{
      id: number
      code: string
    }>("batch_unique", {
      id: column.id(),
      code: column.text({ notNull: true, unique: true }),
    })

    uniqueTable.insert({ code: "EXISTING" })

    // This should fail because of duplicate
    expect(() => {
      uniqueTable.insertBatch([
        { code: "NEW1" },
        { code: "EXISTING" }, // Duplicate - should cause rollback
        { code: "NEW2" },
      ])
    }).toThrow()

    // Due to transaction rollback, NEW1 should not exist
    expect(uniqueTable.count()).toBe(1)
  })

  test("insertBatch with orIgnore option", () => {
    const uniqueTable = db.createTable<{
      id: number
      code: string
    }>("batch_ignore", {
      id: column.id(),
      code: column.text({ notNull: true, unique: true }),
    })

    uniqueTable.insert({ code: "EXISTING" })

    const result = uniqueTable.insertBatch(
      [{ code: "NEW1" }, { code: "EXISTING" }, { code: "NEW2" }],
      { orIgnore: true }
    )

    expect(result.changes).toBe(2) // NEW1 and NEW2 inserted, EXISTING ignored
    expect(uniqueTable.count()).toBe(3)
  })

  test("insertBatch with large number of rows", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      message: `Message ${i}`,
      level: "info",
      timestamp: 1000 + i,
    }))

    const result = logs.insertBatch(rows)

    expect(result.changes).toBe(100)
    expect(logs.count()).toBe(100)
  })
})

describe("INSERT with JSON columns", () => {
  const db = new DB(":memory:")

  const configs = db.createTable<{
    id: number
    name: string
    settings: Record<string, unknown>
    metadata: unknown
  }>("configs", {
    id: column.id(),
    name: column.text({ notNull: true }),
    settings: column.json(),
    metadata: column.json({ notNull: false }),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert with JSON object", () => {
    const settings = { theme: "dark", fontSize: 14, notifications: true }

    const result = configs.insert({
      name: "User Config",
      settings,
    })

    expect(result.insertId).toBe(1)

    const retrieved = configs.where({ id: result.insertId }).first()
    expect(retrieved?.settings).toEqual(settings)
  })

  test("Insert with nested JSON object", () => {
    const settings = {
      display: {
        theme: "dark",
        colors: {
          primary: "#007bff",
          secondary: "#6c757d",
        },
      },
      features: ["feature1", "feature2"],
    }

    const result = configs.insert({ name: "Nested Config", settings })

    const retrieved = configs.where({ id: result.insertId }).first()
    expect(retrieved?.settings).toEqual(settings)
  })

  test("Insert with JSON array", () => {
    const settings = { items: [1, 2, 3, "four", { nested: true }] }

    const result = configs.insert({ name: "Array Config", settings })

    const retrieved = configs.where({ id: result.insertId }).first()
    expect((retrieved?.settings as { items: unknown[] }).items).toEqual([
      1,
      2,
      3,
      "four",
      { nested: true },
    ])
  })

  test("Insert with null JSON value", () => {
    const result = configs.insert({
      name: "Null Metadata",
      settings: {},
      metadata: null,
    })

    const retrieved = configs.where({ id: result.insertId }).first()
    expect(retrieved?.metadata).toBeNull()
  })

  test("Batch insert with JSON columns", () => {
    configs.insertBatch([
      { name: "Config 1", settings: { a: 1 } },
      { name: "Config 2", settings: { b: 2 } },
      { name: "Config 3", settings: { c: 3 } },
    ])

    const results = configs.whereIn("name", ["Config 1", "Config 2", "Config 3"]).all()

    expect(results.length).toBe(3)
    expect(results[0].settings).toHaveProperty("a")
    expect(results[1].settings).toHaveProperty("b")
    expect(results[2].settings).toHaveProperty("c")
  })
})

describe("INSERT with boolean columns", () => {
  const db = new DB(":memory:")

  const flags = db.createTable<{
    id: number
    name: string
    active: boolean
    verified: boolean | null
    premium: boolean
  }>("flags", {
    id: column.id(),
    name: column.text({ notNull: true }),
    active: column.boolean({ default: false }),
    verified: column.boolean({ notNull: false }),
    premium: column.boolean({ default: false }),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert with true boolean", () => {
    const result = flags.insert({
      name: "True Test",
      active: true,
      verified: true,
      premium: true,
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.active).toBe(true)
    expect(retrieved?.verified).toBe(true)
    expect(retrieved?.premium).toBe(true)
  })

  test("Insert with false boolean", () => {
    const result = flags.insert({
      name: "False Test",
      active: false,
      verified: false,
      premium: false,
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.active).toBe(false)
    expect(retrieved?.verified).toBe(false)
    expect(retrieved?.premium).toBe(false)
  })

  test("Insert with null boolean", () => {
    const result = flags.insert({
      name: "Null Test",
      active: true,
      verified: null,
      premium: false,
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.verified).toBeNull()
  })

  test("Insert uses boolean default values", () => {
    const result = flags.insert({
      name: "Default Test",
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.active).toBe(false)
    expect(retrieved?.premium).toBe(false)
  })

  test("Batch insert with boolean columns", () => {
    flags.insertBatch([
      { name: "Batch 1", active: true, premium: false },
      { name: "Batch 2", active: false, premium: true },
      { name: "Batch 3", active: true, premium: true },
    ])

    const results = flags.whereIn("name", ["Batch 1", "Batch 2", "Batch 3"]).all()

    expect(results.length).toBe(3)
    expect(results.find((r) => r.name === "Batch 1")?.active).toBe(true)
    expect(results.find((r) => r.name === "Batch 2")?.active).toBe(false)
    expect(results.find((r) => r.name === "Batch 3")?.premium).toBe(true)
  })
})

describe("INSERT with default values", () => {
  const db = new DB(":memory:")

  const records = db.createTable<{
    id: number
    title: string
    status: string
    priority: number
    created_at: number
  }>("records", {
    id: column.id(),
    title: column.text({ notNull: true }),
    status: column.text({ default: "pending" }),
    priority: column.integer({ default: 1 }),
    created_at: column.createdAt(),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert uses string default value", () => {
    const result = records.insert({ title: "Test Record" })

    const retrieved = records.where({ id: result.insertId }).first()
    expect(retrieved?.status).toBe("pending")
  })

  test("Insert uses integer default value", () => {
    const result = records.insert({ title: "Priority Test" })

    const retrieved = records.where({ id: result.insertId }).first()
    expect(retrieved?.priority).toBe(1)
  })

  test("Insert can override default values", () => {
    const result = records.insert({
      title: "Override Test",
      status: "active",
      priority: 5,
    })

    const retrieved = records.where({ id: result.insertId }).first()
    expect(retrieved?.status).toBe("active")
    expect(retrieved?.priority).toBe(5)
  })

  test("Insert uses timestamp default (createdAt)", () => {
    const beforeInsert = Math.floor(Date.now() / 1000)

    const result = records.insert({ title: "Timestamp Test" })

    const afterInsert = Math.floor(Date.now() / 1000)

    const retrieved = records.where({ id: result.insertId }).first()
    expect(retrieved?.created_at).toBeGreaterThanOrEqual(beforeInsert)
    expect(retrieved?.created_at).toBeLessThanOrEqual(afterInsert)
  })
})

describe("INSERT edge cases", () => {
  const db = new DB(":memory:")

  afterAll(() => {
    db.close()
  })

  test("Insert with only auto-generated fields", () => {
    const minimal = db.createTable<{ id: number; created: number }>("minimal", {
      id: column.id(),
      created: column.createdAt(),
    })

    // Insert with empty data - the default values will be used
    const result = minimal.insert({ created: Math.floor(Date.now() / 1000) })

    expect(result.insertId).toBe(1)
    expect(result.changes).toBe(1)
  })

  test("Insert with special characters in text", () => {
    const texts = db.createTable<{ id: number; content: string }>("texts", {
      id: column.id(),
      content: column.text({ notNull: true }),
    })

    const specialContent = "It's a \"test\" with 'quotes' and \\ backslashes"

    const result = texts.insert({ content: specialContent })

    const retrieved = texts.where({ id: result.insertId }).first()
    expect(retrieved?.content).toBe(specialContent)
  })

  test("Insert with unicode characters", () => {
    const unicode = db.createTable<{ id: number; text: string }>("unicode", {
      id: column.id(),
      text: column.text({ notNull: true }),
    })

    const unicodeText = "Hello 世界 🌍 مرحبا"

    const result = unicode.insert({ text: unicodeText })

    const retrieved = unicode.where({ id: result.insertId }).first()
    expect(retrieved?.text).toBe(unicodeText)
  })

  test("Insert with very long text", () => {
    const longText = db.createTable<{ id: number; content: string }>("long_text", {
      id: column.id(),
      content: column.text({ notNull: true }),
    })

    const veryLongContent = "x".repeat(10000)

    const result = longText.insert({ content: veryLongContent })

    const retrieved = longText.where({ id: result.insertId }).first()
    expect(retrieved?.content.length).toBe(10000)
  })

  test("Insert with zero and negative numbers", () => {
    const numbers = db.createTable<{
      id: number
      value: number
      amount: number
    }>("numbers", {
      id: column.id(),
      value: column.integer({ notNull: true }),
      amount: column.real({ notNull: true }),
    })

    numbers.insert({ value: 0, amount: 0.0 })
    numbers.insert({ value: -100, amount: -99.99 })

    const zero = numbers.where({ value: 0 }).first()
    const negative = numbers.where({ value: -100 }).first()

    expect(zero?.value).toBe(0)
    expect(zero?.amount).toBe(0.0)
    expect(negative?.value).toBe(-100)
    expect(negative?.amount).toBe(-99.99)
  })

  test("Insert array of rows using insert method", () => {
    const multi = db.createTable<{ id: number; name: string }>("multi", {
      id: column.id(),
      name: column.text({ notNull: true }),
    })

    const result = multi.insert([{ name: "First" }, { name: "Second" }, { name: "Third" }])

    expect(result.changes).toBe(3)
    expect(multi.count()).toBe(3)
  })
})
