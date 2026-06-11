#[cfg(test)]
mod tests {
    use std::ffi::{CStr, CString};

    use crate::validation::types::ValidationResult;

    // ─── Helpers ───────────────────────────────────────────────────────────

    /// Compile a schema and return the id. Panics on compilation failure.
    fn compile(schema: &str) -> u64 {
        let c_schema = CString::new(schema).unwrap();
        let id = { crate::compile_schema(c_schema.as_ptr()) };
        crate::free_last_result();
        assert_ne!(id, 0, "schema compilation failed: {schema}");
        id
    }

    /// Validate data against a compiled schema and return the result.
    fn validate(schema_id: u64, data: &str) -> ValidationResult {
        let c_data = CString::new(data).unwrap();
        {
            crate::validate(schema_id, c_data.as_ptr())
        };
        let ptr = crate::get_last_result();
        assert!(!ptr.is_null(), "get_last_result returned null");
        let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap();
        let result: ValidationResult = serde_json::from_str(json).unwrap();
        crate::free_last_result();
        result
    }

    /// Compile a schema, expecting failure. Returns the error result.
    fn compile_fail(schema: &str) -> ValidationResult {
        let c_schema = CString::new(schema).unwrap();
        let id = { crate::compile_schema(c_schema.as_ptr()) };
        assert_eq!(id, 0, "expected compilation to fail: {schema}");
        let ptr = crate::get_last_result();
        let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap();
        let result: ValidationResult = serde_json::from_str(json).unwrap();
        crate::free_last_result();
        result
    }

