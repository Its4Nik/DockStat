# @dockstat/sqlite-wrapper

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

**A fast, type-safe TypeScript wrapper for Bun's `bun:sqlite`.**
Schema-first table helpers, an expressive chainable QueryBuilder, safe defaults (WHERE required for destructive ops), JSON + Boolean + DATE auto-detection, automatic backups with retention, and production-minded pragmas & transactions.

---

## 🆕 What's New in v1.4.0

### New Features

- **DATE Column Support with Auto-detection** — DATE, DATETIME, and TIMESTAMP columns are now fully supported with automatic serialization/deserialization! JavaScript `Date` objects are automatically converted to/from ISO strings in the database
- **Automatic DATE Parser Detection** — Columns using `column.date()`, `column.datetime()`, or `column.timestamp()` are automatically detected and parsed without manual configuration

### Previous Features (v1.3.x)

- **Automatic Schema Migration** — Tables automatically migrate when schema changes are detected! Add/remove columns, change constraints, and preserve data without manual intervention
- **Auto-detection of JSON & Boolean columns** — Columns using `column.json()` or `column.boolean()` are automatically detected from schema
- **Automatic backups with retention** — Configure `autoBackup` to create periodic backups with automatic cleanup of old files
- **Backup & Restore API** — `backup()`, `restore()`, and `listBackups()` methods
- **`getPath()` method** — Get the database file path

### Bug Fixes

- **Fixed type errors** — Improved type handling in transformer and table creation

### Breaking Changes

- **DATE Column Behavior** — If you have existing tables with DATE, DATETIME, or TIMESTAMP columns, you must now insert/update using JavaScript `Date` objects instead of ISO strings. Previously, you might have done `createdAt: new Date().toISOString()` - now you must use `createdAt: new Date()`. The library automatically handles conversion to/from ISO strings in the database.

**Migration Guide:**
```typescript
// ❌ Before (v1.3.x) - manual ISO string conversion
table.insert({ createdAt: new Date().toISOString() })

// ✅ After (v1.4.0) - use Date objects directly
table.insert({ createdAt: new Date() })
```

If you need to opt-out of automatic DATE parsing for specific columns, you can remove them from the parser configuration or use `column.text()` instead of `column.date()`.

---

## Install

> Requires **Bun** runtime

```bash
bun add @dockstat/sqlite-wrapper
```

## 10-second quickstart

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";

type User = {
  id?: number;
  name: string;
  active: boolean;
  email: string;
  metadata: object;
};

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["foreign_keys", "ON"],
  ],
});

const userTable = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  active: column.boolean(), // Auto-detected as BOOLEAN ✨
  email: column.text({ unique: true, notNull: true }),
  metadata: column.json(), // Auto-detected as JSON ✨
  created_at: column.createdAt(),
});

// Insert with automatic JSON serialization & boolean handling
userTable.insert({
  name: "Alice",
  active: true,
  email: "alice@example.com",
  metadata: { role: "admin", preferences: { theme: "dark" } },
});

// Query with automatic JSON parsing & boolean conversion
const users = userTable
  .select(["id", "name", "email", "metadata"])
  .where({ active: true })
  .orderBy("created_at")
  .desc()
  .limit(10)
  .all();
```

## Why use it?

- ⚡ Bun-native, high-performance bindings
- 🔒 Type-safe table & query APIs (compile-time checks)
- 🧭 Full SQLite feature support: JSON, generated columns, foreign keys, indexes
- 🛡️ Safety-first defaults — prevents accidental full-table updates/deletes
- 🚀 Designed for production workflows: WAL, pragmatic PRAGMAs, bulk ops, transactions
- 🔄 **Automatic JSON/Boolean/DATE detection** — no manual parser configuration needed
- 💾 **Built-in backup & restore** — with automatic retention policies
- 🔀 **Automatic Schema Migration** — seamlessly migrate tables when schemas change

---

## Core Features

### Type Safety

- **Compile-time validation** of column names and data shapes
- **IntelliSense support** for all operations
- **Generic interfaces** that adapt to your data models
- **Type-safe column definitions** with comprehensive constraint support

### Safety-First Design

- **Mandatory WHERE conditions** for UPDATE and DELETE operations to prevent accidental data loss
- **Parameter binding** for all queries to prevent SQL injection
- **Prepared statements** used internally for optimal performance
- **Transaction support** with automatic rollback on errors

### Production Ready

- **WAL mode** support for concurrent read/write operations
- **Comprehensive PRAGMA management** for performance tuning
- **Connection pooling** considerations built-in
- **Bulk operation** support with transaction batching
- **Schema introspection** tools for migrations and debugging
- **Automatic backups** with configurable retention policies

### Complete SQLite Support

- **All SQLite data types** with proper TypeScript mappings
- **Generated columns** (both VIRTUAL and STORED)
- **Foreign key constraints** with cascade options
- **JSON columns** with automatic serialization/deserialization
- **Boolean columns** with automatic conversion (SQLite stores as 0/1)
- **DATE columns** with automatic Date object conversion (SQLite stores as ISO strings)
- **Full-text search** preparation
- **Custom functions** and extensions support

---

## Automatic Type Detection

When using `column.json()`, `column.boolean()`, `column.date()`, `column.datetime()`, or `column.timestamp()`, the wrapper **automatically detects** these columns and handles serialization/deserialization for you. No manual parser configuration required!

```typescript
// JSON, Boolean, and Date columns are auto-detected from schema
const table = db.createTable<{
  id: number;
  settings: object;
  isActive: boolean;
  createdAt: Date;
}>("config", {
  id: column.id(),
  settings: column.json(), // Auto-detected ✨
  isActive: column.boolean(), // Auto-detected ✨
  createdAt: column.date(), // Auto-detected ✨
});

