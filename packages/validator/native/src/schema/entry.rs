use serde_json::Value;

pub struct SchemaEntry {
    pub compiled: jsonschema::Validator,
    // We keep the JSON string alive so that references inside the compiled
    // schema remain valid. The `jsonschema` crate borrows from the schema
    // Value, so we must not drop it.
    pub _schema_value: Value,
}
