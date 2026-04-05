import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { column, DB } from "../src/index"

/**
 * Tests for backup functionality including:
 * - Manual backup creation
 * - Backup to custom path
 * - Auto-backup with retention policy
 * - Listing backups
 * - Stopping auto-backup
 */

describe("Manual backup tests", () => {
  const testBackupDir = join(import.meta.dir, ".manual-backup-test")
  let dbPath: string
  let db: DB

  beforeAll(() => {
    // Create a temporary directory for test backups
    if (!existsSync(testBackupDir)) {
      mkdirSync(testBackupDir, { recursive: true })
    }

    // Create a test database file
    dbPath = join(testBackupDir, "test.db")
    db = new DB(dbPath)

    // Create a test table with some data
    const table = db.createTable<{ id: number; name: string }>(
      "backup_test",
      {
        id: column.id(),
        name: column.text({ notNull: true }),
      },
      { ifNotExists: true }
    )

    // Insert some test data
    table.insert({ name: "Test User 1" })
    table.insert({ name: "Test User 2" })
  })

  afterAll(() => {
    // Clean up
    db.close()
    if (existsSync(testBackupDir)) {
      rmSync(testBackupDir, { recursive: true, force: true })
    }
  })

  test("Manual backup creates a file", () => {
    const backupPath = db.backup()

    expect(existsSync(backupPath)).toBe(true)
    expect(backupPath).toContain("_backup_")
    expect(backupPath).toEndWith(".db")
  })

  test("Manual backup to custom path", () => {
    const customPath = join(testBackupDir, "custom_backup.db")
    const backupPath = db.backup(customPath)

    expect(backupPath).toBe(customPath)
    expect(existsSync(customPath)).toBe(true)
  })

  test("Backup file contains correct data", () => {
    const backupPath = join(testBackupDir, "data_check_backup.db")
    db.backup(backupPath)

    // Open the backup and verify data
    const backupDb = new DB(backupPath)
    const results = backupDb
      .table<{ id: number; name: string }>("backup_test", {})
      .select(["*"])
      .all()

    expect(results.length).toBe(2)
    expect(results[0].name).toBe("Test User 1")
    expect(results[1].name).toBe("Test User 2")

    backupDb.close()
  })

  test("Multiple backups create separate files", () => {
    const backup1 = join(testBackupDir, "backup1.db")
    const backup2 = join(testBackupDir, "backup2.db")

    db.backup(backup1)
    db.backup(backup2)

    expect(existsSync(backup1)).toBe(true)
    expect(existsSync(backup2)).toBe(true)
  })
})

describe("In-memory database backup tests", () => {
  test("In-memory database backup should throw", () => {
    const memDb = new DB(":memory:")

    expect(() => memDb.backup()).toThrow("Cannot backup an in-memory database")

    memDb.close()
  })

  test("In-memory database backup to custom path should also throw", () => {
    const memDb = new DB(":memory:")

    expect(() => memDb.backup("/tmp/test.db")).toThrow("Cannot backup an in-memory database")

    memDb.close()
  })
})

describe("getPath tests", () => {
  const testDir = join(import.meta.dir, ".getpath-test")

  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("getPath returns correct path for file database", () => {
    const dbPath = join(testDir, "getpath.db")
    const db = new DB(dbPath)

    expect(db.getPath()).toBe(dbPath)

    db.close()
  })

  test("getPath returns :memory: for in-memory database", () => {
    const memDb = new DB(":memory:")

    expect(memDb.getPath()).toBe(":memory:")

    memDb.close()
  })
})

