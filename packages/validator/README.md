# @dockstat/validator

A high-performance JSON Schema validation library for Bun that combines a Rust validation engine with a TypeScript schema builder. This library provides fast validation through native FFI bindings while maintaining type safety and developer ergonomics through TypeScript's type system.

The Rust core leverages the `jsonschema` crate for standards-compliant validation, while the TypeScript layer offers a fluent builder API and type inference. For details on the Rust implementation, see [native/README.md](./native/README.md).

## Installation

```bash
bun install @dockstat/validator
```

This library requires Bun and is not tested with Node.js.

## Overview

The library provides two main approaches to validation:

1. **Schema Builder API** - Create validation schemas using a fluent TypeScript interface with full type inference
2. **Standard Schema V1** - Compatibility with the Standard Schema specification for framework integration

The validation happens through a native Rust engine that compiles JSON Schema drafts and executes validations with maximum performance.

## Quick Start

The fastest way to get started is using the schema builder:

```typescript
import { t, validateSchema } from "@dockstat/validator"

// Define a schema for user registration
const userSchema = t.Object({
  email: t.String({ format: "email" }),
  age: t.Number({ minimum: 0, maximum: 150 }),
  name: t.String({ minLength: 1 }),
  subscribeToNewsletter: t.Boolean(),
})

// Validate data
const result = validateSchema(userSchema, {
  email: "user@example.com",
  age: 25,
  name: "Alice",
  subscribeToNewsletter: true,
})

if (result.valid) {
  console.log("User data is valid")
} else {
  console.log("Validation errors:", result.errors)
}
```

## Schema Builder API

The `t` (or `v`) builder provides methods for constructing validation schemas. Each method returns a typed schema object that can be used for validation and type inference.

### Basic Types

#### String Validation

```typescript
// Basic string
t.String()

// With constraints
t.String({ 
  minLength: 5,
  maxLength: 100,
  pattern: "^[a-zA-Z]+$",
  format: "email" 
})
```

String options include `minLength`, `maxLength`, `pattern` (regular expression), and `format` (built-in validators like "email", "uri", "uuid").

#### Number Validation

```typescript
// Any number (including decimals)
t.Number()

// Integer only
t.Integer()

// With range constraints
t.Number({ 
  minimum: 0, 
  maximum: 100, 
  exclusiveMinimum: true,
  exclusiveMaximum: false 
})
```

#### Boolean and Null

```typescript
t.Boolean()  // true or false only
t.Null()     // null value only
```

### Composite Types

#### Array Validation

```typescript
// Array of strings
t.Array(t.String())

// Array with length constraints
t.Array(t.Number(), {
  minItems: 1,
  maxItems: 10,
  uniqueItems: true
})
```

#### Object Validation

```typescript
// Simple object with required properties
t.Object({
  name: t.String(),
  age: t.Number(),
})

// Optional properties
t.Object({
  name: t.String(),
  nickname: t.Optional(t.String()),
})

// Object with additional properties control
t.Object({
  id: t.String(),
}, {
  additionalProperties: false  // Reject extra properties
})
```

Only properties not wrapped with `t.Optional()` are required by default.

#### Record Validation

Use `t.Record()` for objects with dynamic keys but consistent value types:

```typescript
// Record with any values
t.Record()

// Record with string values only
t.Record(t.String())

// Record with numeric values
t.Record(t.Number())
```

### Advanced Types

#### Union Types

Accept one of several possible types:

```typescript
// String or number
t.Union(t.String(), t.Number())

// Multiple specific types
t.Union(t.String(), t.Number(), t.Boolean())
```

#### Literal Values

Accept only a specific value:

```typescript
t.Literal("admin")      // Only the string "admin"
t.Literal(42)           // Only the number 42
t.Literal(true)         // Only the boolean true
```

#### Enumerations

Accept one value from a predefined set:

```typescript
t.Enum("draft", "published", "archived")
```

#### Nullable Types

Accept a type or null:

```typescript
t.Nullable(t.String())  // string or null
```

#### Special Types

```typescript
t.Any()   // Accepts any value
t.Never() // Rejects all values (useful for logic)
```

## Validation Methods

### Direct Validation

The simplest approach validates data against a schema in one call:

