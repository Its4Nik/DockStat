---
id: f543683b-68be-431f-a6d5-7b4012b1345a
title: "@dockstat/sqlite-wrapper"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: bbcefaa2-6bd4-46e8-ae4b-a6b823593e67
updatedAt: 2026-01-30T13:20:24.674Z
urlId: vCSP0qqnqI
---

> A fast, type-safe TypeScript wrapper for Bun's `bun:sqlite`. Schema-first table helpers, an expressive chainable QueryBuilder, safe defaults, JSON + generated columns, and production-minded pragmas & transactions.

## Overview

`@dockstat/sqlite-wrapper` provides a modern, type-safe interface for SQLite operations in Bun applications. It's designed for production use with features like WAL mode support, prepared statements, and comprehensive type checking.

```mermaidjs

graph TB
    subgraph "Application Layer"
        APP["Your Application"]
    end

    subgraph "@dockstat/sqlite-wrapper"
        DB["DB Class"]
        TABLE["Table API"]
        QB["QueryBuilder"]
        COL["Column Definitions"]
    end

    subgraph "Bun Runtime"
        SQLITE["bun:sqlite"]
    end

    subgraph "Storage"
        FILE["SQLite File"]
    end

    APP --> DB
    DB --> TABLE
    TABLE --> QB
    DB --> COL
    QB --> SQLITE
    SQLITE --> FILE
```

## Installation

```bash
bun add @dockstat/sqlite-wrapper
```

> **Note**: Requires Bun runtime. This package uses `bun:sqlite` which is not available in Node.js.

## Quick Start

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";

// Define your data type

type User = {
  id?: number;
  name: string;
  email: string;
  active: boolean;
};

// Create database with pragmas

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["foreign_keys", "ON"]
  ]
});

// Create a typed table

const users = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true, notNull: true }),
  active: column.boolean({ default: true }),
  created_at: column.createdAt()
});

// Query with full type safety

const activeUsers = users
  .select(["id", "name", "email"])
  .where({ active: true })
  .orderBy("created_at").desc()
  .limit(10)
  .all();
```

## Core Concepts

### Database Initialization

```mermaidjs

sequenceDiagram
    participant App as "Application"
    participant DB as "DB Instance"
    participant SQLite as "bun:sqlite"
    participant File as "Database File"

    App->>DB: "new DB(path, options)"
    DB->>SQLite: "Open connection"
    SQLite->>File: "Create/Open file"
    DB->>SQLite: "Apply PRAGMAs"
    SQLite-->>DB: "Ready"
    DB-->>App: "DB instance"
```

```typescript
import { DB } from "@dockstat/sqlite-wrapper";

// Basic initialization
const db = new DB("app.db");

// With configuration
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],        // Write-Ahead Logging
    ["synchronous", "NORMAL"],       // Balance safety/speed
    ["cache_size", "-64000"],        // 64MB cache
    ["foreign_keys", "ON"],          // Enable foreign keys
    ["temp_store", "MEMORY"],        // In-memory temp tables
    ["busy_timeout", "5000"]         // 5 second timeout
  ]
});
```

### Column Definitions

The `column` helper provides type-safe column definitions:

```mermaidjs

graph LR
    subgraph "Column Types"
        ID["column.id()"]
        TEXT["column.text()"]
        INT["column.integer()"]
        REAL["column.real()"]
        BOOL["column.boolean()"]
        JSON["column.json()"]
        BLOB["column.blob()"]
        DATE["column.createdAt()"]
    end

    subgraph "Constraints"
        NOTNULL["notNull"]
        UNIQUE["unique"]
        DEFAULT["default"]
        FK["foreignKey"]
    end

    ID --> NOTNULL
    TEXT --> UNIQUE
    INT --> DEFAULT
    REAL --> FK
```

```typescript
import { column } from "@dockstat/sqlite-wrapper";