    fn json_pointer_to_dot(pointer: &str) -> String {
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

    // ─── json_pointer_to_dot ───────────────────────────────────────────────

    #[test]
    fn test_json_pointer_to_dot() {
        assert_eq!(json_pointer_to_dot(""), "$");
        assert_eq!(json_pointer_to_dot("/foo"), "foo");
        assert_eq!(json_pointer_to_dot("/foo/0/bar"), "foo.0.bar");
        assert_eq!(json_pointer_to_dot("/items/0/name"), "items.0.name");
    }

    #[test]
    fn test_json_pointer_to_dot_edge_cases() {
        assert_eq!(json_pointer_to_dot(""), "$");
        assert_eq!(json_pointer_to_dot("/name"), "name");
        assert_eq!(
            json_pointer_to_dot("/user/profile/name"),
            "user.profile.name"
        );
        assert_eq!(json_pointer_to_dot("/items/0"), "items.0");
        assert_eq!(json_pointer_to_dot("/items/0/name"), "items.0.name");
        assert_eq!(
            json_pointer_to_dot("/users/0/posts/5/title"),
            "users.0.posts.5.title"
        );
    }

    #[test]
    fn test_json_pointer_escaped_tokens() {
        assert_eq!(json_pointer_to_dot("/foo~1bar"), "foo/bar");
        assert_eq!(json_pointer_to_dot("/foo~0bar"), "foo~bar");
    }

    // ─── String ────────────────────────────────────────────────────────────

    #[test]
    fn test_string_validation() {
        let id = compile(r#"{"type":"string","minLength":3}"#);

        let r = validate(id, r#""hello""#);
        assert!(r.valid);

        let r = validate(id, r#""hi""#);
        assert!(!r.valid);
        assert_eq!(r.errors.len(), 1);

        crate::free_schema(id);
    }

    #[test]
    fn test_string_max_length() {
        let id = compile(r#"{"type":"string","maxLength":5}"#);

        assert!(validate(id, r#""hi""#).valid);
        assert!(validate(id, r#""hello""#).valid);
        assert!(!validate(id, r#""toolong""#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_string_pattern() {
        let id = compile(r#"{"type":"string","pattern":"^\\d+$"}"#);

        assert!(validate(id, r#""123""#).valid);
        assert!(!validate(id, r#""abc""#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_string_format_email() {
        let id = compile(r#"{"type":"string","format":"email"}"#);

        assert!(validate(id, r#""user@example.com""#).valid);
        assert!(!validate(id, r#""not-an-email""#).valid);

        crate::free_schema(id);
    }

    // ─── Number / Integer ──────────────────────────────────────────────────

    #[test]
    fn test_number_validation() {
        let id = compile(r#"{"type":"number","minimum":0,"maximum":100}"#);

        assert!(validate(id, "50").valid);
        assert!(validate(id, "0").valid);
        assert!(validate(id, "100").valid);
        assert!(!validate(id, "-1").valid);
        assert!(!validate(id, "101").valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_integer_validation() {
        let id = compile(r#"{"type":"integer"}"#);

        assert!(validate(id, "7").valid);
        assert!(!validate(id, "3.14").valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_number_exclusive_bounds() {
        let id = compile(r#"{"type":"number","exclusiveMinimum":0,"exclusiveMaximum":10}"#);

        assert!(validate(id, "5").valid);
        assert!(!validate(id, "0").valid);
        assert!(!validate(id, "10").valid);

        crate::free_schema(id);
    }

    // ─── Boolean / Null ────────────────────────────────────────────────────

    #[test]
    fn test_boolean_validation() {
        let id = compile(r#"{"type":"boolean"}"#);

        assert!(validate(id, "true").valid);
        assert!(validate(id, "false").valid);
        assert!(!validate(id, r#""yes""#).valid);
        assert!(!validate(id, "0").valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_null_validation() {
        let id = compile(r#"{"type":"null"}"#);

        assert!(validate(id, "null").valid);
        assert!(!validate(id, "0").valid);
        assert!(!validate(id, r#""null""#).valid);

        crate::free_schema(id);
    }

    // ─── Object ────────────────────────────────────────────────────────────

    #[test]
    fn test_object_validation() {
        let id = compile(
            r#"{
            "type":"object",
            "properties":{
                "name":{"type":"string","minLength":1},
                "age":{"type":"number","minimum":0}
            },
            "required":["name","age"],
            "additionalProperties":false
        }"#,
        );

        assert!(validate(id, r#"{"name":"Alice","age":30}"#).valid);
        assert!(!validate(id, r#"{"name":"","age":-1}"#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_required_properties() {
        let id = compile(
            r#"{
            "type":"object",
            "required":["name","age"],
            "properties":{
                "name":{"type":"string"},
                "age":{"type":"number"}
            }
        }"#,
        );

        let r = validate(id, r#"{"name":"Alice"}"#);
        assert!(!r.valid);
        assert!(!r.errors.is_empty());

        crate::free_schema(id);
    }

    #[test]
    fn test_additional_properties_rejected() {
        let id = compile(
            r#"{
            "type":"object",
            "properties":{"name":{"type":"string"}},
            "additionalProperties":false
        }"#,
        );

        let r = validate(id, r#"{"name":"Alice","extra":123}"#);
        assert!(!r.valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_optional_properties() {
        let id = compile(
            r#"{
            "type":"object",
            "properties":{
                "name":{"type":"string"},
                "nickname":{"type":"string"}
            },
            "required":["name"]
        }"#,
        );

        assert!(validate(id, r#"{"name":"Alice"}"#).valid);
        assert!(validate(id, r#"{"name":"Alice","nickname":"Ally"}"#).valid);
        assert!(!validate(id, "{}").valid);

        crate::free_schema(id);
    }

    // ─── Array ─────────────────────────────────────────────────────────────

    #[test]
    fn test_array_validation() {
        let id = compile(
            r#"{
            "type":"array",
            "items":{"type":"string"},
            "minItems":1,
            "maxItems":3
        }"#,
        );

        assert!(validate(id, r#"["a","b"]"#).valid);
        assert!(!validate(id, r#"["a","b",1]"#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_array_boundaries() {
        let id = compile(
            r#"{
            "type":"array",
            "items":{"type":"string"},
            "minItems":1,
            "maxItems":3
        }"#,
        );

        assert!(!validate(id, "[]").valid);
        assert!(!validate(id, r#"["a","b","c","d"]"#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_array_unique_items() {
        let id = compile(r#"{"type":"array","items":{"type":"number"},"uniqueItems":true}"#);

        assert!(validate(id, "[1,2,3]").valid);
        assert!(!validate(id, "[1,2,1]").valid);

        crate::free_schema(id);
    }

    // ─── Record ────────────────────────────────────────────────────────────

    #[test]
    fn test_record_validation() {
        let id = compile(r#"{"type":"object","additionalProperties":{"type":"number"}}"#);

        assert!(validate(id, r#"{"a":1,"b":2}"#).valid);
        assert!(!validate(id, r#"{"a":"not-a-number"}"#).valid);

        crate::free_schema(id);
    }

    // ─── Literal / Enum ────────────────────────────────────────────────────

    #[test]
    fn test_literal_validation() {
        let id = compile(r#"{"const":"hello"}"#);

        assert!(validate(id, r#""hello""#).valid);
        assert!(!validate(id, r#""world""#).valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_enum_validation() {
        let id = compile(r#"{"enum":["draft","published","archived"]}"#);

        assert!(validate(id, r#""draft""#).valid);
        assert!(!validate(id, r#""deleted""#).valid);

        crate::free_schema(id);
    }

    // ─── Union / Nullable ──────────────────────────────────────────────────

    #[test]
    fn test_nullable_string() {
        let id = compile(r#"{"anyOf":[{"type":"string"},{"type":"null"}]}"#);

        assert!(validate(id, r#""hello""#).valid);
        assert!(validate(id, "null").valid);
        assert!(!validate(id, "42").valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_union_string_number() {
        let id = compile(r#"{"anyOf":[{"type":"string"},{"type":"number"}]}"#);

        assert!(validate(id, r#""hello""#).valid);
        assert!(validate(id, "42").valid);
        assert!(!validate(id, "true").valid);

        crate::free_schema(id);
    }

    #[test]
    fn test_one_of_union() {
        let id = compile(r#"{"oneOf":[{"type":"string"},{"type":"number"}]}"#);

        assert!(validate(id, r#""abc""#).valid);
        assert!(!validate(id, "true").valid);

        crate::free_schema(id);
    }

    // ─── Nested / complex ──────────────────────────────────────────────────

    #[test]
    fn test_nested_error_paths() {
        let id = compile(
            r#"{
            "type":"object",
            "properties":{
                "user":{
                    "type":"object",
                    "properties":{
                        "email":{"type":"string","format":"email"}
                    },
                    "required":["email"]
                }
            }
        }"#,
        );

        let r = validate(id, r#"{"user":{"email":"invalid"}}"#);
        assert!(!r.valid);
        assert!(r.errors.iter().any(|e| e.path.contains("user.email")));

        crate::free_schema(id);
    }

    #[test]
    fn test_complex_nested_schema() {
        let id = compile(
            r#"{
            "type":"object",
            "properties":{
                "name":{"type":"string"},
                "tags":{"type":"array","items":{"type":"string"}},
                "metadata":{"type":"object","additionalProperties":{"type":"number"}}
            },
            "required":["name"]
        }"#,
        );

        assert!(validate(id, r#"{"name":"test","tags":["a","b"],"metadata":{"x":1}}"#).valid);
        assert!(validate(id, r#"{"name":"test"}"#).valid);
        assert!(!validate(id, "{}").valid);
        assert!(!validate(id, r#"{"name":"test","tags":[1]}"#).valid);

        crate::free_schema(id);
    }

    // ─── Error paths ───────────────────────────────────────────────────────

    #[test]
    fn test_wrong_root_type() {
        let id = compile(r#"{"type":"string"}"#);

        let r = validate(id, "123");
        assert!(!r.valid);
        assert_eq!(r.errors.len(), 1);

        crate::free_schema(id);
    }

    // ─── Compile errors ────────────────────────────────────────────────────

    #[test]
    fn test_compile_invalid_json() {
        let r = compile_fail(r#"{"type":"object""#);
        assert!(!r.valid);
        assert!(r.errors[0].message.contains("Invalid JSON Schema"));
    }

    #[test]
    fn test_compile_invalid_schema_type() {
        let r = compile_fail(r#"{"type":"object","properties":"not-an-object"}"#);
        assert!(!r.valid);
    }

    // ─── Null pointer handling ─────────────────────────────────────────────

    #[test]
    fn test_compile_null_pointer() {
        let id = { crate::compile_schema(std::ptr::null()) };
        assert_eq!(id, 0);
    }

    #[test]
    fn test_validate_null_pointer() {
        let id = compile(r#"{"type":"string"}"#);

        {
            crate::validate(id, std::ptr::null())
        };
        let ptr = crate::get_last_result();
        let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap();
        let r: ValidationResult = serde_json::from_str(json).unwrap();
        crate::free_last_result();

        assert!(!r.valid);
        assert!(r.errors[0].message.contains("null"));

        crate::free_schema(id);
    }

    // ─── Free / not found ──────────────────────────────────────────────────

    #[test]
    fn test_validate_freed_schema() {
        let id = compile(r#"{"type":"string"}"#);
        crate::free_schema(id);

        let c_data = CString::new(r#""hello""#).unwrap();
        {
            crate::validate(id, c_data.as_ptr())
        };
        let ptr = crate::get_last_result();
        let json = unsafe { CStr::from_ptr(ptr) }.to_str().unwrap();
        let r: ValidationResult = serde_json::from_str(json).unwrap();
        crate::free_last_result();

        assert!(!r.valid);
        assert!(r.errors[0].message.contains("not found"));
    }

    // ─── get_last_result without prior call ────────────────────────────────

    #[test]
    fn test_get_last_result_empty() {
        crate::free_last_result();
        let ptr = crate::get_last_result();
        assert!(ptr.is_null());
    }

    // ─── Multiple schemas ──────────────────────────────────────────────────

    #[test]
    fn test_multiple_schemas_independent() {
        let id_str = compile(r#"{"type":"string"}"#);
        let id_num = compile(r#"{"type":"number"}"#);
        let id_arr = compile(r#"{"type":"array","items":{"type":"string"}}"#);

        assert!(validate(id_str, r#""hello""#).valid);
        assert!(!validate(id_str, "42").valid);

        assert!(validate(id_num, "42").valid);
        assert!(!validate(id_num, r#""hello""#).valid);

        assert!(validate(id_arr, r#"["a","b"]"#).valid);
        assert!(!validate(id_arr, r#""hello""#).valid);

        crate::free_schema(id_str);
        crate::free_schema(id_num);
        crate::free_schema(id_arr);
    }

    // ─── Any / empty schema ────────────────────────────────────────────────

    #[test]
    fn test_any_accepts_everything() {
        let id = compile("{}");

        assert!(validate(id, r#""string""#).valid);
        assert!(validate(id, "42").valid);
        assert!(validate(id, "true").valid);
        assert!(validate(id, "null").valid);
        assert!(validate(id, "[1,2,3]").valid);
        assert!(validate(id, r#"{"key":"value"}"#).valid);

        crate::free_schema(id);
    }

    // ─── Never / not schema ────────────────────────────────────────────────

    #[test]
    fn test_never_rejects_everything() {
        let id = compile(r#"{"not":{}}"#);

        assert!(!validate(id, r#""string""#).valid);
        assert!(!validate(id, "42").valid);
        assert!(!validate(id, "null").valid);

        crate::free_schema(id);
    }
}