```typescript
import { validateSchema } from "@dockstat/validator"

const schema = t.Object({
  email: t.String({ format: "email" }),
  age: t.Number({ minimum: 0 }),
})

const result = validateSchema(schema, { email: "test@example.com", age: 25 })

if (result.valid) {
  // Data is valid
} else {
  // Handle errors
  result.errors.forEach(error => {
    console.error(`${error.path}: ${error.message}`)
  })
}
```

### Compiled Schema Validation

For better performance when validating multiple pieces of data against the same schema, compile once and validate multiple times:

```typescript
import { compileSchema, validate, freeSchema } from "@dockstat/validator"

const schema = t.Object({
  id: t.String(),
  value: t.Number(),
})

// Compile the schema once
const schemaId = compileSchema(schema)

// Validate multiple times
const users = [
  { id: "1", value: 100 },
  { id: "2", value: 200 },
  { id: "3", value: 300 },
]

users.forEach(user => {
  const result = validate(schemaId, user)
  if (!result.valid) {
    console.error("Invalid user:", result.errors)
  }
})

// Clean up when done
freeSchema(schemaId)
```

This approach avoids recompiling the schema for each validation, which is more efficient for bulk operations.

## Standard Schema V1

All schemas created with the builder implement the Standard Schema V1 specification, making them compatible with frameworks that support this standard:

```typescript
const schema = t.String()

// Access the standard interface
const standard = schema["~standard"]

// Standard validation returns a different format
const result = standard.validate("hello")

if (result.issues) {
  // Validation failed
  result.issues.forEach(issue => {
    console.error(`${issue.path?.join(".") || "root"}: ${issue.message}`)
  })
} else {
  // Validation succeeded
  console.log("Valid value:", result.value)
}
```

The standard interface includes `version` (always 1) and `vendor` (`"@dockstat/validator"`).

## Type Inference

The library provides TypeScript type inference for schemas, allowing you to derive TypeScript types from validation schemas:

```typescript
import { t } from "@dockstat/validator"
import type { Infer } from "@dockstat/validator"

const userSchema = t.Object({
  name: t.String(),
  age: t.Number(),
  email: t.String({ format: "email" }),
  active: t.Boolean(),
})

// Infer the TypeScript type
type User = Infer<typeof userSchema>
// Equivalent to:
// type User = {
//   name: string
//   age: number
//   email: string
//   active: boolean
// }

function processUser(user: User) {
  // Fully typed with autocomplete
  console.log(user.name, user.age)
}
```

Type inference works with all schema types including optional properties, arrays, and complex nested structures.

## Error Handling

Validation errors include a path and a human-readable message:

```typescript
const result = validateSchema(
  t.Object({
    user: t.Object({
      email: t.String({ format: "email" }),
    }),
  }),
  { user: { email: "invalid" } }
)

if (!result.valid) {
  result.errors.forEach(error => {
    // error.path: "user.email"
    // error.message: Human-readable description
    console.log(`${error.path}: ${error.message}`)
  })
}
```

Paths use dot notation (e.g., `users.0.email` for array elements).

## Use Cases

### API Request Validation

Validate incoming HTTP requests:

```typescript
import { t, validateSchema } from "@dockstat/validator"

const createPostSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  content: t.String({ minLength: 1 }),
  tags: t.Array(t.String(), { maxItems: 5 }),
  published: t.Boolean(),
})

export function handleCreatePost(request: Request) {
  const data = await request.json()
  const result = validateSchema(createPostSchema, data)
  
  if (!result.valid) {
    return Response.json(
      { errors: result.errors },
      { status: 400 }
    )
  }
  
  // Process valid data
  return createPost(data)
}
```

### Configuration Validation

Ensure configuration files are valid before starting:

```typescript
import { t, validateSchema } from "@dockstat/validator"

const configSchema = t.Object({
  database: t.Object({
    host: t.String(),
    port: t.Integer({ minimum: 1, maximum: 65535 }),
    username: t.String(),
    password: t.String(),
  }),
  features: t.Record(t.Boolean()),
  environment: t.Enum("development", "staging", "production"),
})

const config = loadConfigFile()
const result = validateSchema(configSchema, config)

if (!result.valid) {
  console.error("Invalid configuration:", result.errors)
  process.exit(1)
}
```

### Form Validation

Validate user-submitted forms:

```typescript
import { t, validateSchema } from "@dockstat/validator"

const registrationSchema = t.Object({
  username: t.String({ 
    minLength: 3, 
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$" 
  }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  age: t.Integer({ minimum: 13, maximum: 120 }),
  termsAccepted: t.Boolean(),
})

function handleRegistration(formData: FormData) {
  const data = Object.fromEntries(formData)
  const result = validateSchema(registrationSchema, data)
  
  if (!result.valid) {
    return { success: false, errors: result.errors }
  }
  
  return { success: true, data }
}
```

### Data Migration Validation

Validate data integrity during migrations:

```typescript
import { t, compileSchema, validate, freeSchema } from "@dockstat/validator"

const legacyUserSchema = t.Object({
  username: t.String(),
  email_address: t.String({ format: "email" }),
})

const modernUserSchema = t.Object({
  username: t.String(),
  email: t.String({ format: "email" }),
})

const legacyId = compileSchema(legacyUserSchema)
const modernId = compileSchema(modernUserSchema)

async function migrateUser(legacyData: unknown) {
  // Validate legacy format
  const legacyResult = validate(legacyId, legacyData)
  if (!legacyResult.valid) {
    throw new Error("Invalid legacy data")
  }
  
  // Transform data
  const modernData = {
    username: legacyData.username,
    email: legacyData.email_address,
  }
  
  // Validate modern format
  const modernResult = validate(modernId, modernData)
  if (!modernResult.valid) {
    throw new Error("Migration produced invalid data")
  }
  
  return modernData
}

freeSchema(legacyId)
freeSchema(modernId)
```

### Bulk Data Processing

Efficiently validate large datasets:

```typescript
import { t, compileSchema, validate, freeSchema } from "@dockstat/validator"

const productSchema = t.Object({
  sku: t.String(),
  price: t.Number({ minimum: 0 }),
  quantity: t.Integer({ minimum: 0 }),
})

const schemaId = compileSchema(productSchema)

function processProducts(products: unknown[]) {
  const validProducts = []
  const errors = []
  
  products.forEach((product, index) => {
    const result = validate(schemaId, product)
    
    if (result.valid) {
      validProducts.push(product)
    } else {
      errors.push({
        index,
        product,
        errors: result.errors
      })
    }
  })
  
  return { validProducts, errors }
}

freeSchema(schemaId)
```

## Performance Considerations

The native Rust validation engine provides excellent performance, but consider these optimization strategies:

1. **Compile Once**: Use `compileSchema()` for schemas that will be used multiple times
2. **Free Resources**: Call `freeSchema()` when done with a compiled schema
3. **Batch Processing**: Validate data in batches rather than one at a time

## Framework Integration

The Standard Schema V1 compatibility allows integration with frameworks:

```typescript
import { t } from "@dockstat/validator"

const schema = t.Object({
  name: t.String(),
  age: t.Number(),
})

// Use with frameworks that support Standard Schema V1
app.post("/users", (req, res) => {
  const result = schema["~standard"].validate(req.body)
  
  if (result.issues) {
    return res.status(400).json({ errors: result.issues })
  }
  
  // Process valid data
  createUser(result.value)
})
```

## Available Exports

```typescript
// Schema builder
import { t, v } from "@dockstat/validator"  // v is an alias for t

// Validation functions
import { 
  validateSchema,    // One-shot validation
  validate,          // Validate against compiled schema
  compileSchema,     // Compile schema for reuse
  freeSchema,        // Free compiled schema
} from "@dockstat/validator"

// Type utilities
import type { 
  Infer,             // Infer TypeScript type from schema
  TSchema,           // Base schema type
  ValidationResult,  // Validation result interface
  ValidationErrorDetail, // Individual error
} from "@dockstat/validator"

// Schema types (for advanced use)
import type {
  TString, TNumber, TInteger, TBoolean, TNull,
  TArray, TObject, TRecord,
  TLiteral, TEnum, TUnion,
  TOptional, TNullable, TAny, TNever,
  StringOptions, NumberOptions, ArrayOptions, ObjectOptions,
} from "@dockstat/validator"
```

## Technical Details

For information about the Rust implementation, FFI integration, and internal architecture, see [native/README.md](./native/README.md).

## License

See project repository for license information.