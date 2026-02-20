import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { column, DB } from "../../src/index"
import { getTableColumns, schemasAreDifferent, tableExists } from "../../src/migration"
import type { ColumnDefinition } from "../../src/types"
import Logger from "@dockstat/logger"

const migrationLog = new Logger("Migration-Test")

describe("Schema Migration", () => {
  let db: DB
  const testDir = join(import.meta.dir, ".migration-test")
  const dbPath = join(testDir, "test.db")

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    db = new DB(dbPath)
  })

  afterEach(() => {
    db.close()
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("Migration detection", () => {
    test("Detect when migration is needed - column added", () => {
      // Create initial table
      db.createTable("users", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      // biome-ignore lint/style/noNonNullAssertion: unit test
      const currentSchema = db.getSchema().find((s) => {
        return s.name === "users"
      })!
      const newColumns: Record<string, ColumnDefinition> = {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text({ unique: true }),
      }

      const needsMigration = schemasAreDifferent(currentSchema, newColumns, {}, migrationLog)
      expect(needsMigration).toBe(true)
    })

    test("Detect when migration is needed - column removed", () => {
      db.createTable("users", {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text(),
      })

      // biome-ignore lint/style/noNonNullAssertion: unit test
      const currentSchema = db.getSchema().find((s) => {
        return s.name === "users"
      })!

      const newColumns: Record<string, ColumnDefinition> = {
        id: column.id(),
        name: column.text({ notNull: true }),
      }

      const needsMigration = schemasAreDifferent(currentSchema, newColumns, {}, migrationLog)
      expect(needsMigration).toBe(true)
    })

    test("Detect when no migration is needed", () => {
      db.createTable("users", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      // biome-ignore lint/style/noNonNullAssertion: unit test
      const currentSchema = db.getSchema().find((s) => {
        return s.name === "users"
      })!

      const newColumns: Record<string, ColumnDefinition> = {
        id: column.id(),
        name: column.text({ notNull: true }),
      }

      const needsMigration = schemasAreDifferent(currentSchema, newColumns, {}, migrationLog)
      expect(needsMigration).toBe(false)
    })

    test("Detect constraint changes", () => {
      db.createTable("users", {
        id: column.id(),
        name: column.text(),
      })

      // biome-ignore lint/style/noNonNullAssertion: unit test
      const currentSchema = db.getSchema().find((s) => {
        return s.name === "users"
      })!
      const newColumns: Record<string, ColumnDefinition> = {
        id: column.id(),
        name: column.text({ notNull: true }), // Added NOT NULL
      }

      const needsMigration = schemasAreDifferent(currentSchema, newColumns, {}, migrationLog)
      expect(needsMigration).toBe(true)
    })
  })

  describe("Automatic migration on createTable", () => {
    test("Migrate table with added column", () => {
      // Create initial table with data
      const table = db.createTable("products", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      table.insert({ name: "Product 1" })
      table.insert({ name: "Product 2" })

      // Create table again with new column (should trigger migration)
      const migratedTable = db.createTable("products", {
        id: column.id(),
        name: column.text({ notNull: true }),
        price: column.real({ default: 0 }),
      })

      // Verify migration occurred
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(2)
      expect(rows[0]).toHaveProperty("price")
      expect(rows[0].price).toBe(0) // Default value
      expect(rows[0].name).toBe("Product 1")
      expect(rows[1].name).toBe("Product 2")
    })

    test("Migrate table with removed column", () => {
      // Create initial table with data
      const table = db.createTable("products", {
        id: column.id(),
        name: column.text({ notNull: true }),
        deprecated: column.text(),
      })

      table.insert({ name: "Product 1", deprecated: "old-value" })
      table.insert({ name: "Product 2", deprecated: "old-value-2" })

      // Create table again without deprecated column
      const migratedTable = db.createTable("products", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      // Verify migration occurred and deprecated column is gone
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(2)
      expect(rows[0]).not.toHaveProperty("deprecated")
      expect(rows[0].name).toBe("Product 1")
      expect(rows[1].name).toBe("Product 2")
    })

    test("Migration disabled", () => {
      // Create initial table
      db.createTable("users", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      const table = db.table("users")
      table.insert({ name: "User 1" })

      // Try to create with different schema but migration disabled
      // When migrate is false and table exists, it should return the existing table
      const existingTable = db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          email: column.text(),
        },
        { migrate: { enabled: false } }
      )

      // Table should remain unchanged
      const rows = existingTable.select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0]).not.toHaveProperty("email")
      expect(rows[0].name).toBe("User 1")
    })

    test("Migration with JSON columns", () => {
      // Create initial table with JSON column
      const table = db.createTable("config", {
        id: column.id(),
        settings: column.json(),
      })

      table.insert({ settings: { theme: "dark", lang: "en" } })

      // Migrate with additional columns
      const migratedTable = db.createTable("config", {
        id: column.id(),
        settings: column.json(),
        metadata: column.json(),
      })

      // Verify JSON data is preserved
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0].settings).toEqual({ theme: "dark", lang: "en" })
      expect(rows[0].metadata).toBeNull()
    })

    test("Migration with Boolean columns", () => {
      // Create initial table with boolean
      const table = db.createTable("users", {
        id: column.id(),
        name: column.text(),
        active: column.boolean({ default: true }),
      })

      table.insert({ name: "User 1", active: true })
      table.insert({ name: "User 2", active: false })

      // Migrate with additional boolean column
      const migratedTable = db.createTable("users", {
        id: column.id(),
        name: column.text(),
        active: column.boolean({ default: true }),
        verified: column.boolean({ default: false }),
      })

      // Verify boolean values are preserved
      const rows = migratedTable.select(["*"]).orderBy("id").asc().all()
      expect(rows).toHaveLength(2)
      expect(rows[0].active).toBe(true)
      expect(rows[0].verified).toBe(false) // Default
      expect(rows[1].active).toBe(false)
      expect(rows[1].verified).toBe(false) // Default
    })

    test("Migration preserves indexes", () => {
      // Create table with index
      db.createTable("users", {
        id: column.id(),
        email: column.text({ notNull: true }),
      })

      db.createIndex("idx_email", "users", ["email"], { unique: true })

      // Migrate table
      db.createTable("users", {
        id: column.id(),
        email: column.text({ notNull: true }),
        name: column.text(),
      })

      // Check that index still exists
      const indexes = db.getIndexes("users")
      const emailIndex = indexes.find((idx) => idx.name === "idx_email")
      expect(emailIndex).toBeDefined()
      expect(emailIndex?.unique).toBe(1)
    })

    test("Migration with foreign keys", () => {
      // Create parent table
      db.createTable("departments", {
        id: column.id(),
        name: column.text({ notNull: true }),
      })

      const deptTable = db.table("departments")
      const deptResult = deptTable.insert({ name: "Engineering" })

      // Create child table with foreign key
      db.createTable("employees", {
        id: column.id(),
        name: column.text({ notNull: true }),
        dept_id: column.foreignKey("departments", "id"),
      })

      const empTable = db.table("employees")
      empTable.insert({ name: "Alice", dept_id: deptResult.insertId })

      // Migrate child table
      db.createTable("employees", {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text(),
        dept_id: column.foreignKey("departments", "id"),
      })

      // Verify data and foreign key relationship preserved
      const employees = db.table("employees").select(["*"]).all()
      expect(employees).toHaveLength(1)
      expect(employees[0].name).toBe("Alice")
      expect(employees[0].dept_id).toBe(deptResult.insertId)
    })

    test("Migration with onConflict option", () => {
      // Create table with unique constraint
      const table = db.createTable("users", {
        id: column.id(),
        email: column.text({ unique: true }),
      })
      table.insert({ email: "user1@example.com" })
      table.insert({ email: "user2@example.com" })
      // Migrate with potential conflict (adding NOT NULL to email)
      const migratedTable = db.createTable(
        "users",
        {
          id: column.id(),
          email: column.text({ unique: true, notNull: true }),
        },
        {
          migrate: {
            onConflict: "ignore",
          },
        }
      )
      // Verify data preserved
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(2)
    })

    test("Migration with onConflict option", () => {
      // Create table without unique constraint
      const table = db.createTable("users", {
        id: column.id(),
        name: column.text(),
        active: column.boolean({ default: true }),
      })

      table.insert({ name: "User 1", active: true })
      table.insert({ name: "User 2", active: false })

      // Migrate with an additional column and a new UNIQUE constraint on `name`,
      // using onConflict: "ignore" so that conflicting rows are skipped.
      const migratedTable = db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text({ unique: true }),
          active: column.boolean({ default: true }),
          email: column.text({ notNull: false }),
        },
        { migrate: { onConflict: "ignore" } }
      )

      const rows = migratedTable.select(["id", "name", "active", "email"]).orderBy("id").all()

      expect(rows).toHaveLength(2)
      expect(rows[0]).toMatchObject({ name: "User 1", active: true })
      expect(rows[1]).toMatchObject({ name: "User 2", active: false })

      // Ensure we can still insert a new row that respects the unique constraint
      migratedTable.insert({ name: "User 3", active: true })

      const rowsAfterInsert = migratedTable.select(["name"]).orderBy("id").all()
      expect(rowsAfterInsert.map((r) => r.name)).toEqual(["User 1", "User 2", "User 3"])
    })

    test("Migration with onConflict replace option", () => {
      // Original table without a unique constraint on `name`
      const table = db.createTable("users", {
        id: column.id(),
        name: column.text(),
        active: column.boolean({ default: true }),
      })

      // Two rows that will conflict once we add a UNIQUE constraint on `name`
      table.insert({ name: "Duplicate", active: true })
      table.insert({ name: "Duplicate", active: false })

      // Migrate to a schema that adds a UNIQUE constraint on `name`,
      // using onConflict: "replace" so that later rows replace earlier ones.
      const migratedTable = db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text({ unique: true }),
          active: column.boolean({ default: true }),
        },
        { migrate: { onConflict: "replace" } }
      )

      const rows = migratedTable.select(["id", "name", "active"]).all()

      // With REPLACE, we expect only one row to survive, corresponding to the last inserted row
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({ name: "Duplicate", active: false })
    })

    test("Migration fails with default onConflict when constraints are violated", () => {
      // Create a table without constraints and insert data that will violate a stricter constraint
      const table = db.createTable("users_fail", {
        id: column.id(),
        email: column.text(),
      })
      table.insert({ email: null })
      // Attempt to migrate by adding a NOT NULL constraint with default onConflict (fail)
      expect(() => {
        db.createTable(
          "users_fail",
          {
            id: column.id(),
            email: column.text({ notNull: true }),
          },
          {
            migrate: {},
          }
        )
      }).toThrow()
      // Verify original data and schema remain unchanged (rollback behavior)
      const rows = db.table("users_fail").select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBeNull()
    })

    test("does not migrate when switching from TEXT to JSON alias", () => {
      // Create table using the underlying TEXT storage type
      const table = db.createTable("config_text", {
        id: column.id(),
        settings: column.text(),
      })

      table.insert({ settings: '{"theme":"dark","lang":"en"}' })

      // Recreate table using the JSON alias
      const migratedTable = db.createTable("config_text", {
        id: column.id(),
        settings: column.json(),
      })

      // Verify data is preserved and interpreted as JSON
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0].settings).toEqual({ theme: "dark", lang: "en" })
    })

    test("does not migrate when switching from INTEGER to BOOLEAN alias", () => {
      // Create table using the underlying INTEGER storage type
      const table = db.createTable("int_to_bool", {
        id: column.id(),
        enabled: column.integer(),
      })

      table.insert({ enabled: 1 })

      // Recreate table using the BOOLEAN alias
      const migratedTable = db.createTable("int_to_bool", {
        id: column.id(),
        enabled: column.boolean(),
      })

      // Verify data is preserved and interpreted as a boolean
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0].enabled).toBe(true)
    })

    test("Migration with custom temp table suffix", () => {
      const table = db.createTable("users", {
        id: column.id(),
        name: column.text(),
      })

      table.insert({ name: "User 1" })

      // Migrate with custom suffix
      db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text(),
          created_at: column.createdAt(),
        },
        {
          migrate: {
            tempTableSuffix: "_custom_temp",
          },
        }
      )

      // Verify migration succeeded
      const rows = db.table("users").select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveProperty("created_at")
    })

    test("Migration without data preservation", () => {
      const table = db.createTable("users", {
        id: column.id(),
        name: column.text(),
      })

      table.insert({ name: "User 1" })
      table.insert({ name: "User 2" })

      // Migrate without preserving data
      const migratedTable = db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text(),
          email: column.text(),
        },
        {
          migrate: {
            preserveData: false,
          },
        }
      )

      // Table should be empty
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(0)
    })

    test("Complex migration scenario", () => {
      // Create initial complex table
      const table = db.createTable("orders", {
        id: column.id(),
        customer_name: column.text({ notNull: true }),
        total: column.real({ notNull: true }),
        status: column.text({ default: "pending" }),
        metadata: column.json(),
        is_paid: column.boolean({ default: false }),
      })

      table.insert({
        customer_name: "John Doe",
        total: 99.99,
        status: "completed",
        metadata: { notes: "Rush delivery" },
        is_paid: true,
      })

      table.insert({
        customer_name: "Jane Smith",
        total: 149.5,
        metadata: { discount: 10 },
        is_paid: false,
      })

      // Complex migration: add columns, remove status, change types
      const migratedTable = db.createTable("orders", {
        id: column.id(),
        customer_name: column.text({ notNull: true }),
        customer_email: column.text(), // New column
        total: column.real({ notNull: true }),
        // status removed
        metadata: column.json(),
        is_paid: column.boolean({ default: false }),
        created_at: column.createdAt(), // New column
        updated_at: column.updatedAt(), // New column
      })

      // Verify complex migration
      const rows = migratedTable.select(["*"]).orderBy("id").asc().all()
      expect(rows).toHaveLength(2)

      // First order
      expect(rows[0].customer_name).toBe("John Doe")
      expect(rows[0].total).toBe(99.99)
      expect(rows[0]).not.toHaveProperty("status")
      expect(rows[0].metadata).toEqual({ notes: "Rush delivery" })
      expect(rows[0].is_paid).toBe(true)
      expect(rows[0].customer_email).toBeNull()
      expect(rows[0]).toHaveProperty("created_at")

      // Second order
      expect(rows[1].customer_name).toBe("Jane Smith")
      expect(rows[1].total).toBe(149.5)
      expect(rows[1].metadata).toEqual({ discount: 10 })
      expect(rows[1].is_paid).toBe(false)
    })

    test("Migration with table constraints", () => {
      // Create table with constraints
      db.createTable(
        "products",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          price: column.real({ notNull: true }),
        },
        {
          constraints: {
            check: ["price > 0"],
          },
        }
      )

      const table = db.table("products")
      table.insert({ name: "Product 1", price: 10.99 })

      // Migrate with modified constraints
      const migratedTable = db.createTable(
        "products",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          price: column.real({ notNull: true }),
          stock: column.integer({ default: 0 }),
        },
        {
          constraints: {
            check: ["price > 0", "stock >= 0"],
          },
        }
      )

      // Verify migration with constraints
      const rows = migratedTable.select(["*"]).all()
      expect(rows).toHaveLength(1)
      expect(rows[0].stock).toBe(0)

      // Test constraints still work
      expect(() => {
        migratedTable.insert({ name: "Invalid", price: -1, stock: 10 })
      }).toThrow()
    })
  })

  describe("Helper functions", () => {
    test("tableExists function", () => {
      expect(tableExists(db.getDb(), "nonexistent")).toBe(false)

      db.createTable("test_table", {
        id: column.id(),
      })

      expect(tableExists(db.getDb(), "test_table")).toBe(true)
    })

    test("getTableColumns function", () => {
      db.createTable("users", {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text({ unique: true }),
      })

      const columns = getTableColumns(db.getDb(), "users")

      expect(columns).toHaveLength(3)

      const idColumn = columns.find((col) => col.name === "id")
      expect(idColumn).toBeDefined()
      expect(idColumn?.pk).toBe(1)

      const nameColumn = columns.find((col) => col.name === "name")
      expect(nameColumn).toBeDefined()
      expect(nameColumn?.notnull).toBe(1)

      const emailColumn = columns.find((col) => col.name === "email")
      expect(emailColumn).toBeDefined()
    })
  })

  test("does not automatically migrate temporary tables", () => {
    const tempTable = db.createTable(
      "temp_products",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
      },
      { temporary: true }
    )

    tempTable.insert({ name: "Temp Product 1" })

    // Calling createTable again with a different schema for the same
    // temporary table should *not* trigger automatic migration.
    const tempTableSameName = db.createTable(
      "temp_products",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
        price: column.integer({ notNull: true }),
      },
      { temporary: true }
    )

    // We expect the underlying table schema to remain unchanged, so attempts
    // to use the newly declared column should fail.
    expect(() => tempTableSameName.insert({ name: "Temp Product 2", price: 100 })).toThrow()
  })

  test('does not automatically migrate ":memory:" tables', () => {
    const memoryTable = db.createTable(":memory:", {
      id: column.id(),
      name: column.text({ notNull: true }),
    })

    memoryTable.insert({ name: "Memory Product 1" })

    // Calling createTable again with a different schema for the same
    // in-memory table should *not* trigger automatic migration.
    const memoryTableSameName = db.createTable(":memory:", {
      id: column.id(),
      name: column.text({ notNull: true }),
      price: column.integer({ notNull: true }),
    })

    // As above, if automatic migration is disabled for ":memory:" tables,
    // this insert using the new column should fail.
    expect(() => memoryTableSameName.insert({ name: "Memory Product 2", price: 100 })).toThrow()
  })
})
