# `@dockstat/sqlite-wrapper`

`@dockstat/sqlite-wrapper` is a Bun-native, type-safe wrapper around
`bun:sqlite`. It gives every DockStat workspace a uniform way to declare
schemas, run queries, and migrate tables.

## Why this package exists

The DockStat backend stores configuration, hosts, plugins, themes, sessions,
and widget definitions in SQLite. Sharing a single, opinionated abstraction
keeps those tables consistent and gives the type system real teeth: column
names and value shapes are verified at compile time.

## Install

```bash
bun add @dockstat/sqlite-wrapper
```

Requires the Bun runtime. The wrapper relies on `Bun.password`, `bun:sqlite`,
and structured logging from `@dockstat/logger`.

## Quick start

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper"

interface User {
  id?: number
  name: string
  active: boolean
  email: string
  metadata: Record<string, unknown>
}

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["foreign_keys", "ON"],
  ],
})

const userTable = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  active: column.boolean(),
  email: column.text({ unique: true, notNull: true }),
  metadata: column.json(),
  created_at: column.createdAt(),
})

userTable.insert({
  name: "Alice",
  active: true,
  email: "[email protected]",
  metadata: { role: "admin", preferences: { theme: "dark" } },
})

const activeAdmins = userTable
  .select(["id", "name", "email", "metadata"])
  .where({ active: true })
  .orderBy("created_at")
  .desc()
  .limit(10)
  .all()
```

## Schema helpers

The `column` helper covers every SQLite primitive and the patterns DockStat
relies on:

| Helper | Notes |
|--------|-------|
| `column.id()` | Auto-incrementing `INTEGER PRIMARY KEY` |
| `column.text({ notNull, unique })` | UTF-8 text with optional constraints |
| `column.integer({ default })` | Standard integer |
| `column.real()` | Floating-point |
| `column.blob()` | Binary data |
| `column.boolean()` | Auto-detected 0/1 conversion |
| `column.json({ validateJson })` | Auto-detected JSON serialization |
| `column.date()` / `column.datetime()` / `column.timestamp()` | Auto-converted `Date` objects |
| `column.varchar(n)` / `column.char(n)` | Length-constrained text |
| `column.numeric({ precision, scale })` | Fixed-point decimal |
| `column.uuid({ generateDefault: true })` | UUID string with optional default |
| `column.createdAt()` / `column.updatedAt()` | Timestamp with auto-populated defaults |
| `column.foreignKey(table, column, options)` | Foreign-key reference with cascade options |
| `column.enum(values)` | `CHECK`-constrained text column |

## QueryBuilder

Each table returns a builder that supports the full CRUD surface:

```typescript
// SELECT
const admins = userTable
  .select(["id", "name", "email"])
  .where({ active: true, role: "admin" })
  .orderBy("created_at")
  .desc()
  .limit(10)
  .all()

const alice = userTable.select(["*"]).where({ email: "[email protected]" }).first()
const count = userTable.where({ active: true }).count()
const exists = userTable.where({ email: "[email protected]" }).exists()
const emails = userTable.where({ active: true }).pluck("email")

// INSERT
userTable.insert({ name: "Bob", email: "[email protected]", active: true })
userTable.insertBatch([
  { name: "Cara", email: "[email protected]" },
  { name: "Dan", email: "[email protected]" },
])
const created = userTable.insertAndGet({ name: "Eve", email: "[email protected]" })

// UPDATE (WHERE is required to protect against accidental full-table writes)
userTable.where({ id: 1 }).update({ name: "Alice Updated" })
userTable.where({ id: 1 }).increment("login_count")
userTable.where({ id: 1 }).decrement("credits", 10)

