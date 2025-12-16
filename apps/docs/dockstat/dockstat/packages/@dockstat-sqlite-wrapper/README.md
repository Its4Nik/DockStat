---
id: 56229547-5cee-49ff-be41-1b75e7548809
title: "@dockstat/sqlite-wrapper"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 75d80211-7262-4064-aaa6-2ead20e17f43
updatedAt: 2025-12-16T17:26:01.048Z
urlId: Lxt4IphXI5
---

# @dockstat/sqlite-wrapper

 ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)    ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)    ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

**A comprehensive, type-safe TypeScript wrapper for Bun's** `**bun:sqlite**`**.**

This library provides a complete SQLite interface with schema-first table helpers, an expressive chainable QueryBuilder, type-safe operations, production-ready defaults, and comprehensive SQLite feature support including JSON columns, generated columns, foreign keys, and advanced query capabilities.

## Installation

> **Requirements:** Bun runtime v1.0.0 or higher

```bash
bun add @dockstat/sqlite-wrapper
```

## Quick Start

```typescript
import { DB, column } from "@dockstat/sqlite-wrapper";

// Create database with production-ready defaults
const db = new DB("app.db", { 
  pragmas: [
    ["journal_mode", "WAL"], 
    ["foreign_keys", "ON"],
    ["synchronous", "NORMAL"],
    ["cache_size", -64000]
  ] 
});

// Define schema with type-safe column helpers
db.createTable("users", {
  id: column.id(),
  name: column.text({ notNull: true }),
  email: column.text({ unique: true, notNull: true }),
  active: column.boolean({ default: true }),
  metadata: column.json({ validateJson: true }),
  created_at: column.createdAt(),
  updated_at: column.updatedAt()
});

// Type-safe queries with IntelliSense
interface User {
  id?: number;
  name: string;
  email: string;
  active?: boolean;
  metadata?: any;
  created_at?: number;
  updated_at?: number;
}

const users = db.table<User>("users")
  .select(["id", "name", "email"])
  .where({ active: true })
  .orderBy("created_at").desc()
  .limit(10)
  .all();
```

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

## Database Management

### DB Class

The `DB` class is the main entry point for database operations:

```typescript
import { DB } from "@dockstat/sqlite-wrapper";

// Basic usage
const db = new DB("database.db");

// With configuration
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],        // Enable WAL mode for concurrency
    ["foreign_keys", "ON"],         // Enable foreign key constraints
    ["synchronous", "NORMAL"],      // Balance between safety and speed
    ["cache_size", -64000],         // 64MB cache (negative = KB)
    ["temp_store", "MEMORY"],       // Store temp tables in memory
    ["mmap_size", 268435456]        // 256MB memory-mapped I/O
  ],
  loadExtensions: [
    "/path/to/extension.so"         // Load SQLite extensions
  ]
});

// In-memory database for testing
const testDb = new DB(":memory:");
```

### Database Operations

```typescript
// Get direct access to underlying SQLite database
const sqliteDb = db.getDb();

// Execute raw SQL
db.exec("CREATE INDEX idx_users_email ON users(email)");

// Prepare statements for repeated use
const stmt = db.prepare("SELECT * FROM users WHERE active = ?");
const activeUsers = stmt.all(1);

// PRAGMA operations
db.pragma("journal_mode", "WAL");
const journalMode = db.pragma("journal_mode"); // Get current value

// Database maintenance
db.vacuum();                    // Reclaim space
db.analyze();                   // Update query planner statistics
db.analyze("users");            // Analyze specific table

// Schema introspection
const tableInfo = db.getTableInfo("users");
const foreignKeys = db.getForeignKeys("orders");
const indexes = db.getIndexes("users");
const fullSchema = db.getSchema();

// Integrity checking
const integrityResults = db.integrityCheck();

// Connection management
db.close();
```

## Schema Definition

### Column Types and Helpers

The library provides comprehensive column helpers that map to SQLite's type system:

```typescript
import { column, sql } from "@dockstat/sqlite-wrapper";

db.createTable("comprehensive_example", {
  // Primary keys and IDs
  id: column.id(),                                    // INTEGER PRIMARY KEY AUTOINCREMENT
  uuid: column.uuid({ generateDefault: true }),       // TEXT with UUID generation
  
  // Text columns
  name: column.text({ notNull: true }),               // TEXT NOT NULL
  description: column.text({ length: 500 }),         // TEXT with length hint
  title: column.varchar(255, { unique: true }),      // VARCHAR(255) UNIQUE
  code: column.char(10, { notNull: true }),          // CHAR(10) NOT NULL
  
  // Numeric columns
  price: column.numeric({ 
    precision: 10, 
    scale: 2, 
    check: "price >= 0" 
  }),                                                 // NUMERIC(10,2) with constraint
  weight: column.real({ check: "weight > 0" }),      // REAL with constraint
  count: column.integer({ default: 0 }),             // INTEGER DEFAULT 0
  big_number: column.integer({ size: "BIGINT" }),    // BIGINT
  
  // Boolean (stored as INTEGER with constraint)
  active: column.boolean({ default: true }),         // INTEGER CHECK (active IN (0,1)) DEFAULT 1
  verified: column.boolean(),                        // INTEGER CHECK (verified IN (0,1))
  
  // Date/Time columns
  created_date: column.date(),                       // DATE (stored as TEXT)
  event_time: column.time(),                         // TIME (stored as TEXT)
  created_at: column.timestamp(),                    // INTEGER timestamp
  updated_at: column.timestamp({ asText: true }),    // TEXT timestamp
  expires_at: column.datetime({
    default: sql.raw("datetime('now', '+1 year')")
  }),                                                // DATETIME with expression default
  
  // Special columns
  status: column.enum([
    "pending", "active", "inactive", "deleted"
  ], { default: "pending" }),                        // TEXT with CHECK constraint
  
  metadata: column.json({ 
    validateJson: true,
    comment: "Stored as JSON text with validation"
  }),                                                // TEXT with JSON validation
  
  file_data: column.blob(),                          // BLOB for binary data
  
  // Foreign keys
  user_id: column.foreignKey("users", "id", {
    onDelete: "CASCADE",
    onUpdate: "RESTRICT"
  }),                                                // INTEGER with FK constraint
  
  category_id: column.foreignKey("categories", "uuid", {
    type: "TEXT",                                    // Match referenced column type
    onDelete: "SET NULL"
  }),
  
  // Generated columns
  full_name: {
    type: "TEXT",
    generated: {
      expression: "first_name || ' ' || last_name",
      stored: false                                  // VIRTUAL column
    }
  },
  
  search_text: {
    type: "TEXT",
    generated: {
      expression: "lower(name || ' ' || coalesce(description, ''))",
      stored: true                                   // STORED column (can be indexed)
    }
  },
  
  // Timestamp helpers
  created_at: column.createdAt(),                    // Auto-managed creation time
  updated_at: column.updatedAt()                     // Auto-managed update time
});
```

### Table Options and Constraints

```typescript
// Advanced table creation with constraints
db.createTable("orders", {
  id: column.id(),
  order_number: column.varchar(50),
  customer_id: column.integer(),
  total: column.numeric({ precision: 10, scale: 2 }),
  status: column.enum(["pending", "paid", "shipped", "delivered"]),
  created_at: column.createdAt()
}, {
  // Table-level constraints
  constraints: {
    // Composite primary key (alternative to column.id())
    primaryKey: ["customer_id", "order_number"],
    
    // Unique constraints
    unique: [
      ["customer_id", "order_number"],              // Single composite unique
      [["email"], ["phone"]]                        // Multiple unique constraints
    ],
    
    // Check constraints
    check: [
      "total >= 0",
      "status IN ('pending', 'paid', 'shipped', 'delivered')"
    ],
    
    // Foreign key constraints
    foreignKeys: [{
      columns: ["customer_id"],
      references: {
        table: "customers",
        columns: ["id"],
        onDelete: "CASCADE",
        onUpdate: "RESTRICT"
      }
    }]
  },
  
  // Table options
  ifNotExists: true,                                 // CREATE TABLE IF NOT EXISTS
  temporary: false,                                  // CREATE TEMPORARY TABLE
  withoutRowId: false,                              // CREATE TABLE ... WITHOUT ROWID
  comment: "Customer order records"                  // Metadata comment
});
```

