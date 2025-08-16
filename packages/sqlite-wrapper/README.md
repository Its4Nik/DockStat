# @dockstat/sql-wrapper

A tiny TypeScript wrapper around Bun's `bun:sqlite` (`Database`) that gives you:

* **`DB`** (default export) — open/close DB, create tables, run `PRAGMA` statements, load extensions, and get a typed `QueryBuilder<T>`.
* **`QueryBuilder<T>`** — expressive, chainable query builder with:

  **SELECT operations:**
  * plain equality `.where(...)`
  * regex `.whereRgx(...)` (applied client-side)
  * raw fragments `.whereRaw(...)` / `.whereExpr(...)`
  * `IN` helper `.whereIn(...)`
  * operator helper `.whereOp(...)`
  * ordering, limit, offset, and result helpers: `all()`, `get()`, `first()`, `count()`

  **INSERT operations:**
  * single/bulk inserts `.insert(...)`
  * conflict resolution `.insertOrIgnore(...)`, `.insertOrReplace(...)`

  **UPDATE operations:**
  * safe updates `.update(...)` (requires WHERE conditions)

  **DELETE operations:**
  * safe deletes `.delete()` (requires WHERE conditions)

> **Important** — Bun's `bun:sqlite` currently doesn't provide a JS `registerFunction` to add custom SQL functions. Regex conditions added with `whereRgx()` are collected and applied **in JavaScript** after fetching rows that match the non-regex SQL conditions. See the **Performance** section below for implications.

---

## Quick start

```ts
import DB, { QueryBuilder } from "./db";

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
  created_at: number;
}

// Create DB with PRAGMA settings and an extension
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["synchronous", "NORMAL"],
    ["foreign_keys", "ON"]
  ],
  loadExtensions: [
     "/absolute/path/to/my_extension" // optional compiled SQLite extension
  ]
});

// create table (object style)
db.createTable(
  "users",
  {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
    email: "TEXT UNIQUE NOT NULL",
    type: "TEXT NOT NULL",
    created_at: "INTEGER NOT NULL DEFAULT (strftime('%s','now'))"
  },
  { ifNotExists: true }
);

// SELECT - basic select (SQL filter only)
const containers = db
  .table<User>("users")
  .select(["id", "name", "email"])
  .where({ type: "container" }) // SQL: type = 'container'
  .orderBy("id")
  .desc()
  .limit(10)
  .all();

console.log(containers);

// SELECT - regex + SQL filters together
const gmailUsers = db
  .table<User>("users")
  .select(["id", "email"])
  .where({ type: "container" }) // SQL
  .whereRgx({ email: /@gmail\.com$/i }) // client-side regex
  .all();

console.log(gmailUsers);

// INSERT - single row
const insertResult = db
  .table<User>("users")
  .insert({
    name: "John Doe",
    email: "john@example.com",
    type: "container"
  });

console.log(`Inserted user with ID: ${insertResult.insertId}`);

// INSERT - multiple rows with conflict resolution
const bulkResult = db
  .table<User>("users")
  .insertOrIgnore([
    { name: "Alice", email: "alice@example.com", type: "container" },
    { name: "Bob", email: "bob@example.com", type: "container" }
  ]);

console.log(`Inserted ${bulkResult.changes} users`);

// UPDATE - with WHERE conditions
const updateResult = db
  .table<User>("users")
  .where({ type: "container" })
  .whereRgx({ email: /@gmail\.com$/i })
  .update({ type: "gmail_user" });

console.log(`Updated ${updateResult.changes} users`);

// DELETE - with WHERE conditions
const deleteResult = db
  .table<User>("users")
  .where({ type: "gmail_user" })
  .delete();

console.log(`Deleted ${deleteResult.changes} users`);

db.close();
```

---

## 1) Creating tables

**Object style (recommended):**

```ts
db.createTable("posts", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  title: "TEXT NOT NULL",
  body: "TEXT",
  author_id: "INTEGER NOT NULL",
  published: "INTEGER NOT NULL DEFAULT 0"
}, { ifNotExists: true });
```

**String style:**

```ts
db.createTable(
  "events",
  `id INTEGER PRIMARY KEY,
   name TEXT NOT NULL,
   occurred_at INTEGER NOT NULL`
);
```

---

## 2) Running PRAGMA statements

You can pass PRAGMAs at construction:

```ts
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["cache_size", -64000]
  ]
});
```

Or run them later:

```ts
db.pragma("cache_size", -32000);
const foreignKeysOn = db.pragma("foreign_keys");
console.log(foreignKeysOn); // should print ON
```

---

## 3) Loading SQLite extensions

At DB construction:

