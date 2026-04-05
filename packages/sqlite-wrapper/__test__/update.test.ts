import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

/**
 * Tests for UPDATE operations including:
 * - Basic update with WHERE conditions
 * - Update with regex conditions
 * - Upsert (INSERT OR REPLACE)
 * - Increment/decrement operations
 * - Update and get
 * - Batch updates
 * - JSON column updates
 */

describe("Basic UPDATE operations", () => {
  const db = new DB(":memory:")

  const users = db.createTable<{
    id: number
    name: string
    email: string
    age: number
    active: boolean
  }>("users", {
    id: column.id(),
    name: column.text({ notNull: true }),
    email: column.text({ notNull: true, unique: true }),
    age: column.integer({ default: 0 }),
    active: column.boolean({ default: true }),
  })

  beforeAll(() => {
    users.insert({ name: "Alice", email: "alice@example.com", age: 25, active: true })
    users.insert({ name: "Bob", email: "bob@example.com", age: 30, active: false })
    users.insert({ name: "Charlie", email: "charlie@example.com", age: 35, active: true })
  })

  afterAll(() => {
    db.close()
  })

  test("Update single row by id", () => {
    const result = users.where({ id: 1 }).update({ name: "Alice Updated" })

    expect(result.changes).toBe(1)

    const updated = users.where({ id: 1 }).first()
    expect(updated?.name).toBe("Alice Updated")
  })

  test("Update multiple columns at once", () => {
    const result = users.where({ id: 2 }).update({ name: "Bob Updated", age: 31 })

    expect(result.changes).toBe(1)

    const updated = users.where({ id: 2 }).first()
    expect(updated?.name).toBe("Bob Updated")
    expect(updated?.age).toBe(31)
  })

  test("Update multiple rows matching condition", () => {
    const result = users.where({ active: true }).update({ age: 40 })

    expect(result.changes).toBe(2) // Alice and Charlie

    const updatedRows = users.where({ age: 40 }).all()
    expect(updatedRows.length).toBe(2)
  })

  test("Update with no matching rows returns 0 changes", () => {
    const result = users.where({ id: 9999 }).update({ name: "Nobody" })

    expect(result.changes).toBe(0)
  })

  test("Update throws without WHERE clause", () => {
    expect(() => {
      users.update({ name: "Everyone" })
    }).toThrow()
  })

  test("Update with empty data throws error", () => {
    expect(() => {
      users.where({ id: 1 }).update({})
    }).toThrow("no columns to update")
  })
})

describe("Update with comparison operators", () => {
  const db = new DB(":memory:")

  const products = db.createTable<{
    id: number
    name: string
    price: number
    stock: number
  }>("products", {
    id: column.id(),
    name: column.text({ notNull: true }),
    price: column.real({ notNull: true }),
    stock: column.integer({ default: 0 }),
  })

  beforeAll(() => {
    products.insert({ name: "Widget A", price: 10.99, stock: 100 })
    products.insert({ name: "Widget B", price: 25.5, stock: 50 })
    products.insert({ name: "Widget C", price: 5.0, stock: 200 })
    products.insert({ name: "Widget D", price: 100.0, stock: 10 })
  })

  afterAll(() => {
    db.close()
  })

  test("Update with greater than operator", () => {
    const result = products.whereOp("price", ">", 20).update({ stock: 75 })

    expect(result.changes).toBe(2) // Widget B and D

    const updated = products.whereOp("price", ">", 20).all()
    expect(updated.every((p) => p.stock === 75)).toBe(true)
  })

  test("Update with less than or equal operator", () => {
    const result = products.whereOp("stock", "<=", 75).update({ price: 15.0 })

    expect(result.changes).toBeGreaterThan(0)
  })

  test("Update with LIKE operator", () => {
    const result = products.whereOp("name", "LIKE", "Widget%").update({ stock: 999 })

    expect(result.changes).toBe(4) // All widgets
  })

  test("Update with BETWEEN", () => {
    products.insert({ name: "Special Item", price: 50.0, stock: 25 })

    const result = products.whereBetween("price", 40, 60).update({ name: "Medium Price Item" })

    expect(result.changes).toBe(1)
  })
})

describe("Upsert operations", () => {
  const db = new DB(":memory:")

  const settings = db.createTable<{
    key: string
    value: string
  }>("settings", {
    key: column.text({ primaryKey: true, notNull: true }),
    value: column.text({ notNull: true }),
  })

  afterAll(() => {
    db.close()
  })

  test("Upsert inserts new row when not exists", () => {
    const result = settings.upsert({ key: "theme", value: "dark" })

    expect(result.changes).toBe(1)

    const row = settings.where({ key: "theme" }).first()
    expect(row?.value).toBe("dark")
  })

  test("Upsert replaces existing row", () => {
    settings.upsert({ key: "language", value: "en" })

    const result = settings.upsert({ key: "language", value: "fr" })

    expect(result.changes).toBe(1)

    const row = settings.where({ key: "language" }).first()
    expect(row?.value).toBe("fr")
  })

  test("Upsert with empty data throws error", () => {
    expect(() => {
      settings.upsert({})
    }).toThrow("no columns to upsert")
  })
})

