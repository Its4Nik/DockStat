# @dockstat/validator - Native Implementation

This document explains the technical implementation of the Rust validation engine and FFI integration. For user-facing documentation and TypeScript usage, see [../README.md](../README.md).

## Architecture Overview

The validator uses a hybrid architecture where TypeScript provides the developer interface and Rust handles the heavy lifting of validation through Foreign Function Interface (FFI) calls.

### Component Structure

```
TypeScript Layer          Rust Layer
├── Schema Builder    →   lib.rs (FFI exports)
├── Type Inference    →   jsonschema crate
├── Validation API    →   Validation Engine
└── FFI Wrapper       →   helpers.rs
```

The TypeScript layer creates JSON Schema structures and sends them to Rust for compilation and validation. Rust maintains compiled schemas in memory and executes validations with maximum performance.

## FFI Interface

The Rust library exports five C-compatible functions that the TypeScript layer calls via Bun's FFI:

### Schema Compilation

```rust
pub extern "C" fn compile_schema(schema_json: *const c_char) -> u64
```

**Process:**

1. Receives a NUL-terminated UTF-8 string containing JSON Schema
2. Validates the input JSON syntax
3. Compiles the schema using the `jsonschema` crate
4. Stores the compiled validator in a global HashMap with a unique ID
5. Returns the schema ID (> 0 on success, 0 on failure)

**Error Handling:**
- Null pointer returns 0
- Invalid JSON returns 0 with error details in last result
- Invalid schema structure returns 0 with compilation error

### Validation Execution

```rust
pub extern "C" fn validate(schema_id: u64, data_json: *const c_char)
```

**Process:**

1. Retrieves the compiled schema from the HashMap by ID
2. Parses the input data as JSON
3. Executes validation using the compiled schema
4. Collects all validation errors
5. Stores the result in thread-local storage for retrieval

**Result Format:**
```json
{
  "valid": boolean,
  "errors": [
    {
      "path": "dot.separated.path",
      "message": "Human-readable error description"
    }
  ]
}
```

### Schema Management

```rust
pub extern "C" fn free_schema(schema_id: u64)
```

Removes a compiled schema from the HashMap, freeing the associated memory. The TypeScript layer should call this when a schema is no longer needed.

### Result Retrieval

```rust
pub extern "C" fn get_last_result() -> *const c_char
pub extern "C" fn free_last_result()
```

These functions manage the validation result lifecycle:

1. `get_last_result()` returns a pointer to the last validation/compilation result
2. The pointer remains valid until the next operation or explicit free
3. `free_last_result()` releases the result memory

## Global State Management

### Schema Storage

Compiled schemas are stored in a global HashMap protected by a Mutex:

```rust
static SCHEMAS: LazyLock<Mutex<HashMap<u64, SchemaEntry>>> = 
    LazyLock::new(|| Mutex::new(HashMap::new()));
```

**Schema Entry Structure:**
```rust
pub struct SchemaEntry {
    pub compiled: jsonschema::Validator,
    pub _schema_value: Value,
}
```

The `_schema_value` field preserves the original JSON schema value because the compiled validator borrows from it. Dropping the schema value would invalidate the compiled validator.

### Schema ID Generation

Schema IDs are random 64-bit integers that fit within JavaScript's safe integer range:

```rust
const MAX_SAFE_ID: u64 = (1u64 << 53) - 1;
```

The ID generation uses the `rand` crate and checks for collisions:

```rust
pub fn random_schema_id() -> u64 {
    let mut rng = rand::rng();
    let id = rng.random_range(1..MAX_SAFE_ID);
    let store = SCHEMAS.lock().unwrap();
    let mut id = id;
    while store.contains_key(&id) {
        id = rng.random_range(1..MAX_SAFE_ID);
    }
    id
}
```

### Thread-Local Results

Validation results are stored in thread-local storage to avoid synchronization overhead:

```rust
thread_local! {
    static LAST_RESULT: RefCell<Option<CString>> = const { RefCell::new(None) };
}
```

This design allows multiple validations to occur concurrently without race conditions, as each thread maintains its own result buffer.

## Path Translation

The `jsonschema` crate uses JSON Pointer notation (RFC 6901) for error paths, but this library converts them to dot notation for better JavaScript compatibility:

```rust
pub fn json_pointer_to_dot(pointer: &str) -> String {
    if pointer.is_empty() {
        return "$".to_string();
    }
    pointer
        .split('/')
        .skip(1)
        .map(|t| t.replace("~1", "/").replace("~0", "~"))
        .collect::<Vec<_>>()
        .join(".")
}
```

**Examples:**
- `""` → `"$"` (root)
- `"/foo"` → `"foo"`
- `"/foo/0/bar"` → `"foo.0.bar"`
- `"/user~1profile"` → `"user/profile"`

The `~0` and `~1` escape sequences are unescaped according to JSON Pointer specification.

