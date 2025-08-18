# @dockstat/sqlite-wrapper

A comprehensive TypeScript wrapper around Bun's `bun:sqlite` with type-safe table creation, advanced query building, and full SQLite feature support.

## Features

* **Type-safe table creation** with column helpers and comprehensive constraint support
* **Expressive QueryBuilder** with chainable operations for SELECT, INSERT, UPDATE, DELETE
* **Advanced WHERE conditions** including regex filtering, raw SQL, operators, and more
* **Conflict resolution** for INSERT operations (OR IGNORE, OR REPLACE, etc.)
* **Safety features** requiring WHERE conditions for UPDATE/DELETE operations
* **Full SQLite support** including JSON columns, generated columns, foreign keys, and more
* **Performance optimizations** with proper parameter binding and transaction support

---

## Quick Start

```ts
import { DB, column, sql } from "@dockstat/sqlite-wrapper";

interface User {
  id?: number;
  name: string;
  email: string;
  type: string;
  active?: boolean;
  metadata?: object;
  created_at?: number;
  updated_at?: number;
}

// Create database with optimized settings
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["synchronous", "NORMAL"],
    ["foreign_keys", "ON"],
    ["cache_size", -64000]
  ]
});

// Create table with type-safe column definitions
db.createTable("users", {
  id: column.id(), // INTEGER PRIMARY KEY AUTOINCREMENT
  name: column.text({ notNull: true }),
  email: column.text({ unique: true, notNull: true }),
  type: column.enum(["admin", "user", "guest"], { default: "user" }),
  active: column.boolean({ default: true }),
  metadata: column.json({ validateJson: true }),
  created_at: column.createdAt(), // Auto-timestamp
  updated_at: column.updatedAt()
});

// Query with the powerful QueryBuilder
const users = db.table<User>("users")
  .select(["id", "name", "email"])
  .where({ active: true })
  .whereRgx({ email: /@company\.com$/i })
  .orderBy("created_at")
  .desc()
  .limit(10)
  .all();

console.log(users);
```

---

## Table Creation

### Modern Column Helpers (Recommended)

Create tables with type-safe column definitions and comprehensive SQLite feature support:

```ts
import { DB, column, sql } from "@dockstat/sqlite-wrapper";

db.createTable("products", {
  // Primary keys and auto-increment
  id: column.id(), // INTEGER PRIMARY KEY AUTOINCREMENT
  uuid: column.uuid({ generateDefault: true }),
  
  // Text columns with constraints
  name: column.text({ notNull: true }),
  description: column.text({ length: 1000 }),
  sku: column.varchar(50, { unique: true }),
  
  // Numeric columns
  price: column.numeric({ precision: 10, scale: 2, check: "price > 0" }),
  quantity: column.integer({ default: 0, check: "quantity >= 0" }),
  weight: column.real(),
  
  // Boolean with validation
  active: column.boolean({ default: true }),
  
  // Enums with validation
  category: column.enum(["electronics", "clothing", "books"], {
    default: "electronics"
  }),
  
  // JSON data
  specifications: column.json({ validateJson: true }),
  tags: column.json(),
  
  // Dates and timestamps
  manufactured_date: column.date(),
  created_at: column.createdAt(), // Auto-managed
  updated_at: column.updatedAt(),
  
  // Foreign keys
  supplier_id: column.foreignKey("suppliers", "id", {
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  }),
  
  // Generated columns
  display_price: {
    type: "TEXT",
    generated: {
      expression: "printf('$%.2f', price)",
      stored: false // VIRTUAL column
    }
  }
}, {
  constraints: {
    // Table-level constraints
    unique: [["sku", "supplier_id"]], // Composite unique
    check: ["price > 0 OR category = 'free'"],
    foreignKeys: [{
      columns: ["supplier_id"],
      references: {
        table: "suppliers",
        columns: ["id"],
        onDelete: "CASCADE"
      }
    }]
  },
  comment: "Product catalog with full specifications"
});
```

### Available Column Types