const schema = {
  // Auto-incrementing primary key
  id: column.id(),
  
  // Text with constraints
  name: column.text({ notNull: true }),
  email: column.text({ unique: true, notNull: true }),
  bio: column.text({ default: "" }),
  
  // Numeric types
  age: column.integer(),
  score: column.real(),
  
  // Boolean (stored as INTEGER 0/1)
  active: column.boolean({ default: true }),
  
  // JSON column (stored as TEXT, parsed on read)
  metadata: column.json(),
  
  // Binary data
  avatar: column.blob(),
  
  // Auto-timestamp
  created_at: column.createdAt(),
  
  // Foreign key
  team_id: column.integer({
    foreignKey: {
      table: "teams",
      column: "id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    }
  }),
  
  // Generated column (virtual)
  full_name: column.generated(
    "first_name || ' ' || last_name",
    "VIRTUAL"
  ),
  
  // Generated column (stored)
  search_text: column.generated(
    "lower(name || ' ' || email)",
    "STORED"
  )
};
```

### Table Creation

```typescript
// Create table with schema

const users = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true })
});

// Table is created if it doesn't exist
// Returns a typed QueryBuilder for the table
```

## QueryBuilder API

### Select Operations

```mermaidjs

graph LR
    SELECT["select()"] --> WHERE["where()"]
    WHERE --> ORDER["orderBy()"]
    ORDER --> LIMIT["limit()"]
    LIMIT --> OFFSET["offset()"]
    OFFSET --> EXEC["all() / first() / run()"]
```

```typescript
// Select all columns
const all = users.select(["*"]).all();

// Select specific columns
const names = users.select(["id", "name"]).all();

// With conditions
const filtered = users
  .select(["*"])
  .where({ active: true, role: "admin" })
  .all();

// Complex conditions
const complex = users
  .select(["*"])
  .where({ active: true })
  .and({ role: "admin" })
  .or({ role: "superuser" })
  .all();

// Ordering
const ordered = users
  .select(["*"])
  .orderBy("created_at").desc()
  .orderBy("name").asc()
  .all();

// Pagination
const page = users
  .select(["*"])
  .limit(10)
  .offset(20)
  .all();

// Get single result
const user = users
  .select(["*"])
  .where({ id: 1 })
  .first();
```

### Insert Operations

```typescript
// Insert single row
const result = users.insert({
  name: "John Doe",
  email: "john@example.com",
  active: true
});
console.log(result.lastInsertRowid); // New row ID

// Insert multiple rows
const results = users.insertMany([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" }
]);
```

### Update Operations

```typescript
// Update with WHERE clause (required for safety)
const updated = users
  .update({ active: false })
  .where({ id: 1 })
  .run();
console.log(updated.changes); // Number of rows affected

// Update multiple conditions
users
  .update({ role: "inactive" })
  .where({ active: false })
  .and({ last_login: null })
  .run();
```

### Delete Operations

```typescript
// Delete with WHERE clause (required for safety)
const deleted = users
  .delete()
  .where({ id: 1 })
  .run();
console.log(deleted.changes); // Number of rows deleted

// Delete with multiple conditions
users
  .delete()
  .where({ active: false })
  .and({ created_at: { lt: "2023-01-01" } })
  .run();
```

## Safety Features

### Mandatory WHERE Clauses

To prevent accidental data loss, UPDATE and DELETE operations require WHERE clauses:

```typescript
// This will throw an error
users.update({ active: false }).run(); // Error!

// This works
users.update({ active: false }).where({ id: 1 }).run();

// To update all rows intentionally, use a truthy condition
users.update({ active: false }).where({ 1: 1 }).run();
```

### Parameter Binding

All queries use parameter binding to prevent SQL injection:

```typescript
// Safe - parameters are bound

users.select(["*"]).where({ email: userInput }).all();

// The actual query uses placeholders
// SELECT * FROM users WHERE email = ?
```

## Transactions

```mermaidjs