```ts
const db = new DB("app.db", {
  loadExtensions: [
    "/absolute/path/to/regexp_extension"
  ]
});
```

Or after creation:

```ts
db.loadExtension("/absolute/path/to/my_extension");
```

---

## 4) Basic QueryBuilder usage

**Select specific columns:**

```ts
const users = db
  .table<User>("users")
  .select(["id", "name"])
  .where({ type: "container" })
  .all();
```

**Select all columns:**

```ts
const allUsers = db.table<User>("users").select(["*"]).all();
```

**Get a single row:**

```ts
const userOrNull = db.table<User>("users").where({ id: 1 }).get();
```

**Get first matching row:**

```ts
const first = db.table<User>("users").where({ type: "container" }).first();
```

**Count rows:**

```ts
const count = db.table<User>("users").where({ type: "container" }).count();
```

---

## 5) Mixing equality and regex

Plain equality uses `.where()` (SQL). Regex uses `.whereRgx()` (client-side):

```ts
const matches = db
  .table<User>("users")
  .select(["id", "name", "email", "type"])
  .where({ type: "container" }) // SQL
  .whereRgx({ email: /@example\.com$/i }) // JS regex after SQL fetch
  .orderBy("created_at")
  .desc()
  .limit(50)
  .all();
```

> **Note:** If `.whereRgx()` is used, ordering, offset, and limit are applied in JS after regex filtering.

---

## 6) Raw expressions, IN, and operators

**Raw WHERE fragment:**

```ts
const rows = db
  .table<User>("users")
  .whereRaw("created_at > ? AND published = ?", [1625097600, 1])
  .all();
```

**IN clause:**

```ts
const some = db.table<User>("users").whereIn("id", [1, 2, 5, 7]).all();
```

**Operator helper:**

```ts
db.table<User>("users")
  .whereOp("created_at", ">", 1622505600)
  .whereOp("email", "LIKE", "%@gmail.com")
  .all();
```

---

## 7) Pagination

```ts
const page = 2;
const pageSize = 20;

const paged = db
  .table<User>("users")
  .where({ type: "container" })
  .orderBy("created_at")
  .desc()
  .offset((page - 1) * pageSize)
  .limit(pageSize)
  .all();
```

> With `.whereRgx()`, paging happens in JS after filtering.

---

## 8) INSERT operations

**Single row insert:**

```ts
const result = db
  .table<User>("users")
  .insert({
    name: "John Doe",
    email: "john@example.com",
    type: "container"
  });

console.log(result.insertId, result.changes);
```

**Bulk insert:**

```ts
const users = [
  { name: "Alice", email: "alice@example.com", type: "container" },
  { name: "Bob", email: "bob@example.com", type: "container" }
];

const result = db.table<User>("users").insert(users);
console.log(`Inserted ${result.changes} users`);
```

**Insert with conflict resolution:**

```ts
// INSERT OR IGNORE - skip duplicates
const result1 = db.table<User>("users").insertOrIgnore({
  name: "Duplicate User",
  email: "existing@example.com"
});

// INSERT OR REPLACE - replace duplicates
const result2 = db.table<User>("users").insertOrReplace({
  name: "Updated User",
  email: "existing@example.com"
});

// Custom conflict resolution
const result3 = db.table<User>("users").insert(userData, {
  orIgnore: true,
  // or: orReplace, orAbort, orFail, orRollback
});
```

---

## 9) UPDATE operations

**Basic update (requires WHERE conditions):**

```ts
const result = db
  .table<User>("users")
  .where({ id: 1 })
  .update({ name: "Updated Name", type: "admin" });

console.log(`Updated ${result.changes} rows`);
```

**Update with complex conditions:**

```ts
const result = db
  .table<User>("users")
  .where({ type: "container" })
  .whereRgx({ email: /@gmail\.com$/i })
  .update({ type: "gmail_container" });
```

**Update with raw WHERE conditions:**

```ts
const result = db
  .table<User>("users")
  .whereRaw("created_at > ? AND active = ?", [Date.now() - 86400000, true])
  .update({ last_active: Date.now() });
```

> **Safety Note:** UPDATE operations require at least one WHERE condition to prevent accidental full table updates.

---

## 10) DELETE operations

**Basic delete (requires WHERE conditions):**

```ts
const result = db
  .table<User>("users")
  .where({ active: false })
  .delete();

console.log(`Deleted ${result.changes} rows`);
```

**Delete with complex conditions:**

```ts
const result = db
  .table<User>("users")
  .where({ type: "temporary" })
  .whereOp("created_at", "<", Date.now() - 604800000) // older than 1 week
  .delete();
```

**Delete with regex conditions:**

```ts
const result = db
  .table<User>("users")
  .whereRgx({ email: /^test.*@example\.com$/i })
  .delete();
```