### Index Management

```typescript
// Create indexes for performance
db.createIndex("idx_users_email", "users", "email", {
  unique: true,
  ifNotExists: true
});

// Composite index
db.createIndex("idx_orders_customer_date", "orders", 
  ["customer_id", "created_at"], 
  { ifNotExists: true }
);

// Partial index with WHERE clause
db.createIndex("idx_active_users", "users", "email", {
  where: "active = 1 AND deleted_at IS NULL"
});

// Drop indexes
db.dropIndex("idx_old_index", { ifExists: true });
```

## QueryBuilder Operations

### Basic Querying

The QueryBuilder provides a fluent interface for constructing and executing queries:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: number;
}

const users = db.table<User>("users");

// Select all columns
const allUsers = users.all();

// Select specific columns
const userNames = users
  .select(["id", "name", "email"])
  .all();

// Get single record
const user = users
  .where({ id: 1 })
  .first();

// Check existence
const hasActiveUsers = users
  .where({ active: true })
  .exists();

// Count records
const userCount = users.count();
const activeUserCount = users
  .where({ active: true })
  .count();

// Get single column value
const userName = users
  .where({ id: 1 })
  .value("name");

// Get array of column values
const allEmails = users
  .where({ active: true })
  .pluck("email");
```

### WHERE Conditions

The library supports comprehensive WHERE condition building:

```typescript
// Simple equality conditions
users.where({ 
  active: true, 
  name: "John Doe" 
}).all();

// Null conditions (automatically handled)
users.where({ 
  deleted_at: null,           // Becomes: deleted_at IS NULL
  middle_name: undefined      // Becomes: middle_name IS NULL
}).all();

// Comparison operators
users.whereOp("age", ">", 18).all();
users.whereOp("created_at", "<=", Date.now()).all();
users.whereOp("name", "LIKE", "%john%").all();
users.whereOp("email", "GLOB", "*@gmail.com").all();

// IN and NOT IN clauses
users.whereIn("status", ["active", "pending"]).all();
users.whereNotIn("id", [1, 2, 3]).all();

// BETWEEN conditions
users.whereBetween("age", 18, 65).all();
users.whereNotBetween("score", 0, 50).all();

// NULL checks
users.whereNull("deleted_at").all();
users.whereNotNull("phone").all();

// Raw SQL conditions with parameter binding
users.whereRaw("age > ? AND (status = ? OR premium = 1)", [21, "active"]).all();

// Complex expressions
users.whereExpr("julianday('now') - julianday(created_at) > 30").all();

// Regex conditions (applied client-side after SQL filtering)
users.whereRgx({ 
  email: /@gmail\.com$/i,
  name: /^john/i 
}).all();

// Chaining conditions (AND logic)
const complexQuery = users
  .where({ active: true })
  .whereOp("age", ">=", 18)
  .whereIn("role", ["admin", "moderator"])
  .whereNotNull("email")
  .whereBetween("created_at", startDate, endDate)
  .whereRaw("last_login > datetime('now', '-30 days')")
  .all();
```

### Ordering and Pagination

```typescript
// Basic ordering
users.orderBy("name").asc().all();
users.orderBy("created_at").desc().all();

// Pagination
users
  .orderBy("id")
  .limit(10)
  .offset(20)
  .all();

// Combined ordering and pagination
const recentUsers = users
  .where({ active: true })
  .orderBy("created_at").desc()
  .limit(50)
  .all();

// Complex pagination helper
function paginateUsers(page: number, perPage: number = 20) {
  return users
    .where({ active: true })
    .orderBy("created_at").desc()
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();
}
```

### JSON Column Operations

```typescript
interface UserWithMetadata {
  id: number;
  name: string;
  metadata: {
    preferences: Record<string, any>;
    settings: Record<string, any>;
    tags: string[];
  };
}

// Configure JSON columns for automatic serialization/deserialization
const usersWithJson = db.table<UserWithMetadata>("users", {
  jsonColumns: ["metadata"]
});

// Insert with JSON data (automatically serialized)
usersWithJson.insert({
  name: "John Doe",
  metadata: {
    preferences: { theme: "dark", language: "en" },
    settings: { notifications: true },
    tags: ["premium", "early-adopter"]
  }
});

// Query and get automatically deserialized JSON
const userWithMetadata = usersWithJson
  .where({ id: 1 })
  .first(); // metadata is automatically parsed as JavaScript object

// Use SQL JSON functions in queries
const premiumUsers = usersWithJson
  .whereRaw("JSON_EXTRACT(metadata, '$.tags') LIKE '%premium%'")
  .all();

// Update JSON fields
usersWithJson
  .where({ id: 1 })
  .update({
    metadata: {
      preferences: { theme: "light", language: "es" },
      settings: { notifications: false },
      tags: ["premium", "updated"]
    }
  });
```

## Data Modification

### Insert Operations

```typescript
// Single record insert
const result = users.insert({
  name: "John Doe",
  email: "john@example.com",
  active: true
});
console.log(`Inserted with ID: ${result.insertId}`);

// Multiple record insert
const bulkResult = users.insert([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
  { name: "Carol", email: "carol@example.com" }
]);
console.log(`Inserted ${bulkResult.changes} records`);

// Insert and return the created record
const newUser = users.insertAndGet({
  name: "Dave",
  email: "dave@example.com"
});
console.log(`Created user:`, newUser);

// Conflict resolution
users.insertOrIgnore({ name: "John", email: "john@example.com" });  // Skip if conflict
users.insertOrReplace({ id: 1, name: "John Updated" });             // Replace if conflict
users.insertOrAbort({ name: "Invalid" });                           // Abort transaction on conflict
users.insertOrFail({ name: "Invalid" });                            // Fail statement on conflict
users.insertOrRollback({ name: "Invalid" });                        // Rollback on conflict

// Batch insert with transaction (high performance)
const batchData = Array.from({ length: 1000 }, (_, i) => ({
  name: `User ${i}`,
  email: `user${i}@example.com`
}));

const batchResult = users.insertBatch(batchData);
console.log(`Batch inserted ${batchResult.changes} records`);

// Insert with specific conflict resolution
users.insertBatch(batchData, { orIgnore: true });
```

### Update Operations

All update operations require WHERE conditions to prevent accidental full-table updates:

```typescript
// Basic update (throws error without WHERE clause)
users
  .where({ id: 1 })
  .update({ 
    name: "John Updated",
    active: false 
  });

// Update with complex conditions
users
  .where({ active: true })
  .whereOp("last_login", "<", Date.now() - 86400000) // 1 day ago
  .update({ active: false });

// Increment/decrement operations
users
  .where({ id: 1 })
  .increment("login_count", 1);

users
  .where({ role: "premium" })
  .decrement("credits", 10);

// Update and return affected records
const updatedUsers = users
  .where({ active: false })
  .updateAndGet({ status: "inactive" });

// Upsert (insert or replace)
users.upsert({
  id: 1,
  name: "John Doe",
  email: "john@example.com"
});

// Batch update with different conditions
const batchUpdates = [
  { 
    where: { role: "admin" }, 
    data: { permissions: "full" } 
  },
  { 
    where: { role: "user" }, 
    data: { permissions: "limited" } 
  }
];