sequenceDiagram
    participant App as "Application"
    participant DB as "Database"
    participant SQLite as "SQLite"

    App->>DB: "db.transaction(() => { ... })"
    DB->>SQLite: "BEGIN TRANSACTION"
    
    loop "Operations"
        DB->>SQLite: "INSERT/UPDATE/DELETE"
        SQLite-->>DB: "Result"
    end

    alt "Success"
        DB->>SQLite: "COMMIT"
        SQLite-->>DB: "Committed"
        DB-->>App: "Return value"
    else "Error"
        DB->>SQLite: "ROLLBACK"
        SQLite-->>DB: "Rolled back"
        DB-->>App: "Throw error"
    end
```

```typescript
// Transaction with automatic rollback on error

const result = db.transaction(() => {
  const user = users.insert({ name: "Alice", email: "alice@example.com" });
  
  teams.insert({
    name: "Alice's Team",
    owner_id: user.lastInsertRowid
  });
  
  return user.lastInsertRowid;
});

// Nested transactions (savepoints)
db.transaction(() => {
  users.insert({ name: "User 1" });
  
  db.transaction(() => {
    users.insert({ name: "User 2" });
    // Inner transaction can rollback independently
  });
});
```

## JSON Columns

```typescript
type Config = {
  id: number;
  settings: {
    theme: string;
    notifications: boolean;
  };
};

const configs = db.createTable<Config>("configs", {
  id: column.id(),
  settings: column.json()
}, {
  parser: { JSON: ["settings"] }  // Specify JSON columns
});

// Insert with object

configs.insert({
  settings: { theme: "dark", notifications: true }
});

// Data is automatically serialized/deserialized
const config = configs.select(["*"]).where({ id: 1 }).first();
console.log(config.settings.theme); // "dark"
```

## Generated Columns

```typescript
const users = db.createTable("users", {
  id: column.id(),
  first_name: column.text({ notNull: true }),
  last_name: column.text({ notNull: true }),
  
  // Virtual: computed on read
  full_name: column.generated(
    "first_name || ' ' || last_name",
    "VIRTUAL"
  ),
  
  // Stored: computed on write, indexed
  search_key: column.generated(
    "lower(first_name || last_name)",
    "STORED"
  )
});

// Query using generated columns
const results = users
  .select(["id", "full_name"])
  .where({ search_key: "johndoe" })
  .all();
```

## Indexes

## `createIndex`

Create an index on a table.

```typescript
createIndex(
  indexName: string,
  tableName: string,
  columns:
    | string
    | { name: string; order?: "ASC" | "DESC" }
    | Array<string | { name: string; order?: "ASC" | "DESC" }>,
  options?: {
    unique?: boolean
    ifNotExists?: boolean
    using?: string
    where?: string
    partial?: string
  }
): void
```

### Options

* `**unique**` — Create a `UNIQUE` index
* `**ifNotExists**` — Add `IF NOT EXISTS`
* `**using**` — Index method (`USING btree`, etc.)
* `**where**` **/** `**partial**` — `WHERE` clause for partial indexes (`partial` is an alias)


---

### Examples

**Simple index**

```typescript
db.createIndex("idx_users_email", "users", "email", { ifNotExists: true })
```

**Composite index with order**

```typescript
db.createIndex(
  "idx_users_active_created",
  "users",
  [
    { name: "active", order: "ASC" },
    { name: "created_at", order: "DESC" },
  ],
  { ifNotExists: true }
)
```

**Unique index**

```typescript
db.createIndex(
  "idx_users_username",
  "users",
  "username",
  { unique: true, ifNotExists: true }
)
```

**Partial index**

```typescript
db.createIndex(
  "idx_users_active",
  "users",
  "email",
  { partial: "active = 1" }
)
```

## Schema Introspection

```typescript
// Get database schema
const schema = db.getSchema();
console.log(schema);
/*
{
  users: {
    columns: ["id", "name", "email", "active"],
    ...
  },
  teams: { ... }
}
*/

