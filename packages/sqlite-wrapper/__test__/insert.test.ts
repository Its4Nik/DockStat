import { afterAll, beforeEach, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

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
    age: column.integer({ notNull: false }),
    email: column.text({ notNull: true, unique: true }),
    id: column.id(),
    name: column.text({ notNull: true }),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert single row returns insertId and changes", () => {
    const result = users.insert({
      age: 25,
      email: "alice@example.com",
      name: "Alice",
    })

    expect(result.insertId).toBe(1)
    expect(result.changes).toBe(1)
  })

  test("Insert row with null value", () => {
    const result = users.insert({
      age: null,
      email: "bob@example.com",
      name: "Bob",
    })

    expect(result.insertId).toBe(2)

    const bob = users.where({ id: result.insertId }).first()
    expect(bob?.age).toBeNull()
  })

  test("Insert row without optional field", () => {
    const result = users.insert({
      email: "charlie@example.com",
      name: "Charlie",
    })

    expect(result.insertId).toBe(3)

    const charlie = users.where({ id: result.insertId }).first()
    expect(charlie?.age).toBeNull()
  })

  test("Insert multiple rows sequentially", () => {
    const result1 = users.insert({ email: "user1@example.com", name: "User1" })
    const result2 = users.insert({ email: "user2@example.com", name: "User2" })
    const result3 = users.insert({ email: "user3@example.com", name: "User3" })

    expect(result1.insertId).toBeLessThan(result2.insertId)
    expect(result2.insertId).toBeLessThan(result3.insertId)
  })

  test("Insert throws on duplicate unique constraint", () => {
    users.insert({ email: "unique@example.com", name: "Unique" })

    expect(() => {
      users.insert({ email: "unique@example.com", name: "Duplicate" })
    }).toThrow()
  })

  test("Insert throws on NOT NULL constraint violation", () => {
    expect(() => {
      users.insert({ email: "test@example.com", name: null as unknown as string })
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
      code: column.text({ notNull: true, unique: true }),
      id: column.id(),
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
    active: column.boolean({ default: true }),
    id: column.id(),
    name: column.text({ notNull: true }),
    price: column.real({ notNull: true }),
  })

  afterAll(() => {
    db.close()
  })

  test("insertAndGet returns the inserted row", () => {
    const inserted = products.insertAndGet({
      active: true,
      name: "Widget",
      price: 29.99,
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
      code: column.text({ notNull: true, unique: true }),
      id: column.id(),
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
      level: column.text({ default: "info" }),
      message: column.text({ notNull: true }),
      timestamp: column.integer({ notNull: true }),
    })
  })

  afterAll(() => {
    db?.close()
  })

  test("insertBatch inserts multiple rows", () => {
    const now = Date.now()
    const result = logs.insertBatch([
      { level: "info", message: "Log 1", timestamp: now },
      { level: "warning", message: "Log 2", timestamp: now + 1 },
      { level: "error", message: "Log 3", timestamp: now + 2 },
    ])

    expect(result.changes).toBe(3)
    expect(logs.count()).toBe(3)
  })

  test("insertBatch returns last insert id", () => {
    const result = logs.insertBatch([
      { level: "info", message: "First", timestamp: 1000 },
      { level: "info", message: "Second", timestamp: 2000 },
    ])

    expect(result.insertId).toBe(2) // Last inserted ID
  })

  test("insertBatch with single row", () => {
    const result = logs.insertBatch([{ level: "debug", message: "Single", timestamp: 1000 }])

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
      code: column.text({ notNull: true, unique: true }),
      id: column.id(),
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
      code: column.text({ notNull: true, unique: true }),
      id: column.id(),
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
      level: "info",
      message: `Message ${i}`,
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
    metadata: column.json({ notNull: false }),
    name: column.text({ notNull: true }),
    settings: column.json(),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert with JSON object", () => {
    const settings = { fontSize: 14, notifications: true, theme: "dark" }

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
        colors: {
          primary: "#007bff",
          secondary: "#6c757d",
        },
        theme: "dark",
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
      metadata: null,
      name: "Null Metadata",
      settings: {},
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
    active: column.boolean({ default: false }),
    id: column.id(),
    name: column.text({ notNull: true }),
    premium: column.boolean({ default: false }),
    verified: column.boolean({ notNull: false }),
  })

  afterAll(() => {
    db.close()
  })

  test("Insert with true boolean", () => {
    const result = flags.insert({
      active: true,
      name: "True Test",
      premium: true,
      verified: true,
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.active).toBe(true)
    expect(retrieved?.verified).toBe(true)
    expect(retrieved?.premium).toBe(true)
  })

  test("Insert with false boolean", () => {
    const result = flags.insert({
      active: false,
      name: "False Test",
      premium: false,
      verified: false,
    })

    const retrieved = flags.where({ id: result.insertId }).first()
    expect(retrieved?.active).toBe(false)
    expect(retrieved?.verified).toBe(false)
    expect(retrieved?.premium).toBe(false)
  })

  test("Insert with null boolean", () => {
    const result = flags.insert({
      active: true,
      name: "Null Test",
      premium: false,
      verified: null,
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
      { active: true, name: "Batch 1", premium: false },
      { active: false, name: "Batch 2", premium: true },
      { active: true, name: "Batch 3", premium: true },
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
    created_at: column.createdAt(),
    id: column.id(),
    priority: column.integer({ default: 1 }),
    status: column.text({ default: "pending" }),
    title: column.text({ notNull: true }),
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
      priority: 5,
      status: "active",
      title: "Override Test",
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
      created: column.createdAt(),
      id: column.id(),
    })

    // Insert with empty data - the default values will be used
    const result = minimal.insert({ created: Math.floor(Date.now() / 1000) })

    expect(result.insertId).toBe(1)
    expect(result.changes).toBe(1)
  })

  test("Insert with special characters in text", () => {
    const texts = db.createTable<{ id: number; content: string }>("texts", {
      content: column.text({ notNull: true }),
      id: column.id(),
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
      content: column.text({ notNull: true }),
      id: column.id(),
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
      amount: column.real({ notNull: true }),
      id: column.id(),
      value: column.integer({ notNull: true }),
    })

    numbers.insert({ amount: 0.0, value: 0 })
    numbers.insert({ amount: -99.99, value: -100 })

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