users.updateBatch(batchUpdates);
```

### Delete Operations

Like updates, delete operations require WHERE conditions:

```typescript
// Basic delete (throws error without WHERE clause)
users
  .where({ active: false })
  .where({ last_login: null })
  .delete();

// Delete and return deleted records
const deletedUsers = users
  .where({ created_at: { $lt: oldTimestamp } })
  .deleteAndGet();

// Soft delete (mark as deleted instead of removing)
users
  .where({ id: 1 })
  .softDelete("deleted_at", Date.now());

// Restore soft deleted records
users
  .where({ id: 1 })
  .restore("deleted_at");

// Delete records older than timestamp
users.deleteOlderThan("created_at", Date.now() - (30 * 86400000)); // 30 days

// Delete duplicates (keep first occurrence)
users.deleteDuplicates(["email"]);
users.deleteDuplicates(["name", "email"]); // Composite duplicate check

// Batch delete with different conditions
const deleteConditions = [
  { status: "temp" },
  { active: false, created_at: { $lt: oldDate } }
];
users.deleteBatch(deleteConditions);

// Truncate table (delete all records - bypasses WHERE requirement)
users.truncate(); // Use with extreme caution!
```

## Transaction Management

### Automatic Transactions

```typescript
// Simple transaction with automatic commit/rollback
const result = db.transaction(() => {
  const user = users.insert({ name: "John", email: "john@example.com" });
  
  profiles.insert({
    user_id: user.insertId,
    bio: "Software developer"
  });
  
  return user;
}); // Automatically commits on success, rolls back on error

// Transaction with return value
const transferResult = db.transaction(() => {
  // Deduct from source account
  accounts
    .where({ id: sourceAccountId })
    .decrement("balance", amount);
    
  // Add to destination account
  accounts
    .where({ id: destAccountId })
    .increment("balance", amount);
    
  // Log the transfer
  const transfer = transfers.insert({
    from_account: sourceAccountId,
    to_account: destAccountId,
    amount: amount,
    timestamp: Date.now()
  });
  
  return transfer;
});
```

### Manual Transaction Control

```typescript
// Manual transaction management
try {
  db.begin("IMMEDIATE"); // Begin with lock mode
  
  // Perform multiple operations
  const user = users.insert({ name: "John" });
  profiles.insert({ user_id: user.insertId });
  
  db.commit();
} catch (error) {
  db.rollback();
  throw error;
}

// Savepoint management for nested transactions
try {
  db.begin();
  
  // First operation
  users.insert({ name: "Alice" });
  
  db.savepoint("checkpoint1");
  
  try {
    // Risky operation
    users.insert({ name: "Bob", email: null }); // This might fail
    db.releaseSavepoint("checkpoint1");
  } catch (error) {
    db.rollbackToSavepoint("checkpoint1");
    console.log("Rolled back risky operation, continuing...");
  }
  
  // Continue with other operations
  profiles.insert({ user_id: 1 });
  
  db.commit();
} catch (error) {
  db.rollback();
}
```

### Transaction Modes

```typescript
// Different transaction modes for concurrency control
db.begin("DEFERRED");    // Default - lock acquired when first read/write
db.begin("IMMEDIATE");   // Acquire reserved lock immediately
db.begin("EXCLUSIVE");   // Acquire exclusive lock immediately

// Batch processing with transactions
function processBatchWithTransaction<T>(
  items: T[], 
  processor: (item: T) => void,
  batchSize: number = 1000
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    db.transaction(() => {
      for (const item of batch) {
        processor(item);
      }
    });
  }
}

// Usage example
const userData = loadLargeDataset();
processBatchWithTransaction(userData, (user) => {
  users.insert(user);
}, 500);
```

## Advanced Features

### Schema Introspection and Migrations

```typescript
// Get detailed table information
const tableInfo = db.getTableInfo("users");
/*
Returns array of:
{
  cid: 0,           // Column ID
  name: "id",       // Column name
  type: "INTEGER",  // Column type
  notnull: 1,       // NOT NULL constraint
  dflt_value: null, // Default value
  pk: 1             // Primary key flag
}
*/

// Get foreign key relationships
const foreignKeys = db.getForeignKeys("orders");
/*
Returns array of:
{
  id: 0,           // FK constraint ID
  seq: 0,          // Sequence in multi-column FK
  table: "users",  // Referenced table
  from: "user_id", // Local column
  to: "id",        // Referenced column
  on_update: "RESTRICT",
  on_delete: "CASCADE",
  match: "NONE"
}
*/

// Get index information
const indexes = db.getIndexes("users");
/*
Returns array of:
{
  name: "idx_users_email",
  unique: 1,
  origin: "c",      // 'c' = CREATE INDEX, 'u' = UNIQUE, 'pk' = PRIMARY KEY
  partial: 0        // Partial index flag
}
*/

// Get complete schema
const schema = db.getSchema();
// Returns all CREATE statements for tables, indexes, views, triggers

// Migration helper function
function migrateTable(
  oldTable: string, 
  newTable: string, 
  newSchema: any,
  columnMapping: Record<string, string> = {}
) {
  return db.transaction(() => {
    // Create new table
    db.createTable(newTable, newSchema, { ifNotExists: true });
    
    // Build column mapping
    const oldInfo = db.getTableInfo(oldTable);
    const newInfo = db.getTableInfo(newTable);
    
    const oldColumns = oldInfo.map(col => col.name);
    const newColumns = newInfo.map(col => col.name);
    
    // Map old columns to new columns
    const mappedColumns = oldColumns
      .map(col => columnMapping[col] || col)
      .filter(col => newColumns.includes(col));
    
    if (mappedColumns.length > 0) {
      const selectCols = oldColumns
        .filter(col => mappedColumns.includes(columnMapping[col] || col))
        .map(col => columnMapping[col] ? `${col} AS ${columnMapping[col]}` : col)
        .join(", ");
      
      const insertCols = mappedColumns.join(", ");
      
      // Copy data
      db.exec(`INSERT INTO ${newTable} (${insertCols}) 
               SELECT ${selectCols} FROM ${oldTable}`);
    }
    
    // Drop old table
    db.dropTable(oldTable);
    
    // Rename new table
    db.exec(`ALTER TABLE ${newTable} RENAME TO ${oldTable}`);
  });
}

// Usage
migrateTable("users", "users_new", {
  id: column.id(),
  full_name: column.text({ notNull: true }),    // Combined first_name + last_name
  email: column.text({ unique: true }),
  created_at: column.createdAt()
}, {
  "first_name": "full_name",  // Map first_name to full_name
  // last_name will be dropped
});
```

### Performance Optimization

```typescript
// Database optimization settings
function optimizeDatabase(db: DB) {
  // WAL mode for concurrent access
  db.pragma("journal_mode", "WAL");
  
  // Optimize for speed vs safety balance
  db.pragma("synchronous", "NORMAL");  // FULL is safest, OFF is fastest
  
  // Increase cache size (negative = KB, positive = pages)
  db.pragma("cache_size", -64000);     // 64MB cache
  
  // Memory-mapped I/O for large databases
  db.pragma("mmap_size", 268435456);   // 256MB
  
  // Store temporary tables/indexes in memory
  db.pragma("temp_store", "MEMORY");
  
  // Optimize query planner
  db.pragma("optimize");
  
  // Update table statistics
  db.analyze();
}

// Bulk insert optimization
function bulkInsertOptimized<T>(
  table: QueryBuilder<T>,
  data: Partial<T>[],
  options: { batchSize?: number } = {}
) {
  const batchSize = options.batchSize || 1000;
  
  // Temporarily disable safety features for speed
  const originalSync = db.pragma("synchronous");
  db.pragma("synchronous", "OFF");
  
  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      db.transaction(() => {
        table.insertBatch(batch);
      });
    }
  } finally {
    // Restore original settings
    db.pragma("synchronous", originalSync);
    db.pragma("optimize"); // Update statistics
  }
}