// Insert - objects are automatically JSON.stringify'd, booleans and dates work natively
table.insert({
  settings: { theme: "dark", notifications: true },
  isActive: true,
  createdAt: new Date(),
});

// Select - JSON is automatically parsed, 0/1 converted to true/false, ISO strings to Date
const row = table.select(["*"]).where({ id: 1 }).first();
console.log(row.settings.theme); // "dark" (not a string!)
console.log(row.isActive); // true (not 1!)
console.log(row.createdAt instanceof Date); // true (not a string!)
```

### Manual Parser Override

You can still manually specify parsers if needed (e.g., for existing tables or edge cases):

```typescript
const table = db.createTable<MyType>(
  "my_table",
  { ... },
  {
    parser: {
      JSON: ["customJsonColumn"],
      BOOLEAN: ["customBoolColumn"],
      DATE: ["customDateColumn"],
    },
  }
);
```

---

## Automatic Backups with Retention

Configure automatic backups with retention policies to protect your data:

```typescript
const db = new DB("app.db", {
  pragmas: [["journal_mode", "WAL"]],
  autoBackup: {
    enabled: true,
    directory: "./backups",
    intervalMs: 60 * 60 * 1000, // Backup every hour
    maxBackups: 10, // Keep only the 10 most recent backups
    filenamePrefix: "app_backup", // Optional custom prefix
  },
});

// Backups are created automatically:
// - On database open (initial backup)
// - At the specified interval
// - Old backups are automatically removed based on maxBackups
```

### Auto-Backup Options

| Option           | Type    | Default    | Description                            |
| ---------------- | ------- | ---------- | -------------------------------------- |
| `enabled`        | boolean | -          | Enable/disable automatic backups       |
| `directory`      | string  | -          | Directory to store backup files        |
| `intervalMs`     | number  | `3600000`  | Backup interval in milliseconds (1 hr) |
| `maxBackups`     | number  | `10`       | Maximum number of backups to retain    |
| `filenamePrefix` | string  | `"backup"` | Prefix for backup filenames            |

---

## Automatic Schema Migration

When you call `createTable()` with a schema that differs from an existing table, the wrapper automatically:

1. **Detects schema changes** — Compares existing columns with your new definition
2. **Migrates the table** — Creates a temporary table, copies data, and swaps tables
3. **Preserves data** — Maps columns by name, uses defaults for new columns
4. **Maintains indexes & triggers** — Recreates them after migration

### Basic Migration Example

```typescript
// Initial table creation
const users = db.createTable("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
});

users.insert({ name: "Alice" });

// Later: Add email column (automatic migration!)
const updatedUsers = db.createTable("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true }), // New column
});

