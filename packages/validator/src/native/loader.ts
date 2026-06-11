import { dlopen, FFIType, suffix } from "bun:ffi"

const nativePath = `libvalidator.${suffix}`

export const { symbols } = dlopen(nativePath, {
  /**
   * Compiles a JSON stringified string to a Rust compatible format using serde
   * Stores the the schema in a HashMap
   */
  compile_schema: {
    args: [FFIType.cstring],
    returns: FFIType.u64,
  },
  /**
   * Free the memory backing the last result string returned by `compile_schema` or `validate`.
   */
  free_last_result: {
    args: [],
    returns: FFIType.void,
  },
  /**
   * Free the compiled schema identified by `schema_id`.
   */
  free_schema: {
    args: [FFIType.u64],
    returns: FFIType.void,
  },
  /**
   * Get a pointer to the NUL-terminated last result string.
   * The pointer remains valid until the next call to
   * `compile_schema`, `validate`, or `free_last_result`.
   */
  get_last_result: {
    args: [],
    returns: FFIType.cstring,
  },
  /**
   * Validate `data_json` (a JSON string) against the schema identified by  `schema_id`.
   * The result is a JSON `ValidationResult` string accessible via `get_last_result`.
   * **Call `free_last_result` when done.**
   */
  validate: {
    args: [FFIType.u64, FFIType.cstring],
    returns: FFIType.void,
  },
})