## Error Handling Strategy

The implementation uses a consistent error handling pattern:

### FFI Function Errors

All FFI functions handle errors by setting a result rather than panicking:

```rust
pub fn err_result(path: &str, message: String) -> String {
    serde_json::to_string(&ValidationResult {
        valid: false,
        errors: vec![ValidationErrorDetail {
            path: path.to_string(),
            message,
        }],
    }).unwrap()
}
```

This ensures that Rust panics never cross the FFI boundary, which would crash the JavaScript process.

### Validation Error Collection

The `jsonschema` crate returns an iterator of validation errors:

```rust
if let Err(iter) = entry.compiled.validate(&data) {
    for err in iter {
        errors.push(ValidationErrorDetail {
            path: json_pointer_to_dot(&err.instance_path.to_string()),
            message: format!(
                "Error while validating '{}' at {} ({})",
                &err.instance, &err.instance_path, &err.schema_path
            ),
        });
    }
}
```

All errors are collected rather than stopping at the first failure, providing complete validation feedback.

## TypeScript Integration

### FFI Loader

The TypeScript layer uses Bun's `dlopen` to load the native library:

```typescript
export const { symbols } = dlopen(nativePath, {
  compile_schema: {
    args: [FFIType.cstring],
    returns: FFIType.u64,
  },
  validate: {
    args: [FFIType.u64, FFIType.cstring],
    returns: FFIType.void,
  },
  free_schema: {
    args: [FFIType.u64],
    returns: FFIType.void,
  },
  get_last_result: {
    args: [],
    returns: FFIType.cstring,
  },
  free_last_result: {
    args: [],
    returns: FFIType.void,
  },
})
```

### String Handling

TypeScript creates NUL-terminated strings for Rust consumption:

```typescript
function cstr(str: string): Buffer {
  return Buffer.concat([Buffer.from(str), Buffer.from([0])])
}
```

### Schema Conversion

The TypeScript builder creates rich schema objects with TypeScript-specific metadata. Before sending to Rust, these are converted to plain JSON Schema:

```typescript
function toPlainSchema(schema: unknown): unknown {
  if (schema === null || typeof schema !== "object") return schema
  
  const obj = schema as Record<string, unknown>
  const clean: Record<string, unknown> = {}
  
  // Remove internal keys like "~standard"
  for (const key of Object.keys(obj)) {
    if (INTERNAL_KEYS.has(key)) continue
    clean[key] = obj[key]
  }
  
  // Recursively clean nested structures
  if ("properties" in clean) {
    clean.properties = toPlainSchema(clean.properties)
  }
  if ("items" in clean) {
    clean.items = toPlainSchema(clean.items)
  }
  if ("anyOf" in clean) {
    clean.anyOf = clean.anyOf.map(toPlainSchema)
  }
  
  return clean
}
```

## Memory Management

### Schema Lifecycle

1. **Compilation**: Schema is parsed and compiled, stored in HashMap
2. **Usage**: Schema remains in memory for repeated validations
3. **Cleanup**: `free_schema()` removes entry from HashMap

The TypeScript layer should always call `free_schema()` when done with a schema to prevent memory leaks.

### Result Lifecycle

1. **Generation**: Result is stored in thread-local CString
2. **Retrieval**: Pointer is returned via `get_last_result()`
3. **Cleanup**: `free_last_result()` releases the memory

The TypeScript layer automatically frees results after each operation in the convenience functions.

## JSON Schema Compliance

The library uses JSON Schema Draft 2020-12 with format validation enabled:

```rust
let compiled = match jsonschema::Validator::options()
    .with_draft(jsonschema::Draft::Draft202012)
    .should_validate_formats(true)
    .build(&schema_value)
{
    Ok(c) => c,
    Err(e) => {
        set_last_result(err_result("$", format!("Schema compilation error: {}", e)));
        return 0;
    }
};
```

This ensures full compliance with the JSON Schema specification while providing additional format validation for common patterns like email addresses and URIs.

## Performance Characteristics

### Compilation Cost

Schema compilation is the most expensive operation because it involves:

1. JSON parsing
2. Schema structure validation
3. Compilation into an efficient validator
4. Storage in the global HashMap

This cost is amortized across multiple validations when using `compileSchema()` + `validate()` pattern.

### Validation Performance

Once compiled, validation is very fast because:

1. The schema is already optimized
2. The Rust engine avoids JavaScript overhead
3. Error collection is batched
4. No JSON parsing during validation (data is pre-serialized)

### Memory Efficiency

The design optimizes memory usage by:

1. Storing only one compiled schema per unique schema
2. Using thread-local results to avoid contention
3. Allowing explicit cleanup of unused schemas
4. Reusing result buffers across operations

## Testing Strategy

The Rust implementation includes comprehensive tests covering:

- All schema types (string, number, integer, boolean, null, array, object)
- Constraint validation (minLength, maximum, pattern, etc.)
- Complex scenarios (nested objects, arrays, unions)
- Error handling (invalid JSON, null pointers, freed schemas)
- Edge cases (empty schemas, never schemas, path escaping)

Tests use a helper pattern to compile schemas and validate data with automatic cleanup:

```rust
fn compile(schema: &str) -> u64 {
    let c_schema = CString::new(schema).unwrap();
    let id = { crate::compile_schema(c_schema.as_ptr()) };
    crate::free_last_result();
    assert_ne!(id, 0, "schema compilation failed: {schema}");
    id
}

fn validate(schema_id: u64, data: &str) -> ValidationResult {
    let c_data = CString::new(data).unwrap();
    { crate::validate(schema_id, c_data.as_ptr()) };
    let ptr = crate::get_last_result();
    let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap();
    let result: ValidationResult = serde_json::from_str(json).unwrap();
    crate::free_last_result();
    result
}
```

## Implementation Guides

### Adding New Validation Types

To add support for a new JSON Schema feature:

1. **TypeScript Layer**: Add a new method to the schema builder
   ```typescript
   t.Uri() {
     return addStd({ type: "string", format: "uri" } satisfies TUri)
   }
   ```

2. **Type Definitions**: Define the TypeScript interface
   ```typescript
   export interface TUri extends StringOptions {
     type: "string"
     format: "uri"
   }
   ```

3. **Testing**: Add tests for both TypeScript and Rust layers
   ```typescript
   test("t.Uri() validates URIs", () => {
     const schema = t.Uri()
     expect(validateSchema(schema, "https://example.com").valid).toBe(true)
   })
   ```

No changes are typically needed in the Rust layer unless custom validation logic is required.

### Extending Error Messages

To customize error messages, modify the error collection in `lib.rs`:

```rust
for err in iter {
    errors.push(ValidationErrorDetail {
        path: json_pointer_to_dot(&err.instance_path.to_string()),
        message: format!("Custom message for: {}", err.instance_path),
    });
}
```

The TypeScript layer can also provide custom error formatting by processing the raw validation results.

### Adding Custom Formats

To add custom format validators, extend the JSON Schema options:

```rust
let compiled = match jsonschema::Validator::options()
    .with_draft(jsonschema::Draft::Draft202012)
    .should_validate_formats(true)
    .with_format("custom", |value| {
        // Custom validation logic
        true // Return false for invalid values
    })
    .build(&schema_value)
{
    Ok(c) => c,
    Err(e) => return 0,
};
```

Then use it in TypeScript:

```typescript
t.String({ format: "custom" })
```

### Optimizing for High Throughput

For applications requiring maximum throughput:

1. **Schema Reuse**: Always use `compileSchema()` + `validate()` for repeated validations
2. **Batch Processing**: Process multiple items with the same compiled schema
3. **Memory Management**: Explicitly free schemas when done
4. **Error Handling**: Design error handling to minimize the impact of validation failures

Example batch processing pattern:

```typescript
const schemaId = compileSchema(yourSchema)

try {
  const results = data.map(item => ({
    item,
    result: validate(schemaId, item)
  }))
  
  const valid = results.filter(r => r.result.valid)
  const invalid = results.filter(r => !r.result.valid)
  
  return { valid, invalid }
} finally {
  freeSchema(schemaId)
}
```

## Dependencies

The Rust implementation depends on:

- `serde` and `serde_json`: JSON serialization/deserialization
- `jsonschema`: Core validation engine with Draft 2020-12 support
- `rand`: Schema ID generation

These dependencies are chosen for:

- **Performance**: Minimal overhead and fast execution
- **Correctness**: Standards-compliant JSON Schema implementation
- **Safety**: Rust's memory safety guarantees prevent common vulnerabilities

## Build Configuration

The Cargo.toml is configured for production builds:

```toml
[profile.release]
opt-level = 3        # Maximum optimization
lto = true          # Link-time optimization
strip = true        # Remove debug symbols
```

These settings produce the smallest, fastest possible binary for production use while maintaining correct behavior.

## Troubleshooting

### Schema Compilation Failures

If `compileSchema` returns 0, check:

1. The JSON schema syntax is valid
2. The schema structure follows JSON Schema Draft 2020-12
3. Required dependencies are available
4. Check `get_last_result()` for specific error messages

### Memory Leaks

If memory usage grows over time:

1. Ensure `freeSchema()` is called for each compiled schema
2. Check that `free_last_result()` is called after each operation
3. Verify that compiled schemas are not duplicated

### Validation Inconsistencies

If validation results differ from expectations:

1. Verify the JSON Schema Draft version (2020-12)
2. Check that format validation is enabled
3. Review error paths and messages for clues
4. Test with pure JSON Schema to isolate issues

This technical documentation provides the foundation for understanding and extending the Rust implementation. For usage examples and TypeScript integration, refer to the main [README.md](../README.md).