// Data is preserved, new column uses NULL or default
const user = updatedUsers.where({ name: "Alice" }).first();
console.log(user); // { id: 1, name: "Alice", email: null }
```

### Migration Options

Control migration behavior with the `migrate` option:

```typescript
db.createTable("users", schema, {
  migrate: true, // Default: enable migration
  // OR provide detailed options:
  migrate: {
    preserveData: true, // Copy existing data (default: true)
    dropMissingColumns: true, // Remove columns not in new schema (default: true)
    onConflict: "fail", // How to handle constraint violations: "fail" | "ignore" | "replace"
    tempTableSuffix: "_temp", // Suffix for temporary table during migration
  },
});
```

### Disable Migration

For cases where you want to ensure a table matches an exact schema without migration:

```typescript
db.createTable("users", schema, {
  migrate: false, // Disable migration
  ifNotExists: true, // Avoid errors if table exists
});
```

### Migration Features

- **Automatic column mapping** — Columns with matching names are preserved
- **Type conversions** — Best-effort conversion between compatible types
- **Constraint handling** — Adds/removes constraints as needed
- **Index preservation** — Indexes are recreated after migration
- **Trigger preservation** — Triggers are recreated after migration
- **Foreign key support** — Handles foreign key constraints properly
- **Transaction safety** — Migration runs in a transaction, rolls back on error

### When Migration Occurs

Migration is triggered when `createTable()` detects:

- **Column additions** — New columns in schema
- **Column removals** — Missing columns from schema
- **Constraint changes** — Different NOT NULL, UNIQUE, etc.
- **Type changes** — Different column types

### Migration Limitations

- **Data loss possible** — Removing columns or adding NOT NULL without defaults
- **Type incompatibility** — Some type conversions may fail
- **Performance** — Large tables take time to migrate
- **Downtime** — Table is briefly locked during migration

For production systems with large tables, consider:

- Running migrations during maintenance windows
- Testing migrations on a copy first
- Using `migrate: false` and handling manually for critical tables

---

## Manual Backup & Restore

### Creating Backups

```typescript
// Backup to auto-generated path (if auto-backup configured)
const backupPath = db.backup();

// Backup to custom path
const customPath = db.backup("./my-backup.db");
```

### Listing Backups

```typescript
const backups = db.listBackups();
// Returns: Array<{ filename, path, size, created }>

console.log(backups[0]);
// {
//   filename: "backup_2024-01-15T10-30-00-000Z.db",
//   path: "/app/backups/backup_2024-01-15T10-30-00-000Z.db",
//   size: 1048576,
//   created: Date object
// }
```

### Restoring from Backup

```typescript
// Restore to the original database (closes and reopens connection)
db.restore("./backups/backup_2024-01-15.db");

// Restore to a different path
db.restore("./backups/backup_2024-01-15.db", "./restored.db");
```

### Stopping Auto-Backup

```typescript
// Stop the automatic backup timer
db.stopAutoBackup();

// Note: close() automatically stops auto-backup
db.close();
```

---

## Query Builder Examples

### SELECT Operations

```typescript
// Select all columns
const allUsers = userTable.select(["*"]).all();

// Select specific columns with conditions
const activeAdmins = userTable
  .select(["id", "name", "email"])
  .where({ active: true, role: "admin" })
  .orderBy("created_at")
  .desc()
  .limit(10)
  .all();

// Get first match
const user = userTable
  .select(["*"])
  .where({ email: "alice@example.com" })
  .first();

// Count records
const count = userTable.where({ active: true }).count();

// Check existence
const exists = userTable.where({ email: "test@example.com" }).exists();

// Get single column value
const name = userTable.where({ id: 1 }).value("name");

// Pluck column values
const allEmails = userTable.where({ active: true }).pluck("email");
```

### INSERT Operations

```typescript
// Single insert
const result = userTable.insert({
  name: "Bob",
  email: "bob@example.com",
  active: true,
});
console.log(result.insertId); // New row ID

// Bulk insert
userTable.insertBatch([
  { name: "User 1", email: "user1@example.com" },
  { name: "User 2", email: "user2@example.com" },
]);

// Insert with conflict resolution
userTable.insertOrIgnore({ email: "existing@example.com", name: "Name" });
userTable.insertOrReplace({ email: "existing@example.com", name: "New Name" });

// Insert and get the row back
const newUser = userTable.insertAndGet({
  name: "Charlie",
  email: "charlie@example.com",
});
```

### UPDATE Operations

```typescript
// Update with WHERE (required!)
userTable.where({ id: 1 }).update({ name: "Updated Name" });

// Increment/decrement numeric columns
userTable.where({ id: 1 }).increment("login_count");
userTable.where({ id: 1 }).decrement("credits", 10);

// Upsert (insert or replace)
userTable.upsert({ email: "alice@example.com", name: "Alice Updated" });

// Batch update
userTable.updateBatch([
  { where: { id: 1 }, data: { active: false } },
  { where: { id: 2 }, data: { active: true } },
]);
```

### DELETE Operations

```typescript
// Delete with WHERE (required!)
userTable.where({ id: 1 }).delete();

// Soft delete (sets a timestamp column)
userTable.where({ id: 1 }).softDelete("deleted_at");

// Restore soft deleted
userTable.where({ id: 1 }).restore("deleted_at");

// Truncate table (delete all rows)
userTable.truncate();

// Delete older than timestamp
userTable.deleteOlderThan("created_at", Date.now() - 86400000);
```

### WHERE Conditions

```typescript
// Simple equality
userTable.where({ active: true, role: "admin" });

// Comparison operators
userTable.whereOp("age", ">=", 18);
userTable.whereOp("created_at", "<", Date.now());

