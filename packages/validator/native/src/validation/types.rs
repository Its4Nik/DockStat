use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidationErrorDetail {
    /// Dot-separated path to the offending value (e.g. "users.0.email").
    /// Uses "$" for the root.
    pub path: String,
    /// Human-readable validation error message.
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationErrorDetail>,
}