// Query optimization examples
function optimizeQueries() {
  // Use indexes effectively
  db.createIndex("idx_users_active_created", "users", ["active", "created_at"]);
  
  // Covering index (includes all needed columns)
  db.createIndex("idx_users_cover", "users", ["active"], {
    // Note: SQLite doesn't support INCLUDE syntax, but you can create composite indexes
  });
  
  // Partial indexes for common queries
  db.createIndex("idx_active_users", "users", "email", {
    where: "active = 1"
  });
  
  // Use LIMIT when you don't need all results
  const recentActiveUsers = users
    .where({ active: true })
    .orderBy("created_at").desc()
    .limit(100)  // Don't load everything
    .all();
  
  // Use EXISTS instead of COUNT when checking existence
  const hasActiveUsers = users
    .where({ active: true })
    .exists(); // More efficient than .count() > 0
  
  // Use appropriate data types
  // INTEGER for IDs, REAL for floating point, TEXT for strings
  // Avoid storing numbers as TEXT when possible
}

// Memory management for large datasets
function processLargeDataset(tableName: string) {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let batch: any[];
  
  do {
    batch = db.table(tableName)
      .orderBy("id")
      .limit(BATCH_SIZE)
      .offset(offset)
      .all();
    
    // Process batch
    for (const row of batch) {
      processRow(row);
    }
    
    offset += BATCH_SIZE;
  } while (batch.length === BATCH_SIZE);
}
```

### Extension and Custom Functions

```typescript
// Load SQLite extensions
const db = new DB("app.db", {
  loadExtensions: [
    "/usr/lib/sqlite3/pcre.so",     // PCRE regex support
    "/usr/lib/sqlite3/uuid.so",     // UUID functions
    "/usr/lib/sqlite3/json1.so"     // JSON functions (built-in in modern SQLite)
  ]
});

// Use extension functions
const regexMatches = users
  .whereRaw("email REGEXP ?", ["@gmail\\.com$"])
  .all();

// Custom application-level functions
class ExtendedDB extends DB {
  // Custom method for common query patterns
  findUsersByDomain(domain: string) {
    return this.table<User>("users")
      .whereRaw("email LIKE ?", [`%@${domain}`])
      .all();
  }
  
  // Pagination helper
  paginate<T>(
    table: string,
    page: number,
    perPage: number = 20,
    conditions: Partial<T> = {}
  ) {
    const offset = (page - 1) * perPage;
    
    const query = this.table<T>(table);
    
    if (Object.keys(conditions).length > 0) {
      query.where(conditions);
    }
    
    const [data, total] = [
      query.limit(perPage).offset(offset).all(),
      query.count()
    ];
    
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      hasNext: page * perPage < total,
      hasPrev: page > 1
    };
  }
  
  // Soft delete with automatic timestamp
  softDeleteWithTimestamp<T>(
    table: string, 
    conditions: Partial<T>,
    deletedColumn: string = "deleted_at"
  ) {
    return this.table<T>(table)
      .where(conditions)
      .softDelete(deletedColumn as keyof T, Math.floor(Date.now() / 1000));
  }
  
  // Bulk upsert operation
  bulkUpsert<T>(table: string, records: Partial<T>[]) {
    return this.transaction(() => {
      return records.map(record => 
        this.table<T>(table).upsert(record)
      );
    });
  }
}

const extendedDb = new ExtendedDB("app.db");
const gmailUsers = extendedDb.findUsersByDomain("gmail.com");
const paginatedUsers = extendedDb.paginate<User>("users", 1, 20, { active: true });
```

## Error Handling and Debugging

### Safety Features

```typescript
// All destructive operations require explicit WHERE conditions
try {
  users.update({ active: false }); // Throws error - no WHERE clause
} catch (error) {
  console.error("Safety check:", error.message);
  // Error: UPDATE operation requires at least one WHERE condition
}

// Correct usage
users
  .where({ status: "inactive" })
  .update({ active: false });

// To perform full-table updates, use explicit conditions
users
  .whereRaw("1 = 1") // Explicit full-table condition
  .update({ migrated: true });

// Or use specific methods that bypass safety checks
users.truncate(); // Explicitly destructive

// Parameter validation
try {
  users.whereIn("status", []); // Throws error - empty array
} catch (error) {
  console.error("Validation error:", error.message);
}

// Type safety at compile time
const user = users.where({ id: 1 }).first();
// user.nonExistentField; // TypeScript error - property doesn't exist
```

### Database Integrity and Validation

```typescript
// Run integrity check
const integrityResults = db.integrityCheck();
if (integrityResults.some(result => result.integrity_check !== "ok")) {
  console.error("Database integrity issues found:", integrityResults);
}

// Foreign key constraint checking
db.pragma("foreign_key_check"); // Check all tables
db.exec("PRAGMA foreign_key_check(users)"); // Check specific table