```ts
// Integer types
column.integer()
column.integer({ size: "BIGINT" })
column.id() // INTEGER PRIMARY KEY AUTOINCREMENT

// Text types
column.text()
column.varchar(255)
column.char(10)
column.uuid()

// Numeric types
column.real()
column.numeric({ precision: 10, scale: 2 })
column.numeric({ variant: "DECIMAL" })

// Date/Time types
column.date()
column.time()
column.datetime()
column.timestamp()
column.createdAt() // Auto-managed creation timestamp
column.updatedAt() // Auto-managed update timestamp

// Special types
column.boolean() // INTEGER with CHECK constraint
column.json() // TEXT with optional validation
column.blob()
column.enum(["value1", "value2"])

// Foreign keys
column.foreignKey("other_table", "other_column", {
  onDelete: "CASCADE",
  onUpdate: "RESTRICT"
})
```

### Column Constraints

All column helpers support comprehensive constraints:

```ts
column.text({
  notNull: true,
  unique: true,
  default: "default_value",
  check: "length(column_name) > 0",
  collate: "NOCASE",
  comment: "User description"
})

// Default value expressions
column.timestamp({
  default: sql.currentTimestamp()
})

column.text({
  default: sql.raw("upper(hex(randomblob(16)))")
})
```

### Legacy Table Creation

Object-style (still supported):

```ts
db.createTable("posts", {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  title: "TEXT NOT NULL",
  body: "TEXT",
  author_id: "INTEGER NOT NULL",
  published: "INTEGER NOT NULL DEFAULT 0"
}, { ifNotExists: true });
```

String-style (still supported):

```ts
db.createTable("events", `
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
`);
```

---

## Query Building

### SELECT Operations

```ts
// Basic selection
const users = db.table<User>("users")
  .select(["id", "name", "email"])
  .where({ active: true })
  .all();

// Complex conditions
const results = db.table<User>("users")
  .where({ type: "admin" })
  .whereIn("id", [1, 2, 3, 4, 5])
  .whereOp("created_at", ">", Date.now() - 86400000)
  .whereRaw("name LIKE ?", ["%admin%"])
  .whereRgx({ email: /@company\.com$/i }) // Client-side regex
  .orderBy("created_at")
  .desc()
  .limit(50)
  .offset(100)
  .all();

// Result methods
const allUsers = db.table<User>("users").all();
const firstUser = db.table<User>("users").first();
const singleUser = db.table<User>("users").where({ id: 1 }).get();
const userCount = db.table<User>("users").where({ active: true }).count();
const userExists = db.table<User>("users").where({ email: "test@example.com" }).exists();

// Single values
const userName = db.table<User>("users").where({ id: 1 }).value("name");
const allNames = db.table<User>("users").pluck("name");
```

### INSERT Operations

```ts
// Single insert
const result = db.table<User>("users").insert({
  name: "John Doe",
  email: "john@example.com",
  type: "user"
});
console.log(`Inserted user with ID: ${result.insertId}`);

// Bulk insert
const users = [
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" }
];
const bulkResult = db.table<User>("users").insert(users);

// Conflict resolution
db.table<User>("users").insertOrIgnore(userData);
db.table<User>("users").insertOrReplace(userData);

// Custom conflict resolution
db.table<User>("users").insert(userData, {
  orIgnore: true,
  orReplace: false,
  orAbort: false,
  orFail: false,
  orRollback: false
});

// Insert and get back the row
const newUser = db.table<User>("users").insertAndGet({
  name: "Jane",
  email: "jane@example.com"
});

// Batch insert with transaction
db.table<User>("users").insertBatch(largeUserArray);
```

### UPDATE Operations

All UPDATE operations require WHERE conditions for safety:

```ts
// Basic update
const result = db.table<User>("users")
  .where({ id: 1 })
  .update({ name: "Updated Name" });

// Complex conditions
db.table<User>("users")
  .where({ type: "user" })
  .whereRgx({ email: /@oldcompany\.com$/i })
  .update({ type: "migrated_user" });

// Increment/decrement
db.table<User>("users")
  .where({ id: 1 })
  .increment("login_count", 1);

// Upsert (insert or update)
db.table<User>("users").upsert({
  id: 1,
  name: "John",
  email: "john@example.com"
});

// Update and get affected rows
const updatedUsers = db.table<User>("users")
  .where({ active: false })
  .updateAndGet({ active: true });

// Batch update
db.table<User>("users").updateBatch([
  { where: { id: 1 }, data: { name: "User 1" } },
  { where: { id: 2 }, data: { name: "User 2" } }
]);
```

### DELETE Operations

All DELETE operations require WHERE conditions for safety:

```ts
// Basic delete
const result = db.table<User>("users")
  .where({ active: false })
  .delete();

// Complex conditions
db.table<User>("users")
  .where({ type: "temporary" })
  .whereOp("created_at", "<", Date.now() - 604800000)
  .delete();

// Delete and get deleted rows
const deletedUsers = db.table<User>("users")
  .where({ active: false })
  .deleteAndGet();

// Soft delete
db.table<User>("users")
  .where({ id: 1 })
  .softDelete("deleted_at", Date.now());

// Restore soft deleted
db.table<User>("users")
  .where({ id: 1 })
  .restore("deleted_at");

// Utility methods
db.table<User>("users").deleteOlderThan("created_at", Date.now() - 2592000000);
db.table<User>("users").deleteDuplicates(["email"]);
db.table<User>("users").truncate(); // Delete all rows

// Batch delete
db.table<User>("users").deleteBatch([
  { type: "temp" },
  { active: false }
]);
```

---

## Advanced Features

### JSON Column Support

```ts
interface UserWithMetadata {
  id: number;
  name: string;
  metadata: {
    preferences: object;
    settings: object;
  };
}

// Configure JSON columns for automatic serialization/deserialization
const users = db.table<UserWithMetadata>("users", {
  jsonColumns: ["metadata"]
});

// Insert with automatic JSON serialization
users.insert({
  name: "John",
  metadata: {
    preferences: { theme: "dark" },
    settings: { notifications: true }
  }
});

// Query returns properly deserialized objects
const user = users.where({ id: 1 }).first();
console.log(user.metadata.preferences.theme); // "dark"
```

### Regex Filtering

```ts
// Client-side regex filtering
const gmailUsers = db.table<User>("users")
  .where({ active: true }) // SQL filter first
  .whereRgx({ email: /@gmail\.com$/i }) // Then regex filter
  .all();

// Multiple regex conditions
const results = db.table<User>("users")
  .whereRgx({
    email: /@(gmail|yahoo)\.com$/i,
    name: /^[A-Z]/
  })
  .all();
```

### Raw SQL and Advanced Conditions

```ts
// Raw WHERE expressions
db.table<User>("users")
  .whereRaw("created_at > ? AND (type = ? OR type = ?)", [
    Date.now() - 86400000,
    "admin",
    "moderator"
  ])
  .all();

// Operator helpers
db.table<User>("users")
  .whereOp("created_at", ">=", startDate)
  .whereOp("created_at", "<=", endDate)
  .whereOp("name", "LIKE", "%john%")
  .all();

// BETWEEN clauses
db.table<User>("users")
  .whereBetween("created_at", startDate, endDate)
  .whereNotBetween("age", 0, 18)
  .all();

// NULL checks
db.table<User>("users")
  .whereNull("deleted_at")
  .whereNotNull("email")
  .all();

// IN clauses
db.table<User>("users")
  .whereIn("type", ["admin", "moderator"])
  .whereNotIn("status", ["banned", "suspended"])
  .all();
```

### Database Configuration

```ts
// Constructor options
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["synchronous", "NORMAL"],
    ["foreign_keys", "ON"],
    ["cache_size", -64000],
    ["temp_store", "memory"]
  ],
  loadExtensions: [
    "/path/to/regexp_extension.so"
  ]
});

// Runtime PRAGMA management
db.pragma("cache_size", -32000);
const journalMode = db.pragma("journal_mode");

// Extension loading
db.loadExtension("/path/to/custom_extension.so");

// Database info
const tableInfo = db.getTableInfo("users");
const foreignKeys = db.getForeignKeys("users");
const indexes = db.getIndexes("users");
```

---

## Performance Considerations

### Query Optimization

1. **Use SQL filters before regex**: Always use `.where()` conditions to reduce the dataset before applying `.whereRgx()` filters.

```ts
// Good: SQL filter first, then regex
db.table<User>("users")
  .where({ active: true, type: "user" }) // Reduces dataset
  .whereRgx({ email: /@company\.com$/i }) // Then regex filter
  .all();

// Avoid: Regex on entire table
db.table<User>("users")
  .whereRgx({ email: /@company\.com$/i })
  .all();
```

2. **Use appropriate indexes**: Create indexes on frequently queried columns.

