use std::ffi::CString;

use rand::RngExt;

use crate::{
    validation::types::{ValidationErrorDetail, ValidationResult},
    LAST_RESULT, MAX_SAFE_ID, SCHEMAS,
};

pub fn set_last_result(json: String) {
    let cs = CString::new(json).expect("result must not contain NUL");
    LAST_RESULT.with(|cell| *cell.borrow_mut() = Some(cs));
}

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

pub fn err_result(path: &str, message: String) -> String {
    serde_json::to_string(&ValidationResult {
        valid: false,
        errors: vec![ValidationErrorDetail {
            path: path.to_string(),
            message,
        }],
    })
    .unwrap()
}

pub fn random_schema_id() -> u64 {
    let mut rng = rand::rng();
    let id = rng.random_range(1..MAX_SAFE_ID);
    // Ensure no collision with an existing id.
    let store = SCHEMAS.lock().unwrap();
    let mut id = id;
    while store.contains_key(&id) {
        id = rng.random_range(1..MAX_SAFE_ID);
    }
    id
}
