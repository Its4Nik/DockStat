import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { column, DB } from "../src/index"

/**
 * Comprehensive tests for DB class operations including:
 * - Database creation and configuration
 * - Index management (create/drop)
 * - Table management (create/drop)
 * - Transaction management (begin/commit/rollback)
 * - Savepoint operations
 * - Database maintenance (vacuum, analyze, integrity check)
 * - Schema introspection
 * - Pragma operations
 * - Raw SQL execution
 */

describe("Database creation and configuration", () => {
  test("Create in-memory database", () => {
    const db = new DB(":memory:")
    expect(db.getPath()).toBe(":memory:")
    db.close()
  })

  test("Create file-based database", () => {
    const testDir = join(import.meta.dir, ".db-test")
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    const dbPath = join(testDir, "test.db")
    const db = new DB(dbPath)

    expect(db.getPath()).toBe(dbPath)
    expect(existsSync(dbPath)).toBe(true)

    db.close()
    rmSync(testDir, { recursive: true, force: true })
  })

  test("Database with pragma options", () => {
    const db = new DB(":memory:", {
      pragmas: [
        ["cache_size", -2000],
        ["synchronous", "NORMAL"],
      ],
    })

    // Verify cache_size pragma was applied
    const cacheSize = db.pragma("cache_size")
    expect(cacheSize).toBe(-2000)

    db.close()
  })
})

describe("Table management", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")
  })

  afterAll(() => {
    db.close()
  })

  test("Create table with schema object", () => {
    const table = db.createTable<{
      id: number
      name: string
      email: string
    }>(
      "users",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text({ notNull: true, unique: true }),
      },
      { ifNotExists: true }
    )

    expect(table).toBeDefined()

    // Verify table exists
    const info = db.getTableInfo("users")
    expect(info.length).toBe(3)
  })

  test("Create table with IF NOT EXISTS", () => {
    // Should not throw even if table exists
    expect(() => {
      db.createTable(
        "users",
        {
          id: column.id(),
          name: column.text({ notNull: true }),
          email: column.text({ notNull: true }),
        },
        { ifNotExists: true }
      )
    }).not.toThrow()
  })

  test("Create temporary table", () => {
    const tempTable = db.createTable<{
      id: number
      value: string
    }>(
      "temp_data",
      {
        id: column.id(),
        value: column.text(),
      },
      { temporary: true, ifNotExists: true }
    )

    expect(tempTable).toBeDefined()
  })

  test("Create table WITHOUT ROWID", () => {
    const table = db.createTable<{
      key: string
      value: string
    }>(
      "keyvalue",
      {
        key: column.text({ primaryKey: true, notNull: true }),
        value: column.text({ notNull: true }),
      },
      { withoutRowId: true, ifNotExists: true }
    )

    expect(table).toBeDefined()
  })

  test("Drop table", () => {
    db.createTable(
      "to_drop",
      {
        id: column.id(),
      },
      { ifNotExists: true }
    )

    db.dropTable("to_drop")

    // Table should no longer exist
    const schema = db.getSchema()
    const tableExists = schema.some((s: { name: string }) => s.name === "to_drop")
    expect(tableExists).toBe(false)
  })

  test("Drop table with IF EXISTS", () => {
    // Should not throw even if table doesn't exist
    expect(() => {
      db.dropTable("nonexistent_table", { ifExists: true })
    }).not.toThrow()
  })
})

describe("Index management", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      email: string
      name: string
      category: string
    }>(
      "indexed_table",
      {
        id: column.id(),
        email: column.text({ notNull: true }),
        name: column.text({ notNull: true }),
        category: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Create index on single column", () => {
    // Signature: createIndex(indexName, tableName, columns, options)
    db.createIndex("idx_email", "indexed_table", ["email"], {
      ifNotExists: true,
    })

    const indexes = db.getIndexes("indexed_table")
    expect(indexes.some((idx: { name: string }) => idx.name === "idx_email")).toBe(true)
  })

  test("Create unique index", () => {
    db.createIndex("idx_name_unique", "indexed_table", ["name"], {
      unique: true,
      ifNotExists: true,
    })

    const indexes = db.getIndexes("indexed_table")
    expect(
      indexes.some((idx: { name: string; unique?: number }) => idx.name === "idx_name_unique")
    ).toBe(true)
  })

  test("Create composite index", () => {
    db.createIndex("idx_name_category", "indexed_table", ["name", "category"], {
      ifNotExists: true,
    })

    const indexes = db.getIndexes("indexed_table")
    expect(indexes.some((idx: { name: string }) => idx.name === "idx_name_category")).toBe(true)
  })

  test("Create index with IF NOT EXISTS", () => {
    // Should not throw even if index exists
    expect(() => {
      db.createIndex("idx_email", "indexed_table", ["email"], {
        ifNotExists: true,
      })
    }).not.toThrow()
  })

  test("Drop index", () => {
    db.createIndex("idx_to_drop", "indexed_table", ["category"], {
      ifNotExists: true,
    })

    db.dropIndex("idx_to_drop")

    const indexes = db.getIndexes("indexed_table")
    expect(indexes.some((idx: { name: string }) => idx.name === "idx_to_drop")).toBe(false)
  })

  test("Drop index with IF EXISTS", () => {
    // Should not throw even if index doesn't exist
    expect(() => {
      db.dropIndex("nonexistent_index", { ifExists: true })
    }).not.toThrow()
  })
})