```ts
db.createIndex("idx_users_email", "users", "email", { unique: true });
db.createIndex("idx_users_created_at", "users", "created_at");
db.createIndex("idx_users_type_active", "users", ["type", "active"]);
```

3. **Batch operations**: Use bulk operations for better performance.

```ts
// Good: Bulk insert
db.table<User>("users").insertBatch(largeArray);

// Avoid: Individual inserts
largeArray.forEach(user => db.table<User>("users").insert(user));
```

### Transaction Management

```ts
// Manual transactions
db.begin();
try {
  db.table<User>("users").insert(userData1);
  db.table<User>("users").insert(userData2);
  db.commit();
} catch (error) {
  db.rollback();
  throw error;
}

// Automatic transaction wrapper
const result = db.transaction(() => {
  const user = db.table<User>("users").insert(userData);
  db.table("audit_log").insert({ action: "user_created", user_id: user.insertId });
  return user;
});
```

### Memory and Performance Tips

- Use `PRAGMA cache_size` to tune memory usage
- Enable WAL mode for better concurrency
- Use `PRAGMA optimize` periodically for query optimization
- Consider `WITHOUT ROWID` tables for specific use cases
- Use `PRAGMA vacuum` to reclaim space after large deletions

---

## Error Handling and Safety

### Required WHERE Conditions

UPDATE and DELETE operations require WHERE conditions to prevent accidental data modification:

```ts
// This will throw an error
try {
  db.table<User>("users").update({ active: false });
} catch (error) {
  console.error("UPDATE requires WHERE conditions");
}

// This is safe
db.table<User>("users")
  .where({ type: "temporary" })
  .update({ active: false });
```

### Type Safety

The library provides comprehensive TypeScript support:

```ts
interface StrictUser {
  id: number;
  name: string;
  email: string;
}

const users = db.table<StrictUser>("users");

// TypeScript will enforce correct column names
users.select(["id", "name"]); // ✓ Valid
users.select(["invalid_column"]); // ✗ TypeScript error

// TypeScript will enforce correct data types
users.insert({ name: "John", email: "john@example.com" }); // ✓ Valid
users.insert({ name: 123 }); // ✗ TypeScript error
```

### Parameter Binding

All queries use proper parameter binding to prevent SQL injection:

```ts
// Safe - uses parameter binding
db.table<User>("users")
  .whereRaw("name = ? AND email = ?", [userName, userEmail])
  .all();

// Parameters are automatically escaped
db.table<User>("users")
  .where({ name: "O'Reilly" }) // Automatically handled
  .all();
```

---

## API Reference

### DB Class

```ts
constructor(path: string, options?: {
  pragmas?: Array<[string, any]>;
  loadExtensions?: string[];
})

// Table operations
table<T>(tableName: string, jsonConfig?: JsonColumnConfig<T>): QueryBuilder<T>
createTable(tableName: string, columns: CreateTableColumns, options?: TableOptions): void
dropTable(tableName: string, options?: { ifExists?: boolean }): void

// Index operations
createIndex(name: string, table: string, columns: string | string[], options?: IndexOptions): void
dropIndex(name: string, options?: { ifExists?: boolean }): void

// Database operations
pragma(name: string, value?: any): any
loadExtension(path: string): void
exec(sql: string): void
prepare(sql: string): Statement
transaction<T>(fn: () => T): T
begin(): void
commit(): void
rollback(): void
close(): void

// Introspection
getTableInfo(tableName: string): TableInfo[]
getForeignKeys(tableName: string): ForeignKeyInfo[]
getIndexes(tableName: string): IndexInfo[]
getSchema(): SchemaInfo[]
```

### QueryBuilder Class