// Schema validation helper
function validateSchema() {
  const expectedTables = ["users", "profiles", "orders"];
  const schema = db.getSchema();
  const actualTables = schema
    .filter(item => item.type === "table")
    .map(item => item.name);
  
  const missing = expectedTables.filter(table => 
    !actualTables.includes(table)
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing tables: ${missing.join(", ")}`);
  }
}

// JSON validation for JSON columns
db.createTable("documents", {
  id: column.id(),
  data: column.json({ validateJson: true }) // Validates JSON on insert
});

// This will fail if invalid JSON is inserted
try {
  documents.insert({ data: "invalid json string" });
} catch (error) {
  console.error("JSON validation failed:", error);
}
```

### Debugging and Monitoring

```typescript
// Enable detailed logging for development
class DebuggingDB extends DB {
  private logQueries = true;
  
  table<T>(tableName: string, jsonConfig?: any) {
    const queryBuilder = super.table<T>(tableName, jsonConfig);
    
    if (this.logQueries) {
      // Override query methods to add logging
      const originalAll = queryBuilder.all.bind(queryBuilder);
      queryBuilder.all = () => {
        console.log(`[SQL] SELECT * FROM ${tableName} with conditions`);
        const startTime = performance.now();
        const results = originalAll();
        const endTime = performance.now();
        console.log(`[SQL] Query completed in ${endTime - startTime}ms, returned ${results.length} rows`);
        return results;
      };
    }
    
    return queryBuilder;
  }
}

// Performance monitoring
function monitorQueryPerformance<T>(queryBuilder: any, operation: string): T {
  const startTime = performance.now();
  const result = queryBuilder;
  const endTime = performance.now();
  
  if (endTime - startTime > 100) { // Log slow queries
    console.warn(`[SLOW QUERY] ${operation} took ${endTime - startTime}ms`);
  }
  
  return result;
}

// Usage
const slowUsers = monitorQueryPerformance(
  users.where({ active: true }).all(),
  "SELECT active users"
);
```

## Real-World Examples

### E-commerce System

```typescript
interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  inventory: number;
  active: boolean;
  metadata?: {
    tags: string[];
    attributes: Record<string, any>;
    seo?: {
      title?: string;
      description?: string;
    };
  };
  created_at?: number;
  updated_at?: number;
}

interface Order {
  id?: number;
  order_number: string;
  customer_id: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  created_at?: number;
  updated_at?: number;
}

interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Schema creation
function setupEcommerceSchema(db: DB) {
  // Categories table
  db.createTable("categories", {
    id: column.id(),
    name: column.text({ notNull: true, unique: true }),
    slug: column.text({ notNull: true, unique: true }),
    parent_id: column.foreignKey("categories", "id", { onDelete: "CASCADE" }),
    active: column.boolean({ default: true }),
    created_at: column.createdAt()
  });

  // Products table
  db.createTable("products", {
    id: column.id(),
    sku: column.varchar(100, { unique: true, notNull: true }),
    name: column.text({ notNull: true }),
    description: column.text(),
    price: column.numeric({ precision: 10, scale: 2, check: "price >= 0" }),
    category_id: column.foreignKey("categories", "id", { onDelete: "RESTRICT" }),
    inventory: column.integer({ default: 0, check: "inventory >= 0" }),
    active: column.boolean({ default: true }),
    metadata: column.json({ validateJson: true }),
    
    // Generated columns for search
    search_text: {
      type: "TEXT",
      generated: {
        expression: "lower(name || ' ' || coalesce(description, '') || ' ' || sku)",
        stored: true
      }
    },
    
    created_at: column.createdAt(),
    updated_at: column.updatedAt()
  }, {
    constraints: {
      check: ["price > 0 OR active = 0"] // Inactive products can have 0 price
    }
  });

  // Orders table
  db.createTable("orders", {
    id: column.id(),
    order_number: column.varchar(50, { unique: true, notNull: true }),
    customer_id: column.integer({ notNull: true }),
    status: column.enum(["pending", "paid", "shipped", "delivered", "cancelled"], {
      default: "pending"
    }),
    subtotal: column.numeric({ precision: 10, scale: 2, notNull: true }),
    tax: column.numeric({ precision: 10, scale: 2, default: 0 }),
    shipping: column.numeric({ precision: 10, scale: 2, default: 0 }),
    total: column.numeric({ precision: 10, scale: 2, notNull: true }),
    notes: column.text(),
    created_at: column.createdAt(),
    updated_at: column.updatedAt()
  }, {
    constraints: {
      check: [
        "subtotal >= 0",
        "tax >= 0", 
        "shipping >= 0",
        "total = subtotal + tax + shipping"
      ]
    }
  });

  // Order items table
  db.createTable("order_items", {
    id: column.id(),
    order_id: column.foreignKey("orders", "id", { onDelete: "CASCADE" }),
    product_id: column.foreignKey("products", "id", { onDelete: "RESTRICT" }),
    quantity: column.integer({ notNull: true, check: "quantity > 0" }),
    unit_price: column.numeric({ precision: 10, scale: 2, notNull: true }),
    total_price: column.numeric({ precision: 10, scale: 2, notNull: true })
  }, {
    constraints: {
      check: ["total_price = quantity * unit_price"],
      unique: [["order_id", "product_id"]] // Prevent duplicate items in same order
    }
  });

  // Indexes for performance
  db.createIndex("idx_products_category", "products", "category_id");
  db.createIndex("idx_products_active_price", "products", ["active", "price"]);
  db.createIndex("idx_products_search", "products", "search_text");
  db.createIndex("idx_orders_customer", "orders", "customer_id");
  db.createIndex("idx_orders_status_created", "orders", ["status", "created_at"]);
}

// Business logic implementation
class EcommerceService {
  constructor(private db: DB) {}

  // Product management
  searchProducts(query: string, options: {
    category?: number;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const products = this.db.table<Product>("products", {
      jsonColumns: ["metadata"]
    });

    let queryBuilder = products
      .where({ active: true })
      .whereRaw("search_text LIKE ?", [`%${query.toLowerCase()}%`]);

    if (options.category) {
      queryBuilder = queryBuilder.where({ category_id: options.category });
    }

    if (options.minPrice !== undefined) {
      queryBuilder = queryBuilder.whereOp("price", ">=", options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      queryBuilder = queryBuilder.whereOp("price", "<=", options.maxPrice);
    }

    return queryBuilder
      .orderBy("name")
      .limit(options.limit || 20)
      .offset(options.offset || 0)
      .all();
  }

  // Order processing
  createOrder(orderData: {
    customer_id: number;
    items: Array<{ product_id: number; quantity: number }>;
    shipping_cost?: number;
    tax_rate?: number;
  }) {
    return this.db.transaction(() => {
      // Get products and validate inventory
      const productIds = orderData.items.map(item => item.product_id);
      const products = this.db.table<Product>("products")
        .whereIn("id", productIds)
        .all();

      const productMap = new Map(products.map(p => [p.id!, p]));

      let subtotal = 0;
      const orderItems: Omit<OrderItem, "id" | "order_id">[] = [];

      // Calculate totals and validate inventory
      for (const item of orderData.items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        if (product.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name}`);
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: itemTotal
        });
      }

      const tax = subtotal * (orderData.tax_rate || 0);
      const shipping = orderData.shipping_cost || 0;
      const total = subtotal + tax + shipping;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Create order
      const order = this.db.table<Order>("orders").insertAndGet({
        order_number: orderNumber,
        customer_id: orderData.customer_id,
        subtotal,
        tax,
        shipping,
        total,
        status: "pending"
      });

      if (!order) {
        throw new Error("Failed to create order");
      }

      // Create order items
      const itemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id!
      }));

      this.db.table<OrderItem>("order_items").insertBatch(itemsWithOrderId);

      // Update product inventory
      for (const item of orderData.items) {
        this.db.table<Product>("products")
          .where({ id: item.product_id })
          .decrement("inventory", item.quantity);
      }

      return order;
    });
  }

  // Order status updates
  updateOrderStatus(orderId: number, status: Order["status"]) {
    return this.db.transaction(() => {
      const order = this.db.table<Order>("orders")
        .where({ id: orderId })
        .first();

      if (!order) {
        throw new Error("Order not found");
      }

      // Business logic for status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ["paid", "cancelled"],
        paid: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: []
      };

      if (!validTransitions[order.status]?.includes(status)) {
        throw new Error(`Cannot transition from ${order.status} to ${status}`);
      }

      // If cancelling, restore inventory
      if (status === "cancelled" && order.status !== "cancelled") {
        const orderItems = this.db.table<OrderItem>("order_items")
          .where({ order_id: orderId })
          .all();

        for (const item of orderItems) {
          this.db.table<Product>("products")
            .where({ id: item.product_id })
            .increment("inventory", item.quantity);
        }
      }

      return this.db.table<Order>("orders")
        .where({ id: orderId })
        .updateAndGet({ status, updated_at: Math.floor(Date.now() / 1000) });
    });
  }

  // Analytics and reporting
  getOrderStatistics(dateRange?: { start: number; end: number }) {
    let query = this.db.table<Order>("orders");

    if (dateRange) {
      query = query.whereBetween("created_at", dateRange.start, dateRange.end);
    }

    const orders = query.all();

    const stats = {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, order) => sum + order.total, 0),
      avg_order_value: 0,
      status_breakdown: {} as Record<string, number>
    };

    stats.avg_order_value = stats.total_revenue / stats.total_orders || 0;

    for (const order of orders) {
      stats.status_breakdown[order.status] = 
        (stats.status_breakdown[order.status] || 0) + 1;
    }

    return stats;
  }

  // Low inventory alerts
  getLowInventoryProducts(threshold: number = 10) {
    return this.db.table<Product>("products", {
      jsonColumns: ["metadata"]
    })
      .where({ active: true })
      .whereOp("inventory", "<=", threshold)
      .orderBy("inventory")
      .all();
  }
}

// Usage example
const ecommerceDb = new DB("ecommerce.db", {
  pragmas: [
    ["journal_mode", "WAL"],
    ["foreign_keys", "ON"],
    ["synchronous", "NORMAL"]
  ]
});

setupEcommerceSchema(ecommerceDb);

const ecommerce = new EcommerceService(ecommerceDb);

// Create an order
const newOrder = ecommerce.createOrder({
  customer_id: 123,
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 1 }
  ],
  shipping_cost: 9.99,
  tax_rate: 0.08
});

// Search products
const laptops = ecommerce.searchProducts("laptop", {
  category: 1,
  minPrice: 500,
  maxPrice: 2000,
  limit: 10
});