// DELETE (WHERE is required too)
userTable.where({ id: 1 }).delete()
userTable.where({ id: 1 }).softDelete("deleted_at") // sets a timestamp
userTable.where({ id: 1 }).restore("deleted_at")    // unsets it
userTable.deleteOlderThan("created_at", Date.now() - 86_400_000)
```

### WHERE conditions

```typescript
userTable.where({ active: true })                    // equality
userTable.whereOp("age", ">=", 18)                   // comparison
userTable.whereIn("status", ["active", "pending"])   // IN
userTable.whereNotIn("role", ["banned"])             // NOT IN
userTable.whereBetween("age", 18, 65)                // BETWEEN
userTable.whereNull("deleted_at")                    // IS NULL
userTable.whereNotNull("email")                      // IS NOT NULL
userTable.whereRaw("LENGTH(name) > ?", [5])          // raw SQL
userTable.whereRgx({ email: /@gmail\.com$/ })        // client-side regex
```

### JOINs

Joins are fully type-safe: the joined table type flows through the chain.

```typescript
const posts = users
  .join(posts, { id: "user_id" })
  .where({ published: true })
  .all()
// posts[0].name // from users
// posts[0].title // from posts
```

Supported joins: `join` (INNER), `innerJoin`, `leftJoin`, `rightJoin`,
`fullJoin`, `crossJoin`.

```typescript
// aliases for self-joins or to disambiguate columns
users.join(posts, { id: "user_id" }, "p").join(comments, { "p.id": "post_id" }, "c")
```

## Safety guarantees

- `UPDATE` and `DELETE` without a `where` clause throw at runtime. Wrap calls
  with `truncate()` if you really mean to wipe a table.
- All values are bound with prepared statements; you cannot accidentally
  string-concatenate user input into a query.
- `db.transaction(fn)` runs the callback atomically with automatic rollback
  on error.

## Automatic type detection

`column.json()`, `column.boolean()`, `column.date()`, `column.datetime()`, and
`column.timestamp()` register automatic parsers. Insert `Date` objects or
plain objects without thinking about serialization; select them without
thinking about parsing. Override with `createTable(name, schema, { parser })`
when you need full control.

## Backups and retention

```typescript
const db = new DB("app.db", {
  autoBackup: {
    enabled: true,
    directory: "./backups",
    intervalMs: 60 * 60 * 1000, // hourly
    maxBackups: 10,
    filenamePrefix: "app_backup",
  },
})
```

Manual utilities:

| Method | Description |
|--------|-------------|
| `db.backup(path?)` | Snapshot to a path (default: next auto-backup location) |
| `db.listBackups()` | List existing snapshots with metadata |
| `db.restore(backupPath, targetPath?)` | Replace the current database with the snapshot |
| `db.stopAutoBackup()` | Cancel the timer |

## Schema migrations

`createTable()` compares the new schema to the existing table. If they
differ, the wrapper migrates automatically:

```typescript
const users = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true }),
})
```

New columns appear with `NULL` defaults; missing columns are dropped; indexes
and triggers are preserved. Use `migrate: false` to disable automatic
migration when you need full control, or pass a detailed configuration:

```typescript
db.createTable("users", schema, {
  migrate: {
    preserveData: true,
    dropMissingColumns: true,
    onConflict: "fail", // "fail" | "ignore" | "replace"
    tempTableSuffix: "_temp",
  },
})
```

## Direct SQL

```typescript
db.run("CREATE INDEX idx_email ON users(email)")
const stmt = db.prepare("SELECT * FROM users WHERE id = ?")
const schema = db.getSchema()
const tableInfo = db.getTableInfo("users")
const indexes = db.getIndexes("users")
const foreignKeys = db.getForeignKeys("users")
```

Transactions, savepoints, and maintenance commands are also exposed:

```typescript
db.transaction(() => { /* … */ })
db.begin(); db.commit(); db.rollback()
db.savepoint("name"); db.releaseSavepoint("name"); db.rollbackToSavepoint("name")
db.vacuum(); db.analyze(); db.integrityCheck()
```

## Logging

The wrapper emits structured logs via `@dockstat/logger`. Filter noisy output
with the standard environment variables:

```bash
DOCKSTAT_LOGGER_LEVEL=info
DOCKSTAT_LOGGER_DISABLED_LOGGERS=select,insert
DOCKSTAT_LOGGER_ONLY_SHOW=db,backup
```

## Next steps

- See [apps/api.md](../apps/api.md) for how the backend wires tables at boot.
- See [packages/auth.md](./auth.md) to see the schema pattern used to
  describe providers, sessions, and API keys.
