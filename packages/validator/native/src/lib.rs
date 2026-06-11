use std::ffi::{c_char, CStr, CString};
use std::sync::LazyLock;
use std::sync::Mutex;

mod ffi;
mod schema;
mod tests;
mod validation;

use ffi::helpers::set_last_result;
use ffi::LAST_RESULT;
use schema::SchemaStore;
use validation::types::{ValidationErrorDetail, ValidationResult};

use crate::ffi::helpers::cstring_to_ptr;

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

static SCHEMA_STORE: LazyLock<Mutex<SchemaStore>> =
    LazyLock::new(|| Mutex::new(SchemaStore::new()));

// ---------------------------------------------------------------------------
// FFI exports
// ---------------------------------------------------------------------------

/// Compile a JSON Schema string and return a schema id (> 0).
/// On error the id is 0 and the error details can be read via
/// `get_last_result`.
///
/// # Safety
/// `schema_json` must be a valid pointer to a NUL-terminated UTF-8 string.
#[no_mangle]
pub extern "C" fn compile_schema(schema_json: *const c_char) -> u64 {
    if schema_json.is_null() {
        return 0;
    }

    let schema_str = unsafe {
        match CStr::from_ptr(schema_json).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let mut store = SCHEMA_STORE.lock().unwrap();
    let mut guard = LAST_RESULT.lock().unwrap();

    let mut ptr: Option<*mut c_char> = guard.take().map(CString::into_raw);

    store.compile(schema_str, &mut ptr)
}

/// Validate `data_json` (a JSON string) against the schema identified by
/// `schema_id`. The result is a JSON `ValidationResult` string accessible
/// via `get_last_result`. **Call `free_last_result` when done.**
///
/// # Safety
/// `data_json` must be a valid pointer to a NUL-terminated UTF-8 string.
#[no_mangle]
pub extern "C" fn validate(schema_id: u64, data_json: *const c_char) {
    if data_json.is_null() {
        let mut last = cstring_to_ptr(LAST_RESULT.lock().unwrap());
        set_last_result(
            &mut last,
            serde_json::to_string(&ValidationResult {
                valid: false,
                errors: vec![ValidationErrorDetail {
                    path: "$".to_string(),
                    message: "Input data pointer is null".to_string(),
                }],
            })
            .unwrap(),
        );
        return;
    }

    let data_str = unsafe {
        match CStr::from_ptr(data_json).to_str() {
            Ok(s) => s,
            Err(_) => {
                let mut last = cstring_to_ptr(LAST_RESULT.lock().unwrap());
                set_last_result(
                    &mut last,
                    serde_json::to_string(&ValidationResult {
                        valid: false,
                        errors: vec![ValidationErrorDetail {
                            path: "$".to_string(),
                            message: "Input data is not valid UTF-8".to_string(),
                        }],
                    })
                    .unwrap(),
                );
                return;
            }
        }
    };

    let store = SCHEMA_STORE.lock().unwrap();
    let mut last = cstring_to_ptr(LAST_RESULT.lock().unwrap());
    store.validate(schema_id, data_str, &mut last);
}

/// Free the compiled schema identified by `schema_id`.
#[no_mangle]
pub extern "C" fn free_schema(schema_id: u64) {
    let mut store = SCHEMA_STORE.lock().unwrap();
    store.remove(schema_id);
}

/// Return a pointer to the NUL-terminated last result string.
/// The returned pointer remains valid until the next call to
/// `compile_schema`, `validate`, or `free_last_result`.
#[no_mangle]
pub extern "C" fn get_last_result() -> *const c_char {
    let guard = LAST_RESULT.lock().unwrap();
    match guard.as_ref() {
        Some(cstring) => cstring.as_ptr(),
        None => std::ptr::null(),
    }
}

/// Free the memory backing the last result string returned by
/// `compile_schema` or `validate`.
#[no_mangle]
pub extern "C" fn free_last_result() {
    let mut last = cstring_to_ptr(LAST_RESULT.lock().unwrap());
    if let Some(ptr) = last.take() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}