// Update order status
ecommerce.updateOrderStatus(newOrder.id!, "paid");

// Get analytics
const monthlyStats = ecommerce.getOrderStatistics({
  start: Date.now() - (30 * 24 * 60 * 60 * 1000),
  end: Date.now()
});
```

### User Management System

```typescript
interface User {
  id?: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: "admin" | "moderator" | "user";
  active: boolean;
  email_verified: boolean;
  last_login?: number;
  login_count: number;
  preferences?: {
    theme: "light" | "dark";
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  created_at?: number;
  updated_at?: number;
  deleted_at?: number;
}

interface Session {
  id?: string;
  user_id: number;
  token_hash: string;
  expires_at: number;
  ip_address?: string;
  user_agent?: string;
  created_at?: number;
}

class UserManagementSystem {
  constructor(private db: DB) {
    this.setupSchema();
  }

  private setupSchema() {
    // Users table
    this.db.createTable("users", {
      id: column.id(),
      username: column.varchar(50, { unique: true, notNull: true }),
      email: column.varchar(255, { unique: true, notNull: true }),
      password_hash: column.varchar(255, { notNull: true }),
      first_name: column.varchar(100, { notNull: true }),
      last_name: column.varchar(100, { notNull: true }),
      role: column.enum(["admin", "moderator", "user"], { default: "user" }),
      active: column.boolean({ default: true }),
      email_verified: column.boolean({ default: false }),
      last_login: column.timestamp(),
      login_count: column.integer({ default: 0 }),
      preferences: column.json({ validateJson: true }),
      
      // Full name generated column
      full_name: {
        type: "TEXT",
        generated: {
          expression: "first_name || ' ' || last_name",
          stored: false
        }
      },
      
      created_at: column.createdAt(),
      updated_at: column.updatedAt(),
      deleted_at: column.timestamp()
    });

    // Sessions table
    this.db.createTable("sessions", {
      id: column.uuid({ generateDefault: true }),
      user_id: column.foreignKey("users", "id", { onDelete: "CASCADE" }),
      token_hash: column.varchar(255, { notNull: true, unique: true }),
      expires_at: column.timestamp({ notNull: true }),
      ip_address: column.varchar(45), // IPv6 compatible
      user_agent: column.text(),
      created_at: column.createdAt()
    });

    // Audit log table
    this.db.createTable("user_audit_log", {
      id: column.id(),
      user_id: column.foreignKey("users", "id", { onDelete: "CASCADE" }),
      action: column.varchar(100, { notNull: true }),
      details: column.json(),
      ip_address: column.varchar(45),
      created_at: column.createdAt()
    });

    // Indexes
    this.db.createIndex("idx_users_email", "users", "email", { unique: true });
    this.db.createIndex("idx_users_username", "users", "username", { unique: true });
    this.db.createIndex("idx_users_active", "users", "active");
    this.db.createIndex("idx_sessions_user", "sessions", "user_id");
    this.db.createIndex("idx_sessions_expires", "sessions", "expires_at");
    this.db.createIndex("idx_audit_user_action", "user_audit_log", ["user_id", "action"]);
  }

  // User CRUD operations
  createUser(userData: Omit<User, "id" | "created_at" | "updated_at" | "login_count">) {
    return this.db.transaction(() => {
      const user = this.db.table<User>("users", {
        jsonColumns: ["preferences"]
      }).insertAndGet(userData);

      if (user) {
        this.logAction(user.id!, "user_created", { 
          username: userData.username,
          email: userData.email 
        });
      }

      return user;
    });
  }

  getUserById(id: number): User | null {
    return this.db.table<User>("users", {
      jsonColumns: ["preferences"]
    })
      .where({ id })
      .whereNull("deleted_at")
      .first();
  }

  getUserByEmail(email: string): User | null {
    return this.db.table<User>("users", {
      jsonColumns: ["preferences"]
    })
      .where({ email })
      .whereNull("deleted_at")
      .first();
  }

  getUserByUsername(username: string): User | null {
    return this.db.table<User>("users", {
      jsonColumns: ["preferences"]
    })
      .where({ username })
      .whereNull("deleted_at")
      .first();
  }

  updateUser(id: number, updates: Partial<User>) {
    return this.db.transaction(() => {
      const result = this.db.table<User>("users", {
        jsonColumns: ["preferences"]
      })
        .where({ id })
        .whereNull("deleted_at")
        .update({
          ...updates,
          updated_at: Math.floor(Date.now() / 1000)
        });

      if (result.changes > 0) {
        this.logAction(id, "user_updated", updates);
      }

      return result;
    });
  }

  // Soft delete
  deleteUser(id: number, deletedBy?: number) {
    return this.db.transaction(() => {
      const now = Math.floor(Date.now() / 1000);
      
      const result = this.db.table<User>("users")
        .where({ id })
        .whereNull("deleted_at")
        .update({ 
          deleted_at: now,
          active: false,
          updated_at: now
        });

      if (result.changes > 0) {
        // Invalidate all sessions
        this.db.table<Session>("sessions")
          .where({ user_id: id })
          .delete();

        this.logAction(id, "user_deleted", { deleted_by: deletedBy });
      }

      return result;
    });
  }

  // Authentication
  login(identifier: string, passwordHash: string, sessionData: {
    ip_address?: string;
    user_agent?: string;
    expires_in?: number; // seconds
  }) {
    return this.db.transaction(() => {
      // Find user by email or username
      const user = this.db.table<User>("users", {
        jsonColumns: ["preferences"]
      })
        .whereNull("deleted_at")
        .where({ active: true })
        .whereRaw("(email = ? OR username = ?)", [identifier, identifier])
        .first();

      if (!user || user.password_hash !== passwordHash) {
        this.logAction(user?.id, "login_failed", { 
          identifier, 
          ip_address: sessionData.ip_address 
        });
        return null;
      }

      // Update login info
      this.db.table<User>("users")
        .where({ id: user.id! })
        .update({
          last_login: Math.floor(Date.now() / 1000),
          login_count: user.login_count + 1,
          updated_at: Math.floor(Date.now() / 1000)
        });

      // Create session
      const expiresIn = sessionData.expires_in || (24 * 60 * 60); // 24 hours default
      const sessionToken = crypto.randomUUID();
      const tokenHash = await this.hashToken(sessionToken);

      const session = this.db.table<Session>("sessions").insertAndGet({
        user_id: user.id!,
        token_hash: tokenHash,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
        ip_address: sessionData.ip_address,
        user_agent: sessionData.user_agent
      });

      this.logAction(user.id!, "login_success", { 
        ip_address: sessionData.ip_address 
      });

      return {
        user: { ...user, password_hash: undefined }, // Don't return password hash
        session,
        token: sessionToken
      };
    });
  }

  logout(sessionId: string, userId?: number) {
    return this.db.transaction(() => {
      const result = this.db.table<Session>("sessions")
        .where({ id: sessionId })
        .delete();

      if (result.changes > 0 && userId) {
        this.logAction(userId, "logout", { session_id: sessionId });
      }

      return result;
    });
  }

  validateSession(token: string): { user: User; session: Session } | null {
    const tokenHash = this.hashToken(token);
    
    const session = this.db.table<Session>("sessions")
      .where({ token_hash: tokenHash })
      .whereOp("expires_at", ">", Math.floor(Date.now() / 1000))
      .first();

    if (!session) {
      return null;
    }

    const user = this.getUserById(session.user_id);
    if (!user || !user.active) {
      // Clean up invalid session
      this.db.table<Session>("sessions")
        .where({ id: session.id! })
        .delete();
      return null;
    }

    return { user, session };
  }

  // Session management
  getUserSessions(userId: number) {
    return this.db.table<Session>("sessions")
      .where({ user_id: userId })
      .whereOp("expires_at", ">", Math.floor(Date.now() / 1000))
      .orderBy("created_at").desc()
      .all();
  }

