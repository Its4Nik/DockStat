# @dockstat/sqlite-wrapper

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

**A fast, type-safe TypeScript wrapper for Bun's `bun:sqlite`.**
Schema-first table helpers, an expressive chainable QueryBuilder, safe defaults (WHERE required for destructive ops), JSON + generated columns, and production-minded pragmas & transactions.

## Install
> Requires **Bun** runtime

```bash
bun add @dockstat/sqlite-wrapper
````

## 10-second quickstart

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";

type User = {
  id?: number,
  name: string,
  active: boolean,
  email: string,
}

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode","WAL"],
    ["foreign_keys","ON"]
  ]
});

const userTable = db.createTable<User>("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  active: column.boolean(),
  email: column.text({ unique: true, notNull: true }),
  created_at: column.createdAt()
});

const users = userTable
  .select(["id","name","email"])
  .where({ active: true })
  .orderBy("created_at").desc()
  .limit(10)
  .all();
```

## Why use it?

* ⚡ Bun-native, high-performance bindings
* 🔒 Type-safe table & query APIs (compile-time checks)
* 🧭 Full SQLite feature support: JSON, generated columns, foreign keys, indexes
* 🛡️ Safety-first defaults — prevents accidental full-table updates/deletes
* 🚀 Designed for production workflows: WAL, pragmatic PRAGMAs, bulk ops, transactions

## Core Features

### Type Safety

* **Compile-time validation** of column names and data shapes
* **IntelliSense support** for all operations
* **Generic interfaces** that adapt to your data models
* **Type-safe column definitions** with comprehensive constraint support

### Safety-First Design

* **Mandatory WHERE conditions** for UPDATE and DELETE operations to prevent accidental data loss
* **Parameter binding** for all queries to prevent SQL injection
* **Prepared statements** used internally for optimal performance
* **Transaction support** with automatic rollback on errors

### Production Ready

* **WAL mode** support for concurrent read/write operations
* **Comprehensive PRAGMA management** for performance tuning
* **Connection pooling** considerations built-in
* **Bulk operation** support with transaction batching
* **Schema introspection** tools for migrations and debugging

### Complete SQLite Support

* **All SQLite data types** with proper TypeScript mappings
* **Generated columns** (both VIRTUAL and STORED)
* **Foreign key constraints** with cascade options
* **JSON columns** with validation and transformation
* **Full-text search** preparation
* **Custom functions** and extensions support

## Docs & examples

See full technical docs [here](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99/doc/dockstatsqlite-wrapper-Lxt4IphXI5).

## License

MPL-2.0 — maintained by Dockstat. Contributions welcome.