// IN / NOT IN
userTable.whereIn("status", ["active", "pending"]);
userTable.whereNotIn("role", ["banned", "suspended"]);

// BETWEEN
userTable.whereBetween("age", 18, 65);
userTable.whereNotBetween("score", 0, 50);

// NULL checks
userTable.whereNull("deleted_at");
userTable.whereNotNull("email");

// Raw expressions
userTable.whereRaw("LENGTH(name) > ?", [5]);

// Regex (client-side filtering)
userTable.whereRgx({ email: /@gmail\.com$/ });
```

---

## Utility Methods

```typescript
// Get database file path
const path = db.getPath(); // "app.db" or ":memory:"

// Direct SQL execution
db.run("CREATE INDEX idx_email ON users(email)");

// Prepare statements
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");

// Transactions
db.transaction(() => {
  userTable.insert({ name: "User 1" });
  userTable.insert({ name: "User 2" });
});

// Manual transaction control
db.begin();
try {
  // ... operations
  db.commit();
} catch (e) {
  db.rollback();
}

// Savepoints
db.savepoint("my_savepoint");
db.releaseSavepoint("my_savepoint");
db.rollbackToSavepoint("my_savepoint");

// Database maintenance
db.vacuum();
db.analyze();
const integrity = db.integrityCheck();

// Schema inspection
const schema = db.getSchema();
const tableInfo = db.getTableInfo("users");
const indexes = db.getIndexes("users");
const foreignKeys = db.getForeignKeys("users");
```

---

## Column Helpers

```typescript
import { column } from "@dockstat/sqlite-wrapper";

column.id(); // INTEGER PRIMARY KEY AUTOINCREMENT
column.text({ notNull: true, unique: true });
column.integer({ default: 0 });
column.real();
column.blob();
column.boolean({ default: false });
column.json({ validateJson: true });
column.date();
column.datetime();
column.timestamp();
column.varchar(255);
column.char(10);
column.numeric({ precision: 10, scale: 2 });
column.uuid({ generateDefault: true });
column.createdAt();
column.updatedAt();
column.foreignKey("other_table", "id", { onDelete: "CASCADE" });
column.enum(["pending", "active", "completed"]);
```

---

## Package Structure

The package is organized into modular components for maintainability:

```
@dockstat/sqlite-wrapper
├── index.ts              # Main exports & DB class
├── types.ts              # Type definitions & column helpers
├── query-builder/
│   ├── index.ts          # QueryBuilder facade
│   ├── base.ts           # Base class with shared functionality
│   ├── where.ts          # WHERE clause building
│   ├── select.ts         # SELECT operations
│   ├── insert.ts         # INSERT operations
│   ├── update.ts         # UPDATE operations
│   └── delete.ts         # DELETE operations
└── utils/
    ├── index.ts          # Utility exports
    ├── logger.ts         # Structured logging (wraps @dockstat/logger)
    ├── sql.ts            # SQL building utilities
    └── transformer.ts    # Row serialization/deserialization
```

### Using Utilities Directly

The `utils` module is exported for advanced use cases:

```typescript
import {
  quoteIdentifier,
  buildPlaceholders,
  transformFromDb,
  createLogger,
} from "@dockstat/sqlite-wrapper/utils";

// Quote identifiers safely
const quoted = quoteIdentifier("user name"); // "user name"

// Build placeholders
const placeholders = buildPlaceholders(3); // "?, ?, ?"

// Create a custom logger
const myLogger = createLogger("my-component");
myLogger.info("Custom log message");
```

---

## Logging

The package uses `@dockstat/logger` with structured, component-specific logging:

```typescript
// Log output examples:
// 16:30:00 INFO  [db:sqlite] — Database open: app.db
// 16:30:00 DEBUG [table:sqlite] — CREATE TABLE users | columns=[id, name, email]
// 16:30:00 DEBUG [select:sqlite] — SELECT | SELECT * FROM "users" WHERE "id" = ? | params=[1]
// 16:30:00 DEBUG [select:sqlite] — SELECT | rows=1
// 16:30:00 INFO  [backup:sqlite] — Backup create: ./backups/backup_2024-01-15.db
```

### Configure Logging

Control log levels via environment variables:

```bash
# Set log level (error, warn, info, debug)
DOCKSTAT_LOGGER_LEVEL=info

# Disable specific loggers
DOCKSTAT_LOGGER_DISABLED_LOGGERS=select,insert

# Show only specific loggers
DOCKSTAT_LOGGER_ONLY_SHOW=db,backup
```

---

## Docs & Examples

See full technical docs [here](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99/doc/dockstatsqlite-wrapper-Lxt4IphXI5).

## License

MPL-2.0 — maintained by Dockstat. Contributions welcome.