describe("Auto-backup with retention tests", () => {
  const autoBackupDir = join(import.meta.dir, ".auto-backup-retention-test")
  let db: DB

  beforeAll(() => {
    // Clean up any previous test artifacts
    if (existsSync(autoBackupDir)) {
      rmSync(autoBackupDir, { recursive: true, force: true })
    }
    mkdirSync(autoBackupDir, { recursive: true })
  })

  afterAll(() => {
    if (db) {
      db.close()
    }
    if (existsSync(autoBackupDir)) {
      rmSync(autoBackupDir, { recursive: true, force: true })
    }
  })

  test("Auto-backup creates initial backup on database open", () => {
    const dbPath = join(autoBackupDir, "auto.db")
    const backupSubDir = join(autoBackupDir, "backups")

    db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupSubDir,
        intervalMs: 60000, // 1 minute (we won't wait this long)
        maxBackups: 3,
        filenamePrefix: "auto_test",
      },
    })

    // Check that initial backup was created
    const backups = db.listBackups()
    expect(backups.length).toBeGreaterThanOrEqual(1)
    expect(backups[0].filename).toContain("auto_test")
  })

  test("listBackups returns backup info with correct properties", () => {
    const backups = db.listBackups()

    expect(backups.length).toBeGreaterThan(0)

    const backup = backups[0]
    expect(backup).toHaveProperty("filename")
    expect(backup).toHaveProperty("path")
    expect(backup).toHaveProperty("size")
    expect(backup).toHaveProperty("created")

    expect(typeof backup.filename).toBe("string")
    expect(typeof backup.path).toBe("string")
    expect(typeof backup.size).toBe("number")
    expect(backup.created).toBeInstanceOf(Date)
  })

  test("listBackups returns backups sorted by date (newest first)", () => {
    // Create a few more backups
    db.backup()
    db.backup()

    const backups = db.listBackups()

    if (backups.length >= 2) {
      // Verify sorted by date descending
      for (let i = 0; i < backups.length - 1; i++) {
        expect(backups[i].created.getTime()).toBeGreaterThanOrEqual(
          backups[i + 1].created.getTime()
        )
      }
    }
  })

  test("Retention policy removes old backups beyond maxBackups", () => {
    // Create more backups than the limit (maxBackups = 3)
    db.backup()
    db.backup()
    db.backup()
    db.backup()

    const backups = db.listBackups()

    // Should have at most maxBackups (3) backups
    expect(backups.length).toBeLessThanOrEqual(3)
  })

  test("stopAutoBackup stops the timer without error", () => {
    // Should not throw
    expect(() => db.stopAutoBackup()).not.toThrow()
  })

  test("stopAutoBackup can be called multiple times safely", () => {
    expect(() => {
      db.stopAutoBackup()
      db.stopAutoBackup()
      db.stopAutoBackup()
    }).not.toThrow()
  })
})

describe("Auto-backup configuration tests", () => {
  const configTestDir = join(import.meta.dir, ".auto-backup-config-test")

  beforeAll(() => {
    if (!existsSync(configTestDir)) {
      mkdirSync(configTestDir, { recursive: true })
    }
  })

  afterAll(() => {
    if (existsSync(configTestDir)) {
      rmSync(configTestDir, { recursive: true, force: true })
    }
  })

  test("Auto-backup with custom filename prefix", () => {
    const dbPath = join(configTestDir, "prefix_test.db")
    const backupDir = join(configTestDir, "prefix_backups")

    const db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupDir,
        filenamePrefix: "my_custom_prefix",
        maxBackups: 5,
      },
    })

    const backups = db.listBackups()
    expect(backups.length).toBeGreaterThan(0)
    expect(backups[0].filename).toContain("my_custom_prefix")

    db.close()
  })

  test("Auto-backup creates directory if it does not exist", () => {
    const dbPath = join(configTestDir, "dir_create_test.db")
    const backupDir = join(configTestDir, "new_backup_directory")

    // Ensure directory doesn't exist
    if (existsSync(backupDir)) {
      rmSync(backupDir, { recursive: true, force: true })
    }

    const db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupDir,
        maxBackups: 5,
      },
    })

    expect(existsSync(backupDir)).toBe(true)

    db.close()
  })

  test("Auto-backup disabled for in-memory database", () => {
    // This should not throw, just log a warning
    const memDb = new DB(":memory:", {
      autoBackup: {
        enabled: true,
        directory: configTestDir,
        maxBackups: 5,
      },
    })

    // listBackups should return empty for in-memory DB with auto-backup
    // since auto-backup was not actually set up
    const backups = memDb.listBackups()
    expect(backups.length).toBe(0)

    memDb.close()
  })

  test("Closing database stops auto-backup", () => {
    const dbPath = join(configTestDir, "close_test.db")
    const backupDir = join(configTestDir, "close_backups")

    const db = new DB(dbPath, {
      autoBackup: {
        enabled: true,
        directory: backupDir,
        intervalMs: 1000, // 1 second
        maxBackups: 5,
      },
    })

    // Close should stop the timer
    expect(() => db.close()).not.toThrow()
  })
})
