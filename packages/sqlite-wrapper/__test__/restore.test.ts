import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { column, DB } from "../index"

/**
 * Tests for database restore functionality including:
 * - Restore from backup to same database
 * - Restore from backup to different path
 * - Error handling for missing backup files
 * - Data integrity after restore
 */

describe("Restore to same database tests", () => {
  const restoreTestDir = join(import.meta.dir, ".restore-same-test")

  beforeAll(() => {
    if (!existsSync(restoreTestDir)) {
      mkdirSync(restoreTestDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(restoreTestDir)) {
      rmSync(restoreTestDir, { recursive: true, force: true })
    }
  })

  test("Restore from backup restores original data", () => {
    const originalPath = join(restoreTestDir, "original.db")
    const db = new DB(originalPath)

    // Create table and insert initial data
    const table = db.createTable<{ id: number; value: string }>(
      "test",
      {
        id: column.id(),
        value: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    table.insert({ value: "original data" })

    // Create backup
    const backupPath = join(restoreTestDir, "backup.db")
    db.backup(backupPath)

    // Modify original - add more data
    table.insert({ value: "new data after backup" })
    table.insert({ value: "more new data" })

    const beforeRestore = table.select(["*"]).all()
    expect(beforeRestore.length).toBe(3)

    // Restore from backup
    db.restore(backupPath)

    // Check data is restored to original state
    const afterRestore = db.table<{ id: number; value: string }>("test", {}).select(["*"]).all()
    expect(afterRestore.length).toBe(1)
    expect(afterRestore[0].value).toBe("original data")

    db.close()
  })

  test("Restore preserves table structure", () => {
    const dbPath = join(restoreTestDir, "structure.db")
    const db = new DB(dbPath)

    // Create table with specific structure
    const table = db.createTable<{ id: number; name: string; active: boolean }>(
      "users",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
        active: column.boolean({ default: true }),
      },
      { ifNotExists: true }
    )

    table.insert({ name: "Alice", active: true })
    table.insert({ name: "Bob", active: false })

    // Backup
    const backupPath = join(restoreTestDir, "structure_backup.db")
    db.backup(backupPath)

    // Modify data
    table.where({ name: "Alice" }).update({ active: false })
    table.insert({ name: "Charlie", active: true })

    // Restore
    db.restore(backupPath)

    // Verify structure and data
    const restored = db
      .table<{ id: number; name: string; active: boolean }>("users", { BOOLEAN: ["active"] })
      .select(["*"])
      .all()

    expect(restored.length).toBe(2)
    expect(restored.find((u) => u.name === "Alice")?.active).toBe(true)
    expect(restored.find((u) => u.name === "Bob")?.active).toBe(false)
    expect(restored.find((u) => u.name === "Charlie")).toBeUndefined()

    db.close()
  })

  test("Restore works with JSON columns", () => {
    const dbPath = join(restoreTestDir, "json.db")
    const db = new DB(dbPath)

    const table = db.createTable<{ id: number; data: unknown }>("json_test", {
      id: column.id(),
      data: column.json(),
    })

    const originalData = { nested: { deep: { value: 42 } }, array: [1, 2, 3] }
    table.insert({ data: originalData })

    // Backup
    const backupPath = join(restoreTestDir, "json_backup.db")
    db.backup(backupPath)

    // Modify
    table.where({ id: 1 }).update({ data: { changed: true } })

    // Restore
    db.restore(backupPath)

    // Verify JSON data is correctly restored
    const restored = db
      .table<{ id: number; data: unknown }>("json_test", { JSON: ["data"] })
      .select(["*"])
      .where({ id: 1 })
      .first()

    expect(restored?.data).toEqual(originalData)

    db.close()
  })
})

describe("Restore to different path tests", () => {
  const restoreDiffDir = join(import.meta.dir, ".restore-diff-test")

  beforeAll(() => {
    if (!existsSync(restoreDiffDir)) {
      mkdirSync(restoreDiffDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(restoreDiffDir)) {
      rmSync(restoreDiffDir, { recursive: true, force: true })
    }
  })

  test("Restore to different path creates new database file", () => {
    const sourcePath = join(restoreDiffDir, "source.db")
    const targetPath = join(restoreDiffDir, "target.db")

    const sourceDb = new DB(sourcePath)
    sourceDb.createTable<{ id: number; value: string }>(
      "test",
      {
        id: column.id(),
        value: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    sourceDb.table<{ id: number; value: string }>("test", {}).insert({ value: "source data" })

    // Create backup
    const backupPath = join(restoreDiffDir, "source_backup.db")
    sourceDb.backup(backupPath)

    // Restore to different path
    sourceDb.restore(backupPath, targetPath)

    // Verify target file exists
    expect(existsSync(targetPath)).toBe(true)

    // Verify target has correct data
    const targetDb = new DB(targetPath)
    const results = targetDb.table<{ id: number; value: string }>("test", {}).select(["*"]).all()

    expect(results.length).toBe(1)
    expect(results[0].value).toBe("source data")

    sourceDb.close()
    targetDb.close()
  })

  test("Restore to different path does not affect original database", () => {
    const sourcePath = join(restoreDiffDir, "source2.db")
    const targetPath = join(restoreDiffDir, "target2.db")

    const sourceDb = new DB(sourcePath)
    const table = sourceDb.createTable<{ id: number; value: string }>(
      "test",
      {
        id: column.id(),
        value: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    table.insert({ value: "initial" })

    // Backup
    const backupPath = join(restoreDiffDir, "backup2.db")
    sourceDb.backup(backupPath)

    // Add more data to source
    table.insert({ value: "added after backup" })

    // Restore to different path
    sourceDb.restore(backupPath, targetPath)

    // Source should still have both records
    const sourceResults = table.select(["*"]).all()
    expect(sourceResults.length).toBe(2)

    // Target should only have the backed up data
    const targetDb = new DB(targetPath)
    const targetResults = targetDb
      .table<{ id: number; value: string }>("test", {})
      .select(["*"])
      .all()
    expect(targetResults.length).toBe(1)

    sourceDb.close()
    targetDb.close()
  })
})

describe("Restore error handling tests", () => {
  const errorTestDir = join(import.meta.dir, ".restore-error-test")

  beforeAll(() => {
    if (!existsSync(errorTestDir)) {
      mkdirSync(errorTestDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(errorTestDir)) {
      rmSync(errorTestDir, { recursive: true, force: true })
    }
  })

  test("Restore throws error for non-existent backup file", () => {
    const dbPath = join(errorTestDir, "error.db")
    const db = new DB(dbPath)

    const nonExistentBackup = join(errorTestDir, "does_not_exist.db")

    expect(() => db.restore(nonExistentBackup)).toThrow("Backup file not found")

    db.close()
  })

  test("Restore to :memory: path throws error", () => {
    const dbPath = join(errorTestDir, "source_error.db")
    const db = new DB(dbPath)

    // Create a valid backup first
    db.createTable<{ id: number }>("test", { id: column.id() }, { ifNotExists: true })
    const backupPath = join(errorTestDir, "valid_backup.db")
    db.backup(backupPath)

    // Try to restore to :memory:
    expect(() => db.restore(backupPath, ":memory:")).toThrow(
      "Cannot restore to an in-memory database"
    )

    db.close()
  })
})

describe("Restore with auto-backup integration tests", () => {
  const integrationTestDir = join(import.meta.dir, ".restore-integration-test")

  beforeAll(() => {
    if (!existsSync(integrationTestDir)) {
      mkdirSync(integrationTestDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(integrationTestDir)) {
      rmSync(integrationTestDir, { recursive: true, force: true })
    }
  })

  test("Restore from auto-backup works correctly", () => {
    const dbPath = join(integrationTestDir, "auto.db")
    const backupDir = join(integrationTestDir, "backups")

    const db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupDir,
        maxBackups: 5,
        filenamePrefix: "auto",
      },
    })

    // Create table and add data
    const table = db.createTable<{ id: number; value: string }>(
      "test",
      {
        id: column.id(),
        value: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    table.insert({ value: "data before manual backup" })

    // Create a manual backup point
    const manualBackupPath = join(integrationTestDir, "manual_restore_point.db")
    db.backup(manualBackupPath)

    // Add more data
    table.insert({ value: "data after manual backup 1" })
    table.insert({ value: "data after manual backup 2" })

    // Verify we have 3 records
    expect(table.select(["*"]).all().length).toBe(3)

    // Restore from manual backup point
    db.restore(manualBackupPath)

    // Should only have 1 record now
    const restored = db.table<{ id: number; value: string }>("test", {}).select(["*"]).all()
    expect(restored.length).toBe(1)
    expect(restored[0].value).toBe("data before manual backup")

    db.close()
  })

  test("Can restore from listed backup", () => {
    const dbPath = join(integrationTestDir, "listed.db")
    const backupDir = join(integrationTestDir, "listed_backups")

    const db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupDir,
        maxBackups: 5,
        filenamePrefix: "listed",
      },
    })

    // Create table
    const table = db.createTable<{ id: number; counter: number }>(
      "counters",
      {
        id: column.id(),
        counter: column.integer({ default: 0 }),
      },
      { ifNotExists: true }
    )

    table.insert({ counter: 100 })

    // Create a backup AFTER the table and data exist
    // (The initial auto-backup was created before the table existed)
    db.backup()

    // Get the backup we just created
    const backups = db.listBackups()
    expect(backups.length).toBeGreaterThan(0)

    const backupWithData = backups[0] // Most recent backup (sorted newest first)

    // Modify data
    table.where({ id: 1 }).update({ counter: 999 })

    // Verify modification
    expect(table.select(["*"]).where({ id: 1 }).first()?.counter).toBe(999)

    // Restore from the backup that has our data
    db.restore(backupWithData.path)

    // Should be back to original value
    const restored = db
      .table<{ id: number; counter: number }>("counters", {})
      .select(["*"])
      .where({ id: 1 })
      .first()
    expect(restored?.counter).toBe(100)

    db.close()
  })
})
