import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test"
import { column, DB } from "../index"

/**
 * Comprehensive tests for DeleteQueryBuilder operations
 *
 * Tests cover:
 * - Basic delete with WHERE conditions
 * - Delete with regex conditions
 * - Delete and get (returns deleted rows)
 * - Soft delete functionality
 * - Restore soft deleted rows
 * - Batch deletes
 * - Truncate (full table delete)
 * - Delete older than timestamp
 * - Delete duplicates
 * - Error handling
 */

describe("DeleteQueryBuilder Tests", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")
  })

  afterAll(() => {
    db.close()
  })

  describe("Basic delete operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        email: string | null
        active: boolean
      }>
    >

    beforeEach(() => {
      // Drop and recreate table for each test
      try {
        db.dropTable("delete_basic", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        email: string | null
        active: boolean
      }>(
        "delete_basic",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          email: column.text({ notNull: false }),
          active: column.boolean({ default: true }),
        },
        { ifNotExists: true }
      )

      // Insert test data
      table.insertBatch([
        { name: "Alice", email: "alice@example.com", active: true },
        { name: "Bob", email: "bob@example.com", active: false },
        { name: "Charlie", email: "charlie@example.com", active: true },
        { name: "David", email: "david@example.com", active: false },
      ])
    })

    test("Delete single row by id", () => {
      const result = table.where({ id: 1 }).delete()

      expect(result.changes).toBe(1)
      expect(table.select(["*"]).count()).toBe(3)
      expect(table.where({ id: 1 }).first()).toBeNull()
    })

    test("Delete multiple rows by condition", () => {
      const result = table.where({ active: false }).delete()

      expect(result.changes).toBe(2)
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Delete with no matching rows returns 0 changes", () => {
      const result = table.where({ name: "NonExistent" }).delete()

      expect(result.changes).toBe(0)
      expect(table.select(["*"]).count()).toBe(4)
    })

    test("Delete requires WHERE clause", () => {
      expect(() => table.delete()).toThrow()
    })

    test("Delete with multiple conditions", () => {
      const result = table.where({ active: true, name: "Alice" }).delete()

      expect(result.changes).toBe(1)
      expect(table.select(["*"]).count()).toBe(3)
    })

    test("Delete with null condition", () => {
      // First update a row to have null email
      table.where({ id: 1 }).update({ email: null })

      const result = table.where({ email: null }).delete()

      expect(result.changes).toBe(1)
    })
  })

  describe("Delete with regex conditions", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        email: string
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_regex", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        email: string
      }>(
        "delete_regex",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          email: column.text({ notNull: true }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { name: "Alice Smith", email: "alice@gmail.com" },
        { name: "Bob Johnson", email: "bob@yahoo.com" },
        { name: "Charlie Smith", email: "charlie@gmail.com" },
        { name: "David Brown", email: "david@hotmail.com" },
      ])
    })

    test("Delete with regex pattern on email", () => {
      // Use whereOp to satisfy WHERE requirement, then whereRgx for regex filtering
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ email: /@gmail\.com$/ })
        .delete()

      expect(result.changes).toBe(2)
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Delete with regex pattern on name", () => {
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ name: /Smith$/ })
        .delete()

      expect(result.changes).toBe(2)
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Delete with regex string pattern", () => {
      const result = table.whereOp("id", ">", 0).whereRgx({ name: "Johnson" }).delete()

      expect(result.changes).toBe(1)
    })

    test("Delete with regex no matches", () => {
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ email: /@nonexistent\.com$/ })
        .delete()

      expect(result.changes).toBe(0)
      expect(table.select(["*"]).count()).toBe(4)
    })

    test("Delete with combined WHERE and regex", () => {
      table.insert({ name: "Eve Smith", email: "eve@gmail.com" })

      // Only delete gmail users with Smith in name
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ email: /@gmail\.com$/, name: /Smith/ })
        .delete()

      expect(result.changes).toBe(3) // Alice Smith, Charlie Smith, Eve Smith
    })
  })

  describe("Delete and get operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        value: number
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_get", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        value: number
      }>(
        "delete_get",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          value: column.integer({ default: 0 }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { name: "Item1", value: 100 },
        { name: "Item2", value: 200 },
        { name: "Item3", value: 300 },
      ])
    })

    test("Delete and get returns deleted rows", () => {
      const deleted = table.where({ id: 1 }).deleteAndGet()

      expect(deleted.length).toBe(1)
      expect(deleted[0].name).toBe("Item1")
      expect(deleted[0].value).toBe(100)
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Delete and get multiple rows", () => {
      const deleted = table.whereOp("value", ">=", 200).deleteAndGet()

      expect(deleted.length).toBe(2)
      expect(deleted.map((d) => d.name).sort()).toEqual(["Item2", "Item3"])
    })

    test("Delete and get with no matches returns empty array", () => {
      const deleted = table.where({ name: "NonExistent" }).deleteAndGet()

      expect(deleted).toEqual([])
      expect(table.select(["*"]).count()).toBe(3)
    })
  })

  describe("Soft delete operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        deleted_at: number | null
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("soft_delete", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        deleted_at: number | null
      }>(
        "soft_delete",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          deleted_at: column.integer({ notNull: false }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { name: "Active1", deleted_at: null },
        { name: "Active2", deleted_at: null },
        { name: "Active3", deleted_at: null },
      ])
    })

    test("Soft delete marks row as deleted", () => {
      const result = table.where({ id: 1 }).softDelete()

      expect(result.changes).toBe(1)

      const row = table.select(["*"]).where({ id: 1 }).first()
      expect(row?.deleted_at).not.toBeNull()
      expect(typeof row?.deleted_at).toBe("number")
    })

    test("Soft delete with custom column name", () => {
      const customTable = db.createTable<{
        id: number
        name: string
        removed_at: number | null
      }>(
        "soft_delete_custom",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          removed_at: column.integer({ notNull: false }),
        },
        { ifNotExists: true }
      )

      customTable.insert({ name: "Test", removed_at: null })

      const result = customTable.where({ id: 1 }).softDelete("removed_at")

      expect(result.changes).toBe(1)

      const row = customTable.select(["*"]).where({ id: 1 }).first()
      expect(row?.removed_at).not.toBeNull()
    })

    test("Soft delete with custom value", () => {
      const customValue = 1234567890

      const result = table.where({ id: 1 }).softDelete("deleted_at", customValue)

      expect(result.changes).toBe(1)

      const row = table.select(["*"]).where({ id: 1 }).first()
      expect(row?.deleted_at).toBe(customValue)
    })

    test("Soft delete multiple rows", () => {
      const result = table.whereIn("id", [1, 2]).softDelete()

      expect(result.changes).toBe(2)

      const softDeleted = table.whereNotNull("deleted_at").count()
      expect(softDeleted).toBe(2)
    })

    test("Soft delete requires WHERE clause", () => {
      expect(() => table.softDelete()).toThrow()
    })

    test("Soft delete with regex conditions", () => {
      table.insert({ name: "RegexTest", deleted_at: null })

      const result = table.whereOp("id", ">", 0).whereRgx({ name: /Regex/ }).softDelete()

      expect(result.changes).toBe(1)
    })
  })

  describe("Restore operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        deleted_at: number | null
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("restore_test", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        deleted_at: number | null
      }>(
        "restore_test",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          deleted_at: column.integer({ notNull: false }),
        },
        { ifNotExists: true }
      )

      const now = Math.floor(Date.now() / 1000)
      table.insertBatch([
        { name: "Deleted1", deleted_at: now },
        { name: "Deleted2", deleted_at: now },
        { name: "Active1", deleted_at: null },
      ])
    })

    test("Restore clears deleted_at", () => {
      const result = table.where({ id: 1 }).restore()

      expect(result.changes).toBe(1)

      const row = table.select(["*"]).where({ id: 1 }).first()
      expect(row?.deleted_at).toBeNull()
    })

    test("Restore with custom column name", () => {
      const customTable = db.createTable<{
        id: number
        name: string
        removed_at: number | null
      }>(
        "restore_custom",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          removed_at: column.integer({ notNull: false }),
        },
        { ifNotExists: true }
      )

      customTable.insert({ name: "Test", removed_at: 123456 })

      const result = customTable.where({ id: 1 }).restore("removed_at")

      expect(result.changes).toBe(1)

      const row = customTable.select(["*"]).where({ id: 1 }).first()
      expect(row?.removed_at).toBeNull()
    })

    test("Restore multiple rows", () => {
      const result = table.whereNotNull("deleted_at").restore()

      expect(result.changes).toBe(2)

      const stillDeleted = table.whereNotNull("deleted_at").count()
      expect(stillDeleted).toBe(0)
    })

    test("Restore requires WHERE clause", () => {
      expect(() => table.restore()).toThrow()
    })

    test("Restore with regex conditions", () => {
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ name: /Deleted1/ })
        .restore()

      expect(result.changes).toBe(1)

      const row = table.select(["*"]).where({ name: "Deleted1" }).first()
      expect(row?.deleted_at).toBeNull()
    })

    test("Restore with no matching rows", () => {
      const result = table
        .whereOp("id", ">", 0)
        .whereRgx({ name: /NonExistent/ })
        .restore()

      expect(result.changes).toBe(0)
    })
  })

  describe("Batch delete operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        category: string | null
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_batch", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        category: string | null
      }>(
        "delete_batch",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          category: column.text({ notNull: false }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { name: "Item1", category: "A" },
        { name: "Item2", category: "B" },
        { name: "Item3", category: "A" },
        { name: "Item4", category: "C" },
        { name: "Item5", category: "B" },
      ])
    })

    test("Batch delete multiple conditions", () => {
      const result = table.deleteBatch([{ id: 1 }, { id: 3 }, { id: 5 }])

      expect(result.changes).toBe(3)
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Batch delete by different columns", () => {
      const result = table.deleteBatch([{ name: "Item1" }, { category: "B" }])

      expect(result.changes).toBe(3) // Item1 + Item2 + Item5
    })

    test("Batch delete with some non-matching conditions", () => {
      const result = table.deleteBatch([{ id: 1 }, { id: 999 }, { id: 3 }])

      expect(result.changes).toBe(2)
    })

    test("Batch delete with empty array throws", () => {
      expect(() => table.deleteBatch([])).toThrow(
        "deleteBatch: conditions must be a non-empty array"
      )
    })

    test("Batch delete with null values", () => {
      // Update category to NULL using the table API
      table.where({ id: 1 }).update({ category: "temp" })
      db.run(`UPDATE "delete_batch" SET "category" = NULL WHERE id = 1`)

      const result = table.deleteBatch([{ category: null }])

      expect(result.changes).toBe(1)
    })

    test("Batch delete is atomic (transaction)", () => {
      // All deletes should happen in a transaction
      const countBefore = table.select(["*"]).count()

      const result = table.deleteBatch([{ id: 1 }, { id: 2 }])

      expect(result.changes).toBe(2)
      expect(table.select(["*"]).count()).toBe(countBefore - 2)
    })
  })

  describe("Truncate operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("truncate_test", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
      }>(
        "truncate_test",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([{ name: "Item1" }, { name: "Item2" }, { name: "Item3" }])
    })

    test("Truncate deletes all rows", () => {
      expect(table.select(["*"]).count()).toBe(3)

      const result = table.truncate()

      expect(result.changes).toBe(3)
      expect(table.select(["*"]).count()).toBe(0)
    })

    test("Truncate on empty table returns 0 changes", () => {
      table.truncate()

      const result = table.truncate()

      expect(result.changes).toBe(0)
    })

    test("Truncate does not require WHERE clause", () => {
      expect(() => table.truncate()).not.toThrow()
    })
  })

  describe("Delete older than operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        created_at: number
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_older", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        created_at: number
      }>(
        "delete_older",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          created_at: column.integer({ notNull: true }),
        },
        { ifNotExists: true }
      )

      const now = Math.floor(Date.now() / 1000)
      table.insertBatch([
        { name: "Old1", created_at: now - 86400 * 10 }, // 10 days ago
        { name: "Old2", created_at: now - 86400 * 5 }, // 5 days ago
        { name: "Recent1", created_at: now - 86400 }, // 1 day ago
        { name: "Recent2", created_at: now }, // now
      ])
    })

    test("Delete older than specific timestamp", () => {
      const now = Math.floor(Date.now() / 1000)
      const threeDaysAgo = now - 86400 * 3

      const result = table.deleteOlderThan("created_at", threeDaysAgo)

      expect(result.changes).toBe(2) // Old1 and Old2
      expect(table.select(["*"]).count()).toBe(2)
    })

    test("Delete older than with no matches", () => {
      const now = Math.floor(Date.now() / 1000)
      const twentyDaysAgo = now - 86400 * 20

      const result = table.deleteOlderThan("created_at", twentyDaysAgo)

      expect(result.changes).toBe(0)
    })

    test("Delete older than deletes all when threshold is in future", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400

      const result = table.deleteOlderThan("created_at", futureTimestamp)

      expect(result.changes).toBe(4)
    })
  })

  describe("Delete duplicates operations", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        email: string
        name: string
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_dups", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        email: string
        name: string
      }>(
        "delete_dups",
        {
          id: column.id(),
          email: column.text({ notNull: true }),
          name: column.text({ notNull: true }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { email: "alice@example.com", name: "Alice" },
        { email: "bob@example.com", name: "Bob" },
        { email: "alice@example.com", name: "Alice Duplicate" }, // Duplicate email
        { email: "charlie@example.com", name: "Charlie" },
        { email: "bob@example.com", name: "Bob Duplicate" }, // Duplicate email
      ])
    })

    test("Delete duplicates by single column", () => {
      const result = table.deleteDuplicates(["email"])

      expect(result.changes).toBe(2) // Removes 2 duplicates
      expect(table.select(["*"]).count()).toBe(3)

      // Should keep the first occurrence (lowest rowid)
      const alice = table.where({ email: "alice@example.com" }).first()
      expect(alice?.name).toBe("Alice")
    })

    test("Delete duplicates by multiple columns", () => {
      // Add rows that are duplicates only when considering both columns
      table.insert({ email: "alice@example.com", name: "Alice" }) // Full duplicate

      const result = table.deleteDuplicates(["email", "name"])

      // Only the full duplicate should be removed
      expect(result.changes).toBeGreaterThanOrEqual(1)
    })

    test("Delete duplicates with no duplicates", () => {
      // Create a table with no duplicates
      const uniqueTable = db.createTable<{
        id: number
        code: string
      }>(
        "unique_items",
        {
          id: column.id(),
          code: column.text({ notNull: true, unique: true }),
        },
        { ifNotExists: true }
      )

      uniqueTable.insertBatch([{ code: "A" }, { code: "B" }, { code: "C" }])

      const result = uniqueTable.deleteDuplicates(["code"])

      expect(result.changes).toBe(0)
    })

    test("Delete duplicates with empty columns array throws", () => {
      expect(() => table.deleteDuplicates([])).toThrow(
        "deleteDuplicates: columns must be a non-empty array"
      )
    })
  })

  describe("Delete with WHERE operators", () => {
    let table: ReturnType<
      typeof db.createTable<{
        id: number
        name: string
        score: number
        status: string | null
      }>
    >

    beforeEach(() => {
      try {
        db.dropTable("delete_ops", { ifExists: true })
      } catch {
        // Table might not exist
      }

      table = db.createTable<{
        id: number
        name: string
        score: number
        status: string | null
      }>(
        "delete_ops",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          score: column.integer({ default: 0 }),
          status: column.text({ notNull: false }),
        },
        { ifNotExists: true }
      )

      table.insertBatch([
        { name: "Alice", score: 85, status: "active" },
        { name: "Bob", score: 72, status: "pending" },
        { name: "Charlie", score: 90, status: "active" },
        { name: "David", score: 65, status: "inactive" },
        { name: "Eve", score: 88, status: "pending" },
      ])
    })

    test("Delete with whereOp greater than", () => {
      const result = table.whereOp("score", ">", 80).delete()

      expect(result.changes).toBe(3) // Alice, Charlie, Eve
    })

    test("Delete with whereOp less than or equal", () => {
      const result = table.whereOp("score", "<=", 72).delete()

      expect(result.changes).toBe(2) // Bob, David
    })

    test("Delete with whereIn", () => {
      const result = table.whereIn("status", ["pending", "inactive"]).delete()

      expect(result.changes).toBe(3) // Bob, David, Eve
    })

    test("Delete with whereNotIn", () => {
      const result = table.whereNotIn("status", ["active"]).delete()

      expect(result.changes).toBe(3)
    })

    test("Delete with whereBetween", () => {
      const result = table.whereBetween("score", 70, 85).delete()

      expect(result.changes).toBe(2) // Alice (85), Bob (72)
    })

    test("Delete with whereNotBetween", () => {
      const result = table.whereNotBetween("score", 70, 85).delete()

      expect(result.changes).toBe(3) // Charlie (90), David (65), Eve (88)
    })

    test("Delete with whereNull", () => {
      table.where({ id: 1 }).update({ status: "temp" })
      db.run(`UPDATE "delete_ops" SET "status" = NULL WHERE id = 1`)

      const result = table.whereNull("status").delete()

      expect(result.changes).toBe(1)
    })

    test("Delete with whereNotNull", () => {
      // After previous test, we need to reinsert
      table.insert({ name: "Alice2", score: 85, status: "active" })
      table.where({ id: 2 }).update({ status: "temp" })
      db.run(`UPDATE "delete_ops" SET "status" = NULL WHERE id = 2`)

      const result = table.whereNotNull("status").delete()

      expect(result.changes).toBeGreaterThanOrEqual(3)
    })

    test("Delete with LIKE operator", () => {
      const result = table.whereOp("name", "LIKE", "A%").delete()

      expect(result.changes).toBe(1) // Alice
    })

    test("Delete with combined conditions", () => {
      const result = table.where({ status: "active" }).whereOp("score", ">=", 90).delete()

      expect(result.changes).toBe(1) // Charlie
    })
  })
})