  revokeAllSessions(userId: number) {
    return this.db.transaction(() => {
      const result = this.db.table<Session>("sessions")
        .where({ user_id: userId })
        .delete();

      if (result.changes > 0) {
        this.logAction(userId, "sessions_revoked", { count: result.changes });
      }

      return result;
    });
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    return this.db.table<Session>("sessions")
      .whereOp("expires_at", "<=", Math.floor(Date.now() / 1000))
      .delete();
  }

  // User queries
  searchUsers(query: string, filters: {
    role?: User["role"];
    active?: boolean;
    email_verified?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    let queryBuilder = this.db.table<User>("users", {
      jsonColumns: ["preferences"]
    })
      .whereNull("deleted_at")
      .whereRaw("(username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)", [
        `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`
      ]);

    if (filters.role) {
      queryBuilder = queryBuilder.where({ role: filters.role });
    }

    if (filters.active !== undefined) {
      queryBuilder = queryBuilder.where({ active: filters.active });
    }

    if (filters.email_verified !== undefined) {
      queryBuilder = queryBuilder.where({ email_verified: filters.email_verified });
    }

    return queryBuilder
      .select(["id", "username", "email", "first_name", "last_name", "role", "active", "email_verified", "last_login", "created_at"])
      .orderBy("created_at").desc()
      .limit(filters.limit || 50)
      .offset(filters.offset || 0)
      .all();
  }

  getUserStatistics() {
    const users = this.db.table<User>("users")
      .whereNull("deleted_at")
      .all();

    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - (24 * 60 * 60);
    const weekAgo = now - (7 * 24 * 60 * 60);
    const monthAgo = now - (30 * 24 * 60 * 60);

    return {
      total: users.length,
      active: users.filter(u => u.active).length,
      verified: users.filter(u => u.email_verified).length,
      by_role: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent_logins: {
        last_24h: users.filter(u => u.last_login && u.last_login >= dayAgo).length,
        last_week: users.filter(u => u.last_login && u.last_login >= weekAgo).length,
        last_month: users.filter(u => u.last_login && u.last_login >= monthAgo).length
      },
      registrations: {
        last_24h: users.filter(u => u.created_at && u.created_at >= dayAgo).length,
        last_week: users.filter(u => u.created_at && u.created_at >= weekAgo).length,
        last_month: users.filter(u => u.created_at && u.created_at >= monthAgo).length
      }
    };
  }

  // Audit logging
  private logAction(userId: number | undefined, action: string, details: any = {}, ipAddress?: string) {
    if (!userId) return;

    this.db.table("user_audit_log").insert({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress
    });
  }

  private async hashToken(token: string): Promise<string> {
    // In a real implementation, use a proper hashing function like bcrypt
    return token; // Simplified for example
  }

  getUserAuditLog(userId: number, limit: number = 50) {
    return this.db.table("user_audit_log")
      .where({ user_id: userId })
      .orderBy("created_at").desc()
      .limit(limit)
      .all();
  }
}

// Usage example
const userSystem = new UserManagementSystem(new DB("users.db"));

const newUser = userSystem.createUser({
  username: "johndoe",
  email: "john@example.com",
  password_hash: "hashed_password",
  first_name: "John",
  last_name: "Doe",
  role: "user",
  active: true,
  email_verified: false
});
```

## Migration Patterns

### Schema Evolution

```typescript
// Migration system
class MigrationRunner {
  private db: DB;
  
  constructor(db: DB) {
    this.db = db;
    this.setupMigrationsTable();
  }

  private setupMigrationsTable() {
    this.db.createTable("migrations", {
      id: column.id(),
      name: column.text({ unique: true, notNull: true }),
      executed_at: column.createdAt()
    }, { ifNotExists: true });
  }

  async runMigration(name: string, migration: () => void | Promise<void>) {
    const existing = this.db.table("migrations")
      .where({ name })
      .first();

    if (existing) {
      console.log(`Migration ${name} already executed`);
      return;
    }

    console.log(`Running migration: ${name}`);
    
    try {
      await this.db.transaction(async () => {
        await migration();
        
        this.db.table("migrations").insert({
          name,
          executed_at: Math.floor(Date.now() / 1000)
        });
      });
      
      console.log(`Migration ${name} completed successfully`);
    } catch (error) {
      console.error(`Migration ${name} failed:`, error);
      throw error;
    }
  }

  getExecutedMigrations() {
    return this.db.table("migrations")
      .orderBy("executed_at")
      .all();
  }
}

// Example migrations
const migrations = new MigrationRunner(db);

// Add new column
migrations.runMigration("add_user_phone", () => {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  db.createIndex("idx_users_phone", "users", "phone");
});

// Create new table
migrations.runMigration("create_notifications", () => {
  db.createTable("notifications", {
    id: column.id(),
    user_id: column.foreignKey("users", "id", { onDelete: "CASCADE" }),
    title: column.text({ notNull: true }),
    message: column.text({ notNull: true }),
    type: column.enum(["info", "warning", "error", "success"]),
    read: column.boolean({ default: false }),
    created_at: column.createdAt()
  });
});

// Data migration
migrations.runMigration("migrate_user_names", () => {
  const users = db.table("users").all();
  
  for (const user of users) {
    if (user.name && !user.first_name && !user.last_name) {
      const [first, ...lastParts] = user.name.split(" ");
      
      db.table("users")
        .where({ id: user.id })
        .update({
          first_name: first || "",
          last_name: lastParts.join(" ") || ""
        });
    }
  }
});
```

## Performance Best Practices

### Query Optimization

```typescript
// Good practices for high-performance queries
class PerformanceOptimizer {
  private db: DB;

  constructor(db: DB) {
    this.db = db;
    this.setupOptimalSettings();
  }

  private setupOptimalSettings() {
    // WAL mode for concurrent access
    this.db.pragma("journal_mode", "WAL");
    
    // Optimize for mixed read/write workloads
    this.db.pragma("synchronous", "NORMAL");
    
    // Increase cache size (64MB)
    this.db.pragma("cache_size", -64000);
    
    // Use memory for temp storage
    this.db.pragma("temp_store", "MEMORY");
    
    // Enable memory-mapped I/O
    this.db.pragma("mmap_size", 268435456); // 256MB
    
    // Optimize query planner
    this.db.pragma("optimize");
  }

  // Create optimal indexes
  createOptimalIndexes() {
    // Covering indexes include all columns needed for the query
    this.db.createIndex("idx_users_active_cover", "users", 
      ["active", "created_at", "id", "email"], 
      { where: "deleted_at IS NULL" }
    );
    
    // Partial indexes for common filters
    this.db.createIndex("idx_orders_pending", "orders", 
      ["created_at"], 
      { where: "status = 'pending'" }
    );
    
    // Composite indexes for multi-column sorts
    this.db.createIndex("idx_products_category_price", "products", 
      ["category_id", "price", "active"]
    );
  }

  // Efficient pagination
  paginateEfficiently<T>(
    table: string,
    page: number,
    pageSize: number,
    orderBy: string = "id"
  ) {
    // Use cursor-based pagination for better performance
    const offset = (page - 1) * pageSize;
    
    return this.db.table<T>(table)
      .orderBy(orderBy as keyof T)
      .limit(pageSize + 1) // Get one extra to check if there's a next page
      .offset(offset)
      .all();
  }

  // Batch operations for bulk data
  bulkInsertOptimized<T>(
    table: string, 
    records: Partial<T>[], 
    batchSize: number = 1000
  ) {
    const originalSync = this.db.pragma("synchronous");
    
    try {
      // Temporarily disable sync for bulk operations
      this.db.pragma("synchronous", "OFF");
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        this.db.transaction(() => {
          this.db.table<T>(table).insertBatch(batch);
        });
      }
    } finally {
      // Restore original sync setting
      this.db.pragma("synchronous", originalSync);
      
      // Update query planner statistics
      this.db.analyze();
    }
  }