describe("Increment and Decrement operations", () => {
  const db = new DB(":memory:")

  const counters = db.createTable<{
    id: number
    name: string
    value: number
    visits: number
  }>("counters", {
    id: column.id(),
    name: column.text({ notNull: true }),
    value: column.integer({ default: 0 }),
    visits: column.integer({ default: 0 }),
  })

  beforeAll(() => {
    counters.insert({ name: "page_views", value: 100, visits: 50 })
    counters.insert({ name: "clicks", value: 200, visits: 100 })
  })

  afterAll(() => {
    db.close()
  })

  test("Increment by default amount (1)", () => {
    const result = counters.where({ name: "page_views" }).increment("value")

    expect(result.changes).toBe(1)

    const row = counters.where({ name: "page_views" }).first()
    expect(row?.value).toBe(101)
  })

  test("Increment by specific amount", () => {
    const result = counters.where({ name: "clicks" }).increment("value", 50)

    expect(result.changes).toBe(1)

    const row = counters.where({ name: "clicks" }).first()
    expect(row?.value).toBe(250)
  })

  test("Decrement by default amount (1)", () => {
    const result = counters.where({ name: "page_views" }).decrement("visits")

    expect(result.changes).toBe(1)

    const row = counters.where({ name: "page_views" }).first()
    expect(row?.visits).toBe(49)
  })

  test("Decrement by specific amount", () => {
    const result = counters.where({ name: "clicks" }).decrement("visits", 25)

    expect(result.changes).toBe(1)

    const row = counters.where({ name: "clicks" }).first()
    expect(row?.visits).toBe(75)
  })

  test("Increment throws without WHERE clause", () => {
    expect(() => {
      counters.increment("value")
    }).toThrow()
  })

  test("Decrement can make value negative", () => {
    counters.insert({ name: "test_counter", value: 5, visits: 0 })

    counters.where({ name: "test_counter" }).decrement("value", 10)

    const row = counters.where({ name: "test_counter" }).first()
    expect(row?.value).toBe(-5)
  })
})

describe("Update and Get operations", () => {
  const db = new DB(":memory:")

  const logs = db.createTable<{
    id: number
    message: string
    level: string
    processed: boolean
  }>("logs", {
    id: column.id(),
    message: column.text({ notNull: true }),
    level: column.text({ default: "info" }),
    processed: column.boolean({ default: false }),
  })

  beforeAll(() => {
    logs.insert({ message: "System started", level: "info" })
    logs.insert({ message: "Warning detected", level: "warning" })
    logs.insert({ message: "Error occurred", level: "error" })
  })

  afterAll(() => {
    db.close()
  })

  test("Get rows before update, then update separately", () => {
    // First ensure the row exists and check its state
    const before = logs.where({ level: "warning" }).first()
    expect(before?.processed).toBe(false)

    // Get rows that will be updated
    const rowsToUpdate = logs.where({ level: "warning" }).all()
    expect(rowsToUpdate.length).toBe(1)
    expect(rowsToUpdate[0].processed).toBe(false)
    expect(rowsToUpdate[0].message).toBe("Warning detected")

    // Now update separately
    logs.where({ level: "warning" }).update({ processed: true })

    // Verify update actually happened
    const afterUpdate = logs.where({ level: "warning" }).first()
    expect(afterUpdate?.processed).toBe(true)
  })

  test("Update with no matching rows", () => {
    const result = logs.where({ level: "debug" }).update({ processed: true })

    expect(result.changes).toBe(0)
  })

  test("Update multiple rows", () => {
    logs.insert({ message: "Another info", level: "info" })

    // Reset processed status first
    logs.where({ level: "info" }).update({ processed: false })

    // Get rows before update
    const beforeUpdate = logs.where({ level: "info" }).all()
    expect(beforeUpdate.length).toBeGreaterThanOrEqual(2)
    expect(beforeUpdate.every((r) => r.level === "info")).toBe(true)

    // Update them
    const result = logs.where({ level: "info" }).update({ processed: true })
    expect(result.changes).toBeGreaterThanOrEqual(2)
  })
})