describe("Transaction management", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      value: number
    }>(
      "tx_test",
      {
        id: column.id(),
        value: column.integer({ default: 0 }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Begin and commit transaction", () => {
    db.begin()

    const table = db.table<{ id: number; value: number }>("tx_test", {})
    table.insert({ value: 100 })

    db.commit()

    const result = table.select(["*"]).where({ value: 100 }).first()
    expect(result).not.toBeNull()
  })

  test("Begin and rollback transaction", () => {
    const table = db.table<{ id: number; value: number }>("tx_test", {})
    const countBefore = table.count()

    db.begin()
    table.insert({ value: 999 })
    db.rollback()

    const countAfter = table.count()
    expect(countAfter).toBe(countBefore)
  })

  test("Begin with DEFERRED mode", () => {
    expect(() => {
      db.begin("DEFERRED")
      db.commit()
    }).not.toThrow()
  })

  test("Begin with IMMEDIATE mode", () => {
    expect(() => {
      db.begin("IMMEDIATE")
      db.commit()
    }).not.toThrow()
  })

  test("Begin with EXCLUSIVE mode", () => {
    expect(() => {
      db.begin("EXCLUSIVE")
      db.commit()
    }).not.toThrow()
  })

  test("Transaction helper method", () => {
    const table = db.table<{ id: number; value: number }>("tx_test", {})

    // The db.transaction method wraps bun:sqlite transaction
    // It takes a function and returns the result
    const result = db.transaction(() => {
      table.insert({ value: 200 })
      table.insert({ value: 201 })
      return "success"
    })

    expect(result).toBe("success")

    const inserted = table.whereIn("value", [200, 201]).count()
    expect(inserted).toBe(2)
  })
})

describe("Savepoint operations", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      name: string
    }>(
      "savepoint_test",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Create savepoint", () => {
    db.begin()
    expect(() => {
      db.savepoint("sp1")
    }).not.toThrow()
    db.commit()
  })

  test("Release savepoint", () => {
    db.begin()
    db.savepoint("sp2")

    const table = db.table<{ id: number; name: string }>("savepoint_test", {})
    table.insert({ name: "Test" })

    db.releaseSavepoint("sp2")
    db.commit()

    const result = table.where({ name: "Test" }).first()
    expect(result).not.toBeNull()
  })

  test("Rollback to savepoint", () => {
    const table = db.table<{ id: number; name: string }>("savepoint_test", {})
    const countBefore = table.count()

    db.begin()
    db.savepoint("sp3")

    table.insert({ name: "WillBeRolledBack" })

    db.rollbackToSavepoint("sp3")
    db.commit()

    const countAfter = table.count()
    expect(countAfter).toBe(countBefore)
  })
})

describe("Database maintenance operations", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      data: string
    }>(
      "maintenance_test",
      {
        id: column.id(),
        data: column.text(),
      },
      { ifNotExists: true }
    )

    // Insert and delete data to create fragmentation
    const table = db.table<{ id: number; data: string }>("maintenance_test", {})
    for (let i = 0; i < 100; i++) {
      table.insert({ data: `Data ${i}` })
    }
    table.whereOp("id", "<", 50).delete()
  })

  afterAll(() => {
    db.close()
  })

  test("Vacuum database", () => {
    expect(() => {
      db.vacuum()
    }).not.toThrow()
  })

  test("Analyze database", () => {
    expect(() => {
      db.analyze()
    }).not.toThrow()
  })

  test("Analyze specific table", () => {
    expect(() => {
      db.analyze("maintenance_test")
    }).not.toThrow()
  })

  test("Integrity check passes", () => {
    const result = db.integrityCheck()
    expect(result).toBeDefined()

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty("integrity_check")
  })
})

describe("Schema introspection", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      name: string
      email: string
      created_at: number
    }>(
      "schema_test",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
        email: column.text({ notNull: true, unique: true }),
        created_at: column.timestamp({ notNull: false }),
      },
      { ifNotExists: true }
    )

    db.createIndex("idx_schema_email", "schema_test", ["email"], {
      unique: true,
    })

    // Create a table with foreign key
    db.createTable<{
      id: number
      user_id: number
      content: string
    }>(
      "posts",
      {
        id: column.id(),
        user_id: column.foreignKey("schema_test", "id", {
          onDelete: "CASCADE",
        }),
        content: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Get full database schema", () => {
    const schema = db.getSchema()

    expect(Array.isArray(schema)).toBe(true)
    expect(schema.some((s: { name: string }) => s.name === "schema_test")).toBe(true)
    expect(schema.some((s: { name: string }) => s.name === "posts")).toBe(true)
  })

  test("Get table info", () => {
    const info = db.getTableInfo("schema_test")

    expect(Array.isArray(info)).toBe(true)
    expect(info.length).toBe(4)

    const idCol = info.find((col: { name: string }) => col.name === "id")
    expect(idCol).toBeDefined()
    expect(idCol?.pk).toBe(1)

    const nameCol = info.find((col: { name: string }) => col.name === "name")
    expect(nameCol).toBeDefined()
    expect(nameCol?.notnull).toBe(1)
  })

  test("Get indexes", () => {
    const indexes = db.getIndexes("schema_test")

    expect(Array.isArray(indexes)).toBe(true)
    expect(indexes.some((idx: { name: string }) => idx.name === "idx_schema_email")).toBe(true)
  })

  test("Get foreign keys", () => {
    const fks = db.getForeignKeys("posts")

    expect(Array.isArray(fks)).toBe(true)
    expect(fks.length).toBeGreaterThan(0)

    const userFk = fks.find((fk: { from: string }) => fk.from === "user_id")
    expect(userFk).toBeDefined()
    expect(userFk?.table).toBe("schema_test")
    expect(userFk?.to).toBe("id")
  })
})