```ts
// WHERE conditions
where(conditions: WhereCondition<T>): this
whereRgx(conditions: RegexCondition<T>): this
whereRaw(expr: string, params?: any[]): this
whereExpr(expr: string, params?: any[]): this
whereIn(column: keyof T, values: any[]): this
whereNotIn(column: keyof T, values: any[]): this
whereOp(column: keyof T, op: string, value: any): this
whereBetween(column: keyof T, min: any, max: any): this
whereNotBetween(column: keyof T, min: any, max: any): this
whereNull(column: keyof T): this
whereNotNull(column: keyof T): this

// SELECT operations
select(columns: ColumnNames<T>): this
orderBy(column: keyof T): this
asc(): this
desc(): this
limit(amount: number): this
offset(start: number): this

// Result execution
all(): T[]
get(): T | null
first(): T | null
count(): number
exists(): boolean
value<K extends keyof T>(column: K): T[K] | null
pluck<K extends keyof T>(column: K): T[K][]

// INSERT operations
insert(data: Partial<T> | Partial<T>[], options?: InsertOptions): InsertResult
insertOrIgnore(data: Partial<T> | Partial<T>[]): InsertResult
insertOrReplace(data: Partial<T> | Partial<T>[]): InsertResult
insertAndGet(data: Partial<T>, options?: InsertOptions): T | null
insertBatch(rows: Partial<T>[], options?: InsertOptions): InsertResult

// UPDATE operations
update(data: Partial<T>): UpdateResult
upsert(data: Partial<T>): UpdateResult
increment(column: keyof T, amount?: number): UpdateResult
decrement(column: keyof T, amount?: number): UpdateResult
updateAndGet(data: Partial<T>): T[]
updateBatch(updates: Array<{ where: Partial<T>; data: Partial<T> }>): UpdateResult

// DELETE operations
delete(): DeleteResult
deleteAndGet(): T[]
softDelete(deletedColumn?: keyof T, deletedValue?: any): DeleteResult
restore(deletedColumn?: keyof T): DeleteResult
deleteBatch(conditions: Array<Partial<T>>): DeleteResult
truncate(): DeleteResult
deleteOlderThan(timestampColumn: keyof T, olderThan: number): DeleteResult
deleteDuplicates(columns: Array<keyof T>): DeleteResult
```

### Result Types

```ts
interface InsertResult {
  insertId: number;
  changes: number;
}

interface UpdateResult {
  changes: number;
}

interface DeleteResult {
  changes: number;
}

interface InsertOptions {
  orIgnore?: boolean;
  orReplace?: boolean;
  orAbort?: boolean;
  orFail?: boolean;
  orRollback?: boolean;
}
```

---

## Examples

### E-commerce Product Catalog

```ts
import { DB, column, sql } from "@dockstat/sqlite-wrapper";

interface Product {
  id?: number;
  name: string;
  sku: string;
  price: number;
  category: string;
  specifications?: object;
  active?: boolean;
  created_at?: number;
  updated_at?: number;
}

const db = new DB("ecommerce.db");

// Create products table
db.createTable("products", {
  id: column.id(),
  name: column.text({ notNull: true }),
  sku: column.varchar(50, { unique: true, notNull: true }),
  price: column.numeric({ precision: 10, scale: 2, check: "price > 0" }),
  category: column.enum(["electronics", "clothing", "books"], {
    default: "electronics"
  }),
  specifications: column.json({ validateJson: true }),
  active: column.boolean({ default: true }),
  created_at: column.createdAt(),
  updated_at: column.updatedAt()
});

// Query products
const activeProducts = db.table<Product>("products")
  .where({ active: true })
  .whereOp("price", "<=", 100)
  .orderBy("created_at")
  .desc()
  .all();

// Update pricing
db.table<Product>("products")
  .where({ category: "electronics" })
  .whereOp("price", ">", 1000)
  .increment("price", -50); // $50 discount
```

### User Management System

```ts
interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  profile?: object;
  active?: boolean;
  last_login?: number;
  created_at?: number;
}

// Create users with comprehensive constraints
db.createTable("users", {
  id: column.id(),
  username: column.varchar(50, { 
    unique: true, 
    notNull: true,
    check: "length(username) >= 3"
  }),
  email: column.text({ 
    unique: true, 
    notNull: true,
    check: "email LIKE '%@%.%'"
  }),
  role: column.enum(["admin", "moderator", "user"], { default: "user" }),
  profile: column.json(),
  active: column.boolean({ default: true }),
  last_login: column.timestamp(),
  created_at: column.createdAt()
}, {
  constraints: {
    unique: [["username", "email"]]
  }
});

// Find inactive users
const inactiveUsers = db.table<User>("users")
  .where({ active: true })
  .whereOp("last_login", "<", Date.now() - 2592000000) // 30 days
  .all();

// Bulk role assignment
db.table<User>("users")
  .whereIn("id", [1, 2, 3, 4, 5])
  .update({ role: "moderator" });
```

This comprehensive wrapper provides everything you need for robust SQLite operations in TypeScript applications with type safety, performance optimizations, and modern development practices.