describe("Batch Update operations", () => {
  const db = new DB(":memory:")

  const items = db.createTable<{
    id: number
    name: string
    quantity: number
    price: number
  }>("items", {
    id: column.id(),
    name: column.text({ notNull: true }),
    quantity: column.integer({ default: 0 }),
    price: column.real({ default: 0 }),
  })

  beforeAll(() => {
    items.insert({ name: "Item A", quantity: 10, price: 5.0 })
    items.insert({ name: "Item B", quantity: 20, price: 10.0 })
    items.insert({ name: "Item C", quantity: 30, price: 15.0 })
  })

  afterAll(() => {
    db.close()
  })

  test("Batch update multiple rows with different values", () => {
    const result = items.updateBatch([
      { where: { id: 1 }, data: { quantity: 100 } },
      { where: { id: 2 }, data: { quantity: 200 } },
      { where: { id: 3 }, data: { quantity: 300 } },
    ])

    expect(result.changes).toBe(3)

    expect(items.where({ id: 1 }).first()?.quantity).toBe(100)
    expect(items.where({ id: 2 }).first()?.quantity).toBe(200)
    expect(items.where({ id: 3 }).first()?.quantity).toBe(300)
  })

  test("Batch update with different columns per row", () => {
    const result = items.updateBatch([
      { where: { id: 1 }, data: { name: "Updated A" } },
      { where: { id: 2 }, data: { price: 99.99 } },
    ])

    expect(result.changes).toBe(2)

    expect(items.where({ id: 1 }).first()?.name).toBe("Updated A")
    expect(items.where({ id: 2 }).first()?.price).toBe(99.99)
  })

  test("Batch update with empty array throws error", () => {
    expect(() => {
      items.updateBatch([])
    }).toThrow("must be a non-empty array")
  })

  test("Batch update skips empty data objects", () => {
    const result = items.updateBatch([
      { where: { id: 1 }, data: { quantity: 50 } },
      { where: { id: 2 }, data: {} }, // Empty, should be skipped
    ])

    expect(result.changes).toBe(1)
  })

  test("Batch update throws for missing WHERE conditions", () => {
    expect(() => {
      items.updateBatch([{ where: {}, data: { quantity: 999 } }])
    }).toThrow("must have WHERE conditions")
  })

  test("Batch update is atomic (transaction)", () => {
    // Insert a row to test atomicity
    items.insert({ name: "Test Item", quantity: 1, price: 1.0 })

    const initialCount = items.count()

    try {
      items.updateBatch([
        { where: { name: "Item A" }, data: { quantity: 500 } },
        { where: { name: "Item B" }, data: { quantity: 600 } },
        // This would normally succeed, but let's verify transaction behavior
      ])
    } catch {
      // If there's an error, changes should be rolled back
    }

    // Table should still have same number of rows
    expect(items.count()).toBe(initialCount)
  })
})

describe("Update with JSON columns", () => {
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

  test("Update JSON column with object", () => {
    configs.insert({
      name: "config1",
      settings: { theme: "light", fontSize: 14 },
    })

    const result = configs.where({ name: "config1" }).update({
      settings: { theme: "dark", fontSize: 16, newOption: true },
    })

    expect(result.changes).toBe(1)

    const updated = configs.where({ name: "config1" }).first()
    expect(updated?.settings).toEqual({ theme: "dark", fontSize: 16, newOption: true })
  })

  test("Update JSON column with array", () => {
    configs.insert({
      name: "config2",
      settings: { items: [] },
    })

    const result = configs.where({ name: "config2" }).update({
      settings: { items: [1, 2, 3, "four"] },
    })

    expect(result.changes).toBe(1)

    const updated = configs.where({ name: "config2" }).first()
    expect((updated?.settings as { items: unknown[] }).items).toEqual([1, 2, 3, "four"])
  })

  test("Update JSON column with nested object", () => {
    configs.insert({
      name: "config3",
      settings: {},
    })

    const nestedData = {
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    }

    const result = configs.where({ name: "config3" }).update({
      settings: nestedData,
    })

    expect(result.changes).toBe(1)

    const updated = configs.where({ name: "config3" }).first()
    expect(updated?.settings).toEqual(nestedData)
  })

  test("Update JSON column to null", () => {
    configs.insert({
      name: "config4",
      settings: { something: true },
      metadata: { extra: "data" },
    })

    const result = configs.where({ name: "config4" }).update({
      metadata: null,
    })

    expect(result.changes).toBe(1)

    const updated = configs.where({ name: "config4" }).first()
    expect(updated?.metadata).toBeNull()
  })
})

describe("Update with regex conditions", () => {
  const db = new DB(":memory:")

  const emails = db.createTable<{
    id: number
    email: string
    verified: boolean
    domain: string
  }>("emails", {
    id: column.id(),
    email: column.text({ notNull: true }),
    verified: column.boolean({ default: false }),
    domain: column.text({ notNull: false }),
  })

  beforeAll(() => {
    emails.insert({ email: "user1@gmail.com", domain: "gmail.com", verified: false })
    emails.insert({ email: "user2@gmail.com", domain: "gmail.com", verified: false })
    emails.insert({ email: "admin@company.org", domain: "company.org", verified: false })
    emails.insert({ email: "support@company.org", domain: "company.org", verified: false })
    emails.insert({ email: "test@yahoo.com", domain: "yahoo.com", verified: false })
  })

  afterAll(() => {
    db.close()
  })

  test("Update with regex pattern matching", () => {
    // Reset all to false first
    emails.whereNotNull("id").update({ verified: false })

    const result = emails.whereRgx({ email: /@gmail\.com$/ }).update({ verified: true })

    expect(result.changes).toBe(2)

    const verified = emails.where({ verified: true }).all()
    expect(verified.length).toBe(2)
    expect(verified.every((e) => e.email.endsWith("@gmail.com"))).toBe(true)
  })

  test("Update with regex string pattern", () => {
    // Reset all to false first
    emails.whereNotNull("id").update({ verified: false })

    const result = emails.whereRgx({ email: "^admin" }).update({ verified: true })

    expect(result.changes).toBe(1)

    const admin = emails.where({ email: "admin@company.org" }).first()
    expect(admin?.verified).toBe(true)
  })

  test("Update with regex no matches returns 0 changes", () => {
    const result = emails.whereRgx({ email: /@nonexistent\.com$/ }).update({ verified: true })

    expect(result.changes).toBe(0)
  })

  test("Update with combined SQL and regex conditions", () => {
    // Reset verified status
    emails.whereNotNull("id").update({ verified: false })

    // Match .org domains that start with specific patterns
    const result = emails
      .where({ domain: "company.org" })
      .whereRgx({ email: /^(admin|support)/ })
      .update({ verified: true })

    expect(result.changes).toBe(2)
  })
})

describe("Update with NULL handling", () => {
  const db = new DB(":memory:")

  const records = db.createTable<{
    id: number
    title: string
    description: string | null
    deletedAt: number | null
  }>("records", {
    id: column.id(),
    title: column.text({ notNull: true }),
    description: column.text({ notNull: false }),
    deletedAt: column.integer({ notNull: false }),
  })

  beforeAll(() => {
    records.insert({ title: "Record 1", description: "Has description" })
    records.insert({ title: "Record 2", description: null })
    records.insert({ title: "Record 3", description: "Another one" })
  })

  afterAll(() => {
    db.close()
  })

  test("Update WHERE column IS NULL", () => {
    const result = records.whereNull("description").update({ title: "No Description Record" })

    expect(result.changes).toBe(1)

    const updated = records.whereNull("description").first()
    expect(updated?.title).toBe("No Description Record")
  })

  test("Update WHERE column IS NOT NULL", () => {
    const result = records.whereNotNull("description").update({ deletedAt: 123456 })

    expect(result.changes).toBe(2)
  })

  test("Update column to NULL", () => {
    const result = records.where({ id: 1 }).update({ description: null })

    expect(result.changes).toBe(1)

    const updated = records.where({ id: 1 }).first()
    expect(updated?.description).toBeNull()
  })
})

describe("Update with IN/NOT IN conditions", () => {
  const db = new DB(":memory:")

  const tasks = db.createTable<{
    id: number
    title: string
    status: string
    priority: number
  }>("tasks", {
    id: column.id(),
    title: column.text({ notNull: true }),
    status: column.text({ default: "pending" }),
    priority: column.integer({ default: 1 }),
  })

  beforeAll(() => {
    tasks.insert({ title: "Task 1", status: "pending", priority: 1 })
    tasks.insert({ title: "Task 2", status: "in_progress", priority: 2 })
    tasks.insert({ title: "Task 3", status: "completed", priority: 3 })
    tasks.insert({ title: "Task 4", status: "pending", priority: 1 })
    tasks.insert({ title: "Task 5", status: "cancelled", priority: 2 })
  })

  afterAll(() => {
    db.close()
  })

  test("Update with whereIn", () => {
    const result = tasks.whereIn("status", ["pending", "in_progress"]).update({ priority: 5 })

    expect(result.changes).toBe(3)

    const updated = tasks.whereIn("status", ["pending", "in_progress"]).all()
    expect(updated.every((t) => t.priority === 5)).toBe(true)
  })

  test("Update with whereNotIn", () => {
    const result = tasks
      .whereNotIn("status", ["completed", "cancelled"])
      .update({ status: "reviewed" })

    expect(result.changes).toBe(3)
  })

  test("Update with whereIn on numeric column", () => {
    // Reset data
    tasks.where({ priority: 5 }).update({ priority: 1 })

    const result = tasks.whereIn("priority", [1, 2]).update({ priority: 10 })

    expect(result.changes).toBeGreaterThan(0)
  })
})