// Check if table exists

const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
```

## Raw SQL

For complex queries not supported by the QueryBuilder:

```typescript
// Execute raw SQL
const results = db.exec<User[]>(`
  SELECT u.*, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
  GROUP BY u.id
  HAVING post_count > 5
`);

// With parameters
const user = db.exec<User>(
  "SELECT * FROM users WHERE email = ?",
  ["john@example.com"]
);
```

## Performance Considerations

### WAL Mode

Write-Ahead Logging provides better concurrent read/write performance:

```typescript
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"]
  ]
});
```

### Prepared Statements

The QueryBuilder uses prepared statements internally for optimal performance:

```typescript
// Queries are prepared and cached

for (let i = 0; i < 1000; i++) {
  users.select(["*"]).where({ id: i }).first();
  // Same prepared statement reused
}
```

### Bulk Operations

Use transactions for bulk operations:

```typescript
// Slow: each insert is a separate transaction
for (const user of userList) {
  users.insert(user);
}

// Fast: all inserts in one transaction
db.transaction(() => {
  for (const user of userList) {
    users.insert(user);
  }
});

// Or use insertMany
users.insertMany(userList);
```

## API Reference

### DB Class

| Method | Description |
|--------|-------------|
| `new DB(path, options?)` | Create database connection |
| `createTable<T>(name, schema, options?)` | Create table and return QueryBuilder |
| `transaction<T>(fn: () => T)` | Execute function in transaction |
| `exec<T>(sql, params?)` | Execute raw SQL |
| `getSchema()` | Get database schema |
| `close()` | Close database connection |

### QueryBuilder Methods

| Method | Description |
|--------|-------------|
| `select(columns)` | Start select query |
| `insert(data)` | Insert single row |
| `insertMany(data[])` | Insert multiple rows |
| `update(data)` | Start update query |
| `delete()` | Start delete query |
| `where(conditions)` | Add WHERE clause |
| `and(conditions)` | Add AND condition |
| `or(conditions)` | Add OR condition |
| `orderBy(column)` | Add ORDER BY |
| `.asc()` / `.desc()` | Set order direction |
| `limit(n)` | Limit results |
| `offset(n)` | Offset results |
| `all()` | Execute and return all rows |
| `first()` | Execute and return first row |
| `run()` | Execute and return result info |

### Column Helpers

| Method | SQLite Type | Description |
|--------|-------------|-------------|
| `column.id()` | INTEGER PRIMARY KEY | Auto-increment ID |
| `column.text(opts?)` | TEXT        | String column |
| `column.integer(opts?)` | INTEGER     | Integer column |
| `column.real(opts?)` | REAL        | Float column |
| `column.boolean(opts?)` | INTEGER     | Boolean (0/1) |
| `column.json(opts?)` | TEXT        | JSON serialized |
| `column.blob(opts?)` | BLOB        | Binary data |
| `column.createdAt()` | TEXT        | Auto timestamp |
| `column.generated(expr, type)` | varies      | Generated column |

## Integration with DockStat

This package is used throughout DockStat for data persistence:

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";
import DockStatDB from "@dockstat/db";
import DockerClient from "@dockstat/docker-client";

// DockStatDB uses sqlite-wrapper internally
const dockstatDb = new DockStatDB();

// Share the underlying DB with DockerClient
const dockerClient = new DockerClient(dockstatDb.getDB(), {
  enableMonitoring: true
});
```

## Related Packages

* `@dockstat/db` - Database layer built on sqlite-wrapper
* `@dockstat/docker-client` - Uses sqlite-wrapper for persistence
* `@dockstat/plugin-handler` - Plugin database tables
* `@dockstat/typings` - Type definitions

## License

MPL-2.0 — Part of the DockStat project.

## Contributing

Issues and PRs welcome at [github.com/Its4Nik/DockStat](https://github.com/Its4Nik/DockStat)