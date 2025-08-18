|  ![Bun](/api/files.get?key=public/ef4b5dd4-3cf1-44e1-9b23-87ccfd5473b8/acb34d35-0045-4d8b-bbe6-82aecd1f0a2b/Bun-%2523000000.svg " =154x60") |  ![TypeScript](/api/files.get?key=public/ef4b5dd4-3cf1-44e1-9b23-87ccfd5473b8/f532b94e-382a-49c9-92d0-1cffc27061b0/typescript-%2523007ACC.svg " =272x60") |  ![SQLite](/api/files.get?key=public/ef4b5dd4-3cf1-44e1-9b23-87ccfd5473b8/75464dcb-8e70-400c-bf8b-0127aef068a0/sqlite-%252307405e.svg " =197x60") |
|----|----|----|

  

> Detailed reference and patterns for building reliable, typed local databases with Bun's `bun:sqlite`.

## Overview

`@dockstat/sqlite-wrapper` wraps Bun's `bun:sqlite` with an ergonomically typed API:

* Schema-first helpers (`column.*`) for safe table creation.
* Chainable `QueryBuilder<T>` with common SQL operations as methods.
* TypeScript-first: column names and query results are checked at compile time.
* Built with production operability in mind: PRAGMA configuration, WAL, transactions, bulk ops and indexes.


---

## Design principles


1. **Type safety** — catch incorrect column names and shapes at compile time.
2. **Safety defaults** — avoid footguns (e.g., require `WHERE` for `UPDATE`/`DELETE`).
3. **Sane performance defaults** — WAL, prepared statements, parameter binding.
4. **Schema ergonomics** — expressive helpers that map closely to SQLite features.
5. **Small surface area** — focused API consistent with SQL semantics.


---

## Getting started

```typescript
import { DB, column, sql } from "@dockstat/sqlite-wrapper";

const db = new DB("app.db", {
  pragmas: [
    ["journal_mode","WAL"],
    ["synchronous","NORMAL"],
    ["foreign_keys","ON"],
    ["cache_size",-64000]
  ],
  loadExtensions: []
});
```

`DB` opens (or creates) the file and applies the given pragmas.


---

## DB — core class

**Constructor**

```typescript
new DB(path: string, options?: {
  pragmas?: Array<[string, any]>,
  loadExtensions?: string[]
})
```

**Key methods**

* `table<T>(name: string, jsonConfig?: JsonColumnConfig<T>): QueryBuilder<T>`
* `createTable(name: string, columns: CreateTableColumns, options?: TableOptions): void`
* `dropTable(name: string, options?: { ifExists?: boolean })`
* `createIndex(name, table, columns, opts?)`
* `pragma(name, value?)`
* `loadExtension(path)`
* `transaction<T>(fn: () => T): T`
* `begin() / commit() / rollback()`
* `getTableInfo(name)`, `getForeignKeys(name)`, `getIndexes(name)`, `getSchema()`
* `close()`


---

## Table creation & column helpers

Use `column` helpers to declare typed columns:

**Examples**

```typescript
db.createTable("products", {
  id: column.id(),                       // INTEGER PRIMARY KEY AUTOINCREMENT
  uuid: column.uuid({ generateDefault: true }),
  name: column.text({ notNull: true }),
  sku: column.varchar(50, { unique: true }),
  price: column.numeric({ precision: 10, scale: 2, check: "price > 0" }),
  specifications: column.json({ validateJson: true }),
  category: column.enum(["electronics","clothing","books"], { default: "electronics" }),
  created_at: column.createdAt(),
  updated_at: column.updatedAt(),
  supplier_id: column.foreignKey("suppliers", "id", { onDelete: "SET NULL" })
}, {
  constraints: {
    unique: [["sku","supplier_id"]],
    check: ["price > 0 OR category = 'free'"]
  },
  comment: "Product catalog"
});
```

**Supported column types**

* Integer: `integer()`, `id()`, `integer({ size: "BIGINT" })`
* Text: `text()`, `varchar(n)`, `char(n)`, `uuid()`
* Numeric: `real()`, `numeric({ precision, scale })`
* Date/time: `date()`, `time()`, `timestamp()`, `createdAt()`, `updatedAt()`
* Special: `boolean()`, `json({ validateJson })`, `blob()`, `enum([...])`
* Foreign key: `foreignKey(table, column, opts)`

**Generated columns**

```typescript
display_price: {
  type: "TEXT",
  generated: {
    expression: "printf('$%.2f', price)",
    stored: false // VIRTUAL
  }
}
```


---

## `QueryBuilder` — patterns & methods

`const q = db.table<T>("name")` returns a strongly typed `QueryBuilder<T>`.

**Selection**

* `select(columns: Array<keyof T>)`
* `all()`, `first()`, `get()`, `count()`, `exists()`, `value(col)`, `pluck(col)`

**Filters**

* `where(conditions: Partial<T>)` (object equality)
* `whereOp(column, op, val)` (>, <, LIKE, etc.)
* `whereIn(column, values)`, `whereNotIn(...)`
* `whereBetween(column, min, max)`, `whereNotBetween(...)`
* `whereRaw(sqlString, params?)` — use bindings
* `whereRgx(conditions)` — client-side regex filter applied *after* SQL filters

**Ordering & pagination**

* `orderBy(column)`, `asc()`, `desc()`, `limit(n)`, `offset(n)`

**Mutations**

* `insert(row | rows)`, `insertBatch(rows)`, `insertOrIgnore`, `insertOrReplace`, `insertAndGet`
* `update(data)` — **requires** `where()` (throws otherwise)
* `upsert(data)`
* `increment(column, amount)`, `decrement(...)`
* `updateAndGet(data)`
* `delete()` — **requires** `where()`
* `deleteAndGet()`, `softDelete(col, value)`, `restore(col)`, `truncate()`

**Examples**

```typescript
// read

const recent = db.table<User>("users")
  .whereOp("created_at", ">", Date.now()-86400000)
  .orderBy("created_at").desc()
  .limit(50)
  .all();

// upsert

db.table("users").upsert({ id: 1, name: "Alex" });

// batch insert in transaction

db.transaction(() => {
  db.table("users").insertBatch(bigArray);
});
```


---

## Transactions & concurrency

* Prefer `db.transaction(() => { ... })` for automatic commit/rollback.
* For multi-statement explicit control: `begin()`, `commit()`, `rollback()`.
* Use WAL mode (`PRAGMA journal_mode=WAL`) for concurrent readers + writers.
* For big migrations, combine `transaction` + `pragma("synchronous","OFF")` temporarily (but ensure power-failure considerations).


---

## Performance tuning

* **WAL**: `PRAGMA journal_mode = WAL` for concurrent reads/writes.
* **cache_size**: tune with `PRAGMA cache_size = -64000` (negative means KB).
* **Indexes**: add indexes on columns used in `WHERE`/`ORDER BY`.
* **Batch writes**: use `insertBatch` inside transactions for throughput.
* **Avoid client-side regex on large datasets**: always reduce with SQL `where` first.
* **VACUUM / optimize** periodically after big deletes.


---

## Introspection & migrations

* `getTableInfo(table)`: column list & constraints.
* `getForeignKeys(table)`: foreign key details.
* `getIndexes(table)`: index metadata.
* `getSchema()`: dump schema for migration tooling.

**Migrations pattern**


1. Create a new table with desired schema.
2. `INSERT INTO new_table SELECT ... FROM old_table` (map columns).
3. `DROP TABLE old_table` and `ALTER TABLE new_table RENAME TO old_table`.
4. Wrap migration in `db.transaction()` and snapshot schema via `getSchema()` before changes.


---

## Safety, errors & best practices

* `UPDATE`/`DELETE` without a `WHERE` throws. Intentionally run full-table ops with explicit `truncate()` or `whereRaw("1=1", [])` and a clear comment.
* Prefer `insertAndGet` for immediate row retrieval when you need generated IDs.
* Use `column.json({ validateJson: true })` to enforce JSON at write time.
* Use parameterized `whereRaw` rather than concatenated SQL to avoid injection.


---

## Examples

### e-commerce product example

```typescript
interface Product { 
  id?: number; 
  name: string; 
  sku: string; 
  price: number; 
  category: string 
}

db.createTable("products", { /* as earlier */ });

db.table<Product>("products")
  .whereOp("price", "<=", 100)
  .orderBy("created_at")
  .desc()
  .all();
```

### bulk migration

```typescript
db.transaction(() => {
  db.createTable("products_new", { /* new schema */ });
  db.exec(`INSERT INTO products_new (id, name, sku, price) SELECT id, name, sku, price FROM products_old`);
  db.dropTable("products_old");
  db.exec(`ALTER TABLE products_new RENAME TO products`);
});
```


---

## FAQ & troubleshooting

**Q: Can I use this in Node?** A: No — this wrapper targets Bun's `bun:sqlite`. Use a Node SQLite client for Node.

**Q: Why is** `**.whereRgx()**` **client-side?** A: SQLite doesn't support JS regex by default; running regex client-side keeps SQL efficient while giving expressive filters.

**Q: Large DB file — memory issues?** A: Tune `PRAGMA cache_size`, consider `temp_store = MEMORY`, and avoid loading entire tables into memory (paginate with `limit`/`offset`).


---

## Contributing & Tests

* Fork + PR; tests should include reproducible DB fixtures.
* Performance PRs must include benchmark script and before/after numbers.
* Keep PRs small & focused.


---


\