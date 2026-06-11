use std::collections::HashMap;
use std::ffi::c_char;

use serde_json::Value;

use crate::ffi::helpers::{json_pointer_to_dot, set_last_result};
use crate::schema::entry::SchemaEntry;
use crate::validation::types::{ValidationErrorDetail, ValidationResult};

pub struct SchemaStore {
    schemas: HashMap<u64, SchemaEntry>,
    next_id: u64,
}

impl SchemaStore {
    pub fn new() -> Self {
        Self {
            schemas: HashMap::new(),
            next_id: 1,
        }
    }

    /// Parse and compile a JSON Schema string. Returns the schema id on
    /// success, or an error message on failure (returned via `last_result`).
    pub fn compile(&mut self, schema_str: &str, last_result: &mut Option<*mut c_char>) -> u64 {
        let schema_value: Value = match serde_json::from_str(schema_str) {
            Ok(v) => v,
            Err(e) => {
                set_last_result(
                    last_result,
                    serde_json::to_string(&ValidationResult {
                        valid: false,
                        errors: vec![ValidationErrorDetail {
                            path: "$".to_string(),
                            message: format!("Invalid JSON Schema: {}", e),
                        }],
                    })
                    .unwrap(),
                );
                return 0;
            }
        };

        // We need to own the Value for the lifetime of the compiled schema.
        // jsonschema::JSONSchema borrows the schema Value, so we store both.
        let compiled = match jsonschema::Validator::options()
            .with_draft(jsonschema::Draft::Draft202012)
            .should_validate_formats(true)
            .build(&schema_value)
        {
            Ok(c) => c,
            Err(e) => {
                set_last_result(
                    last_result,
                    serde_json::to_string(&ValidationResult {
                        valid: false,
                        errors: vec![ValidationErrorDetail {
                            path: "$".to_string(),
                            message: format!("Schema compilation error: {}", e),
                        }],
                    })
                    .unwrap(),
                );
                return 0;
            }
        };

        let id = self.next_id;
        self.next_id += 1;

        // Safety: we are transferring ownership of schema_value into the
        // SchemaEntry where it will live as long as the schema is registered.
        // let compiled = unsafe {
        //     std::mem::transmute::<
        //         jsonschema::JSONSchema<'_, Value>,
        //         jsonschema::JSONSchema<'static, Value>,
        //     >(compiled)
        // };

        self.schemas.insert(
            id,
            SchemaEntry {
                compiled,
                _schema_value: schema_value,
            },
        );

        id
    }

    /// Validate `data_str` (a JSON string) against the schema identified by
    /// `id`. Returns a JSON `ValidationResult` string written to `last_result`.
    pub fn validate(&self, id: u64, data_str: &str, last_result: &mut Option<*mut c_char>) {
        let entry = match self.schemas.get(&id) {
            Some(e) => e,
            None => {
                set_last_result(
                    last_result,
                    serde_json::to_string(&ValidationResult {
                        valid: false,
                        errors: vec![ValidationErrorDetail {
                            path: "$".to_string(),
                            message: format!("Schema id {} not found (may have been freed)", id),
                        }],
                    })
                    .unwrap(),
                );
                return;
            }
        };

        let data: Value = match serde_json::from_str(data_str) {
            Ok(v) => v,
            Err(e) => {
                set_last_result(
                    last_result,
                    serde_json::to_string(&ValidationResult {
                        valid: false,
                        errors: vec![ValidationErrorDetail {
                            path: "$".to_string(),
                            message: format!("Invalid JSON input: {}", e),
                        }],
                    })
                    .unwrap(),
                );
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

        let result = ValidationResult {
            valid: errors.is_empty(),
            errors,
        };

        set_last_result(last_result, serde_json::to_string(&result).unwrap());
    }

    pub fn remove(&mut self, id: u64) -> bool {
        self.schemas.remove(&id).is_some()
    }
}
