use std::cell::RefCell;
use std::collections::HashMap;
use std::ffi::{c_char, CStr, CString};
use std::sync::LazyLock;
use std::sync::Mutex;

mod ffi;
mod schema;
mod tests;
mod validation;

use schema::entry::SchemaEntry;
use validation::types::{ValidationErrorDetail, ValidationResult};

use crate::ffi::helpers::{err_result, json_pointer_to_dot, random_schema_id, set_last_result};

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

/// JavaScript Number.MAX_SAFE_INTEGER = 2^53 - 1.
/// Schema ids must fit in a JS number without precision loss.
const MAX_SAFE_ID: u64 = (1u64 << 53) - 1;

static SCHEMAS: LazyLock<Mutex<HashMap<u64, SchemaEntry>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

thread_local! {
    static LAST_RESULT: RefCell<Option<CString>> = const { RefCell::new(None) };
}

// ---------------------------------------------------------------------------
// FFI exports
// ---------------------------------------------------------------------------

/// Compile a JSON Schema string. Returns schema id > 0 on success, 0 on error.
///
/// # Safety: `schema_json` must be a valid NUL-terminated UTF-8 string.
#[no_mangle]
pub extern "C" fn compile_schema(schema_json: *const c_char) -> u64 {
    if schema_json.is_null() {
        return 0;
    }

    let schema_str = match unsafe { CStr::from_ptr(schema_json).to_str() } {
        Ok(s) => s,
        Err(_) => return 0,
    };

    let schema_value: serde_json::Value = match serde_json::from_str(schema_str) {
        Ok(v) => v,
        Err(e) => {
            set_last_result(err_result("$", format!("Invalid JSON Schema: {}", e)));
            return 0;
        }
    };

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

    let id = random_schema_id();
    SCHEMAS.lock().unwrap().insert(
        id,
        SchemaEntry {
            compiled,
            _schema_value: schema_value,
        },
    );

    id
}

/// Validate `data_json` against compiled schema `schema_id`.
/// Read the result via `get_last_result`. Call `free_last_result` when done.
///
/// # Safety: `data_json` must be a valid NUL-terminated UTF-8 string.
#[no_mangle]
pub extern "C" fn validate(schema_id: u64, data_json: *const c_char) {
    if data_json.is_null() {
        set_last_result(err_result("$", "Input data pointer is null".to_string()));
        return;
    }

    let data_str = match unsafe { CStr::from_ptr(data_json).to_str() } {
        Ok(s) => s,
        Err(_) => {
            set_last_result(err_result("$", "Input data is not valid UTF-8".to_string()));
            return;
        }
    };

    let store = SCHEMAS.lock().unwrap();

    let entry = match store.get(&schema_id) {
        Some(e) => e,
        None => {
            set_last_result(err_result(
                "$",
                format!("Schema id {} not found (may have been freed)", schema_id),
            ));
            return;
        }
    };

    let data: serde_json::Value = match serde_json::from_str(data_str) {
        Ok(v) => v,
        Err(e) => {
            set_last_result(err_result("$", format!("Invalid JSON input: {}", e)));
            return;
        }
    };

    let mut errors = Vec::new();
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

    set_last_result(
        serde_json::to_string(&ValidationResult {
            valid: errors.is_empty(),
            errors,
        })
        .unwrap(),
    );
}

/// Free the compiled schema identified by `schema_id`.
#[no_mangle]
pub extern "C" fn free_schema(schema_id: u64) {
    SCHEMAS.lock().unwrap().remove(&schema_id);
}

/// Return a pointer to the NUL-terminated last result string.
/// Valid until the next call to `compile_schema`, `validate`, or
/// `free_last_result`.
#[no_mangle]
pub extern "C" fn get_last_result() -> *const c_char {
    LAST_RESULT.with(|cell| match cell.borrow().as_ref() {
        Some(cs) => cs.as_ptr(),
        None => std::ptr::null(),
    })
}

/// Free the last result string.
#[no_mangle]
pub extern "C" fn free_last_result() {
    LAST_RESULT.with(|cell| *cell.borrow_mut() = None);
}