  // Connection pooling simulation for high-concurrency scenarios
  createConnectionPool(dbPath: string, poolSize: number = 5) {
    const connections: DB[] = [];
    
    for (let i = 0; i < poolSize; i++) {
      const conn = new DB(dbPath, {
        pragmas: [
          ["journal_mode", "WAL"],
          ["synchronous", "NORMAL"],
          ["cache_size", -32000], // Smaller cache per connection
          ["busy_timeout", 5000]   // Wait up to 5 seconds for locks
        ]
      });
      connections.push(conn);
    }
    
    return {
      getConnection(): DB {
        // Simple round-robin (in production, use proper pooling)
        return connections[Math.floor(Math.random() * connections.length)];
      },
      
      closeAll() {
        connections.forEach(conn => conn.close());
      }
    };
  }
}
```

## Testing and Debugging

### Test Utilities

```typescript
// Testing helper utilities
class TestDatabase {
  private db: DB;
  private originalTables: string[] = [];

  constructor() {
    this.db = new DB(":memory:"); // In-memory for fast tests
  }

  async setup(schema: () => void) {
    // Record original state
    this.originalTables = this.getTableNames();
    
    // Apply schema
    schema();
    
    return this.db;
  }

  async cleanup() {
    // Drop all tables created during test
    const currentTables = this.getTableNames();
    const newTables = currentTables.filter(t => 
      !this.originalTables.includes(t) && t !== "migrations"
    );
    
    for (const table of newTables) {
      this.db.dropTable(table, { ifExists: true });
    }
  }

  async reset() {
    // Clear all data but keep schema
    const tables = this.getTableNames();
    
    for (const table of tables) {
      if (table !== "sqlite_master" && table !== "migrations") {
        this.db.table(table).truncate();
      }
    }
  }

  private getTableNames(): string[] {
    return this.db.getSchema()
      .filter(item => item.type === "table")
      .map(item => item.name);
  }

  // Create test data factories
  createUserFactory() {
    let counter = 0;
    
    return (overrides: Partial<User> = {}) => {
      counter++;
      return {
        username: `user${counter}`,
        email: `user${counter}@test.com`,
        first_name: `First${counter}`,
        last_name: `Last${counter}`,
        role: "user" as const,
        active: true,
        email_verified: true,
        login_count: 0,
        ...overrides
      };
    };
  }

  // Seed test data
  async seedTestData() {
    const userFactory = this.createUserFactory();
    
    const users = this.db.table<User>("users");
    
    // Create test users
    const testUsers = [
      userFactory({ role: "admin", username: "admin" }),
      userFactory({ role: "moderator", username: "mod" }),
      userFactory({ active: false, username: "inactive" }),
      ...Array.from({ length: 10 }, () => userFactory())
    ];
    
    users.insertBatch(testUsers);
    
    return {
      adminUser: users.where({ username: "admin" }).first(),
      moderatorUser: users.where({ username: "mod" }).first(),
      inactiveUser: users.where({ username: "inactive" }).first(),
      regularUsers: users.where({ role: "user", active: true }).all()
    };
  }

  getDb() {
    return this.db;
  }
}

// Example test suite
describe("User Management", () => {
  let testDb: TestDatabase;
  let userSystem: UserManagementSystem;

  beforeEach(async () => {
    testDb = new TestDatabase();
    const db = await testDb.setup(() => {
      // Schema setup would go here
    });
    
    userSystem = new UserManagementSystem(db);
    await testDb.seedTestData();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  test("should create user successfully", async () => {
    const userData = {
      username: "newuser",
      email: "new@test.com",
      password_hash: "hashed",
      first_name: "New",
      last_name: "User",
      role: "user" as const,
      active: true,
      email_verified: false
    };

    const user = userSystem.createUser(userData);
    expect(user).toBeTruthy();
    expect(user?.username).toBe("newuser");
    expect(user?.email).toBe("new@test.com");
  });

  test("should handle duplicate email", async () => {
    const userData = {
      username: "duplicate",
      email: "user1@test.com", // Existing email
      password_hash: "hashed",
      first_name: "Dupe",
      last_name: "User",
      role: "user" as const,
      active: true,
      email_verified: false
    };

    expect(() => userSystem.createUser(userData)).toThrow();
  });
});
```

## FAQ and Troubleshooting

### Common Issues

**Q: Why am I getting "UPDATE operation requires at least one WHERE condition"?**

A: This is a safety feature to prevent accidental full-table updates. Always add a WHERE clause:

```typescript
// ❌ This will throw an error
users.update({ active: false });

// ✅ Correct usage
users.where({ role: "temp" }).update({ active: false });

// ✅ For intentional full-table updates
users.whereRaw("1 = 1").update({ migrated: true });
```

**Q: How do I handle large datasets without running out of memory?**

A: Use pagination and process data in chunks:

```typescript
// Process large tables in batches
function processLargeTable(tableName: string, processor: (row: any) => void) {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let batch: any[];
  
  do {
    batch = db.table(tableName)
      .limit(BATCH_SIZE)
      .offset(offset)
      .all();
    
    batch.forEach(processor);
    offset += BATCH_SIZE;
  } while (batch.length === BATCH_SIZE);
}
```

**Q: Why are my regex conditions slow?**

A: Regex conditions are applied client-side after SQL filtering. Always use SQL WHERE conditions first to reduce the dataset:

```typescript
// ❌ Slow - regex on entire table
users.whereRgx({ email: /@gmail\.com$/ }).all();

// ✅ Fast - SQL filter first, then regex
users
  .where({ active: true })
  .whereRaw("email LIKE '%@gmail.com'")
  .whereRgx({ email: /@gmail\.com$/ })
  .all();
```

**Q: How do I handle database migrations safely?**

A: Always use transactions and backup before migrations:

```typescript
// Safe migration pattern
function safeMigration() {
  // Backup first (in production)
  db.exec("VACUUM INTO 'backup.db'");
  
  try {
    db.transaction(() => {
      // Migration steps
      db.createTable("new_table", schema);
      db.exec("INSERT INTO new_table SELECT * FROM old_table");
      db.dropTable("old_table");
      db.exec("ALTER TABLE new_table RENAME TO old_table");
    });
  } catch (error) {
    console.error("Migration failed:", error);
    // Restore from backup if needed
    throw error;
  }
}
```

**Q: Can I use this library with Node.js?**

A: No, this library is specifically designed for Bun's `bun:sqlite`. For Node.js, consider using `better-sqlite3` or similar libraries.

**Q: How do I optimize for high concurrency?**

A: Use WAL mode and optimize your pragmas:

```typescript
const db = new DB("app.db", {
  pragmas: [
    ["journal_mode", "WAL"],           // Enable concurrent reads
    ["synchronous", "NORMAL"],         // Balance safety and speed  
    ["busy_timeout", 5000],           // Wait for locks
    ["cache_size", -64000],           // 64MB cache
    ["wal_autocheckpoint", 1000]      // Checkpoint every 1000 pages
  ]
});
```

## License and Contributing

This library is released under the Mozilla Public License 2.0 (MPL-2.0).

### Contributing

We welcome contributions! Please:


1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Performance Contributions

For performance-related PRs, please include:

* Benchmark scripts showing before/after performance
* Clear description of the optimization
* Test coverage for the changes

### Reporting Issues

When reporting issues, please include:

* Bun version
* Library version
* Minimal reproduction code
* Expected vs actual behavior
* Database schema (if relevant)

For more information and updates, visit the [project homepage](https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99/doc/dockstatsqlite-wrapper-Lxt4IphXI5).