use std::{
    ffi::{c_char, CString},
    sync::MutexGuard,
};

/// Helper: store a JSON result string as a null-terminated C string in
/// `LAST_RESULT`, freeing any previous value.
pub fn set_last_result(slot: &mut Option<*mut c_char>, json_str: String) {
    let c_string = CString::new(json_str).expect("result string must not contain NUL bytes");
    let ptr = c_string.into_raw();
    if let Some(old) = std::mem::replace(slot, Some(ptr)) {
        unsafe {
            let _ = CString::from_raw(old);
        }
    }
}

/// Convert a JSON Pointer (RFC 6901) to dot-notation.
///   ""          -> "$"
///   "/foo/0/bar" -> "foo.0.bar"
pub fn json_pointer_to_dot(pointer: &str) -> String {
    if pointer.is_empty() {
        return "$".to_string();
    }
    let parts: Vec<&str> = pointer.split('/').skip(1).collect();
    // Unescape JSON Pointer tokens: ~1 -> /, ~0 -> ~
    let decoded: Vec<String> = parts
        .iter()
        .map(|t| t.replace("~1", "/").replace("~0", "~"))
        .collect();
    decoded.join(".")
}

/// Convert a CString to a ptr
pub fn cstring_to_ptr(mut cstring: MutexGuard<'_, Option<CString>>) -> Option<*mut i8> {
    return cstring.take().map(CString::into_raw);
}