> **Safety Note:** DELETE operations require at least one WHERE condition to prevent accidental full table deletion.

---

## 11) Complex query example

```ts
const results = db
  .table<User>("users")
  .select(["id", "name", "email", "created_at"])
  .whereRaw("created_at > ?", [1672531200])
  .whereIn("id", [10, 20, 30, 40])
  .whereRgx({ email: /\b(hey@example|test@example)\.com$/i })
  .orderBy("created_at")
  .desc()
  .limit(100)
  .all();
```

---

## 12) Result types and error handling

**INSERT results:**

```ts
interface InsertResult {
  insertId: number;  // rowid of the last inserted row
  changes: number;   // number of rows inserted
}
```

**UPDATE/DELETE results:**

```ts
interface UpdateResult {
  changes: number;   // number of rows affected
}

interface DeleteResult {
  changes: number;   // number of rows deleted
}
```

**Error handling:**

```ts
try {
  // This will throw - UPDATE without WHERE conditions
  db.table<User>("users").update({ active: true });
} catch (error) {
  console.error("UPDATE operation requires WHERE conditions");
}

try {
  // This will throw - empty insert data
  db.table<User>("users").insert({});
} catch (error) {
  console.error("Insert data cannot be empty");
}
```

---

## Advanced: Native `REGEXP` support

If you load a compiled SQLite extension that adds `REGEXP`, you can do regex filtering directly in SQL:

```ts
db.loadExtension("/path/to/regexp_extension");
const rows = db
  .table<User>("users")
  .whereExpr("email REGEXP ?", ["@example\\.com$"])
  .all();
```

---

## Performance & Practical tips

### SELECT performance:
* Prefer `.where()` SQL filters for large datasets — `.whereRgx()` fetches rows and filters in JS.
* Use `.whereIn()` and `.whereRaw()` to reduce rows before regex filtering.
* Use indexes on frequently queried columns.

### INSERT performance:
* Use bulk inserts with arrays for multiple rows instead of individual insert calls.
* Consider transaction wrapping for large batch operations.
* Use appropriate conflict resolution (`OR IGNORE`, `OR REPLACE`) to avoid exception handling.

### UPDATE/DELETE with regex:
* When using `.whereRgx()`, the operation fetches candidate rows first, then applies regex filtering client-side.
* For better performance with regex conditions, consider using SQL `LIKE` patterns where possible.

### General tips:
* Use PRAGMAs to tune performance (e.g. WAL mode, cache size).
* Load extensions to enable advanced SQLite features without manual filtering.
* Always use WHERE conditions for UPDATE/DELETE to prevent accidents.
* The library automatically handles parameter binding to prevent SQL injection.

---

## API Reference

### `DB` (default export)

* `constructor(path: string, opts?: { pragmas?: [string, any][], loadExtensions?: string[] })`
* `table<T>(tableName: string): QueryBuilder<T>`
* `createTable(tableName: string, columns: string | Record<string,string>, options?: { ifNotExists?: boolean; withoutRowId?: boolean })`
* `pragma(name: string, value?: any): any`
* `loadExtension(path: string): void`
* `close(): void`

### `QueryBuilder<T>` (named export)

**WHERE methods (shared across operations):**
* `where(cond: Partial<Record<keyof T, string | number | boolean | null>>)`
* `whereRgx(cond: Partial<Record<keyof T, string | RegExp>>)`
* `whereExpr(expr: string, params?: any[])`
* `whereRaw(expr: string, params?: any[])`
* `whereIn(column: keyof T, values: any[])`
* `whereOp(column: keyof T, op: string, value: any)`

**SELECT methods:**
* `select(columns: Array<keyof T> | ["*"])`
* `orderBy(column: keyof T)`
* `asc()`, `desc()`
* `limit(n)`, `offset(n)`
* `all(): T[]`, `get(): T | null`, `first(): T | null`, `count(): number`

**INSERT methods:**
* `insert(data: Partial<T> | Partial<T>[], options?: InsertOptions): InsertResult`
* `insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult`
* `insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult`

**UPDATE methods:**
* `update(data: Partial<T>): UpdateResult` *(requires WHERE conditions)*

**DELETE methods:**
* `delete(): DeleteResult` *(requires WHERE conditions)*

### Types (named exports)

* `InsertResult` — `{ insertId: number, changes: number }`
* `UpdateResult` — `{ changes: number }`
* `DeleteResult` — `{ changes: number }`
* `InsertOptions` — conflict resolution options
* `ColumnNames<T>` — column selection type
* `WhereCondition<T>` — WHERE condition type
* `RegexCondition<T>` — regex condition type