describe("Pragma operations", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")
  })

  afterAll(() => {
    db.close()
  })

  test("Get pragma value", () => {
    const pageSize = db.pragma("page_size")
    expect(typeof pageSize).toBe("number")
    expect(pageSize).toBeGreaterThan(0)
  })

  test("Set pragma value", () => {
    db.pragma("cache_size", -2000)
    const cacheSize = db.pragma("cache_size")
    expect(cacheSize).toBe(-2000)
  })

  test("Get journal_mode pragma", () => {
    const journalMode = db.pragma("journal_mode")
    expect(typeof journalMode).toBe("string")
  })

  test("Get foreign_keys pragma", () => {
    const foreignKeys = db.pragma("foreign_keys")
    expect([0, 1]).toContain(foreignKeys as number)
  })
})

describe("Raw SQL execution", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      name: string
    }>(
      "raw_test",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Run raw SQL statement", () => {
    // db.run takes just the SQL string - values must be embedded
    db.run('INSERT INTO "raw_test" ("name") VALUES (\'Test User\')')

    const table = db.table<{ id: number; name: string }>("raw_test", {})
    const result = table.where({ name: "Test User" }).first()
    expect(result).not.toBeNull()
  })

  test("Prepare and execute statement with parameters", () => {
    const stmt = db.prepare('SELECT * FROM "raw_test" WHERE "name" = ?')

    const result = stmt.get("Test User") as { name: string } | null
    expect(result).not.toBeNull()
    expect(result?.name).toBe("Test User")
  })

  test("Run multiple SQL statements", () => {
    db.run('INSERT INTO "raw_test" ("name") VALUES (\'User A\')')
    db.run('INSERT INTO "raw_test" ("name") VALUES (\'User B\')')

    const stmt = db.prepare('SELECT COUNT(*) as count FROM "raw_test"')
    const result = stmt.get() as { count: number }

    expect(result.count).toBeGreaterThanOrEqual(3)
  })
})

describe("Table access via db.table()", () => {
  let db: DB

  beforeAll(() => {
    db = new DB(":memory:")

    db.createTable<{
      id: number
      name: string
      data: unknown
      active: boolean
    }>(
      "table_access",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
        data: column.json({ notNull: false }),
        active: column.boolean({ default: true }),
      },
      { ifNotExists: true }
    )
  })

  afterAll(() => {
    db.close()
  })

  test("Access existing table with parser", () => {
    const table = db.table<{
      id: number
      name: string
      data: unknown
      active: boolean
    }>("table_access", {
      JSON: ["data"],
      BOOLEAN: ["active"],
    })

    table.insert({ name: "Test", data: { key: "value" }, active: true })

    const result = table.where({ name: "Test" }).first()

    expect(result).not.toBeNull()
    expect(result?.data).toEqual({ key: "value" })
    expect(result?.active).toBe(true)
  })

  test("Table reference maintains parser configuration", () => {
    const table = db.table<{
      id: number
      name: string
      data: unknown
      active: boolean
    }>("table_access", {
      JSON: ["data"],
      BOOLEAN: ["active"],
    })

    // Multiple operations should all use parser
    table.insert({ name: "Another", data: { nested: { deep: true } }, active: false })

    const all = table.select(["*"]).all()
    expect(all.length).toBeGreaterThan(0)

    // All results should have transformed data
    for (const row of all) {
      if (row.data !== null) {
        expect(typeof row.data).toBe("object")
      }
      if (row.active !== null) {
        expect(typeof row.active).toBe("boolean")
      }
    }
  })
})

describe("Database getDb() access", () => {
  test("getDb() returns underlying bun:sqlite Database", () => {
    const db = new DB(":memory:")

    const rawDb = db.getDb()
    expect(rawDb).toBeDefined()

    // Can execute raw queries on underlying db
    rawDb.run("CREATE TABLE direct_test (id INTEGER PRIMARY KEY)")
    const tables = rawDb.query("SELECT name FROM sqlite_master WHERE type='table'").all()

    expect(tables.some((t: unknown) => (t as { name: string }).name === "direct_test")).toBe(true)

    db.close()
  })
})
