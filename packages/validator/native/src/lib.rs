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
// Binary result writer
// ---------------------------------------------------------------------------

/// Writes a compact binary validation result directly into a byte buffer.
///
/// Layout:
/// ```text
/// [0]    valid (0 or 1)
/// [1..2] error_count (u16 LE)
/// [3..]  for each error:
///          [..2] path_len   (u16 LE)
///          [..]  path bytes  (UTF-8)
///          [..2] msg_len    (u16 LE)
///          [..]  msg bytes   (UTF-8)
/// ```
///
/// Returns the total bytes written, or 0 if the buffer is too small.
struct BinaryWriter<'a> {
    buf: &'a mut [u8],
    offset: usize,
}

impl<'a> BinaryWriter<'a> {
    fn new(buf: &'a mut [u8]) -> Self {
        Self { buf, offset: 0 }
    }

    fn remaining(&self) -> usize {
        self.buf.len().saturating_sub(self.offset)
    }

    fn write_u8(&mut self, val: u8) -> bool {
        if self.remaining() < 1 {
            return false;
        }
        self.buf[self.offset] = val;
        self.offset += 1;
        true
    }

    fn write_u16_le(&mut self, val: u16) -> bool {
        if self.remaining() < 2 {
            return false;
        }
        self.buf[self.offset..self.offset + 2].copy_from_slice(&val.to_le_bytes());
        self.offset += 2;
        true
    }

    fn write_bytes(&mut self, data: &[u8]) -> bool {
        if self.remaining() < data.len() {
            return false;
        }
        self.buf[self.offset..self.offset + data.len()].copy_from_slice(data);
        self.offset += data.len();
        true
    }

    fn len(&self) -> usize {
        self.offset
    }
}

// ---------------------------------------------------------------------------
// Core validation logic (shared by single + batch)
// ---------------------------------------------------------------------------

#[inline]
fn do_validate(
    entry: &SchemaEntry,
    data_str: &str,
    writer: &mut BinaryWriter,
) -> bool {
    let data: serde_json::Value = match serde_json::from_str(data_str) {
        Ok(v) => v,
        Err(_) => return false,
    };

    match entry.compiled.validate(&data) {
        Ok(()) => {
            writer.write_u8(1);
            writer.write_u16_le(0);
            true
        }
        Err(errors_iter) => {
            writer.write_u8(0);
            // We need to collect to know the count first, but also need to write
            // after the count. Two-pass: count, then write. Or collect into vec.
            let errors: Vec<_> = errors_iter.collect();
            let count = errors.len().min(u16::MAX as usize) as u16;
            writer.write_u16_le(count);

            for err in errors.into_iter().take(count as usize) {
                let path = json_pointer_to_dot(&err.instance_path.to_string());
                let path_bytes = path.as_bytes();
                // Simplified message: just the keyword at schema_path
                let msg = err.keyword.to_string();
                let msg_bytes = msg.as_bytes();

                if !writer.write_u16_le(path_bytes.len() as u16)
                    || !writer.write_bytes(path_bytes)
                    || !writer.write_u16_le(msg_bytes.len() as u16)
                    || !writer.write_bytes(msg_bytes)
                {
                    return false; // buffer too small
                }
            }
            true
        }
    }
}

// ---------------------------------------------------------------------------
// FFI exports — compile / free
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

/// Free the compiled schema identified by `schema_id`.
#[no_mangle]
pub extern "C" fn free_schema(schema_id: u64) {
    SCHEMAS.lock().unwrap().remove(&schema_id);
}

// ---------------------------------------------------------------------------
// FFI exports — validate (binary protocol)
// ---------------------------------------------------------------------------

/// Validate a single JSON payload against a compiled schema.
///
/// Writes a compact binary result into `result_buf`. Returns the number of bytes
/// written, or 0 on error (null pointers, schema not found, buffer too small).
///
/// # Safety
/// - `data_ptr` must point to `data_len` bytes of valid UTF-8.
/// - `result_buf` must be writable and at least `result_buf_cap` bytes.
#[no_mangle]
pub extern "C" fn validate(
    schema_id: u64,
    data_ptr: *const u8,
    data_len: u32,
    result_buf: *mut u8,
    result_buf_cap: u32,
) -> u32 {
    if data_ptr.is_null() || result_buf.is_null() {
        return 0;
    }

    let data_str = unsafe {
        let slice = std::slice::from_raw_parts(data_ptr, data_len as usize);
        match std::str::from_utf8(slice) {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let store = SCHEMAS.lock().unwrap();
    let entry = match store.get(&schema_id) {
        Some(e) => e,
        None => return 0,
    };

    let result_slice = unsafe {
        std::slice::from_raw_parts_mut(result_buf, result_buf_cap as usize)
    };

    let mut writer = BinaryWriter::new(result_slice);
    if do_validate(entry, data_str, &mut writer) {
        writer.len() as u32
    } else {
        0
    }
}

/// Validate multiple JSON payloads in a single call.
///
/// `batch_ptr` points to a buffer of length-prefixed JSON items:
/// ```text
/// [u32_le len_0][json_0 bytes][u32_le len_1][json_1 bytes]...
/// ```
///
/// `batch_len` is the total byte length of the batch buffer.
///
/// Writes consecutive binary results into `result_buf` (same layout as
/// `validate`, one after another). Returns the total bytes written, or 0 on
/// error.
///
/// # Safety
/// - `batch_ptr` must point to `batch_len` bytes containing valid
///   length-prefixed UTF-8 segments.
/// - `result_buf` must be writable and at least `result_buf_cap` bytes.
#[no_mangle]
pub extern "C" fn validate_batch(
    schema_id: u64,
    batch_ptr: *const u8,
    batch_len: u32,
    result_buf: *mut u8,
    result_buf_cap: u32,
) -> u32 {
    if batch_ptr.is_null() || result_buf.is_null() {
        return 0;
    }

    let batch = unsafe {
        std::slice::from_raw_parts(batch_ptr, batch_len as usize)
    };

    let store = SCHEMAS.lock().unwrap();
    let entry = match store.get(&schema_id) {
        Some(e) => e,
        None => return 0,
    };

    let result_slice = unsafe {
        std::slice::from_raw_parts_mut(result_buf, result_buf_cap as usize)
    };
    let mut writer = BinaryWriter::new(result_slice);

    let mut offset = 0usize;
    while offset + 4 <= batch.len() {
        let item_len =
            u32::from_le_bytes([batch[offset], batch[offset + 1], batch[offset + 2], batch[offset + 3]])
                as usize;
        offset += 4;
        if offset + item_len > batch.len() {
            return 0; // malformed batch
        }
        let item_str = match std::str::from_utf8(&batch[offset..offset + item_len]) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        offset += item_len;

        if !do_validate(entry, item_str, &mut writer) {
            return 0; // result buffer too small
        }
    }

    writer.len() as u32
}

// ---------------------------------------------------------------------------
// Legacy FFI exports (kept for backwards compatibility with existing tests)
// ---------------------------------------------------------------------------

/// Validate `data_json` against compiled schema `schema_id`.
/// Read the result via `get_last_result`. Call `free_last_result` when done.
///
/// # Safety: `data_json` must be a valid NUL-terminated UTF-8 string.
#[no_mangle]
pub extern "C" fn validate_json(
    schema_id: u64,
    data_json: *const c_char,
) {
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
            errors.push(validation::types::ValidationErrorDetail {
                path: json_pointer_to_dot(&err.instance_path.to_string()),
                message: format!(
                    "Error while validating '{}' at {} ({})",
                    &err.instance, &err.instance_path, &err.schema_path
                ),
            });
        }
    }

    set_last_result(
        serde_json::to_string(&validation::types::ValidationResult {
            valid: errors.is_empty(),
            errors,
        })
        .unwrap(),
    );
}

/// Return a pointer to the NUL-terminated last result string.
/// Valid until the next call to `compile_schema`, `validate_json`, or
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
