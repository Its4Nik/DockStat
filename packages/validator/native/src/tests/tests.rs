#[cfg(test)]
mod tests {
    use std::ffi::{CStr, CString};
    use std::os::raw::c_char;

    use crate::ffi;
    use crate::schema::SchemaStore;
    use crate::validation::types::ValidationResult;

    use ffi::helpers::json_pointer_to_dot;

    #[test]
    fn test_json_pointer_to_dot() {
        assert_eq!(json_pointer_to_dot(""), "$");
        assert_eq!(json_pointer_to_dot("/foo"), "foo");
        assert_eq!(json_pointer_to_dot("/foo/0/bar"), "foo.0.bar");
        assert_eq!(json_pointer_to_dot("/items/0/name"), "items.0.name");
    }

    #[test]
    fn test_basic_validation() {
        let schema = r#"{"type":"string","minLength":3}"#;
        let mut store = SchemaStore::new();
        let mut last: Option<*mut c_char> = None;

        let id = store.compile(schema, &mut last);
        assert_ne!(id, 0);
        assert!(last.is_none()); // no error

        // Valid
        store.validate(id, r#""hello""#, &mut last);
        let result_ptr = last.unwrap();
        let result_str = unsafe { CStr::from_ptr(result_ptr).to_str().unwrap() };
        let result: ValidationResult = serde_json::from_str(result_str).unwrap();
        assert!(result.valid);
        assert!(result.errors.is_empty());
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        // Invalid
        store.validate(id, r#""hi""#, &mut last);
        let result_ptr = last.unwrap();
        let result_str = unsafe { CStr::from_ptr(result_ptr).to_str().unwrap() };
        let result: ValidationResult = serde_json::from_str(result_str).unwrap();
        assert!(!result.valid);
        assert_eq!(result.errors.len(), 1);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.remove(id);
    }

    #[test]
    fn test_object_validation() {
        let schema = r#"{
            "type":"object",
            "properties":{
                "name":{"type":"string","minLength":1},
                "age":{"type":"number","minimum":0}
            },
            "required":["name","age"],
            "additionalProperties":false
        }"#;
        let mut store = SchemaStore::new();
        let mut last: Option<*mut c_char> = None;

        let id = store.compile(schema, &mut last);
        assert_ne!(id, 0);

        store.validate(id, r#"{"name":"Alice","age":30}"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#"{"name":"","age":-1}"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(!result.valid);
        // Should have 2 errors: name too short, age below minimum
        assert!(result.errors.len() >= 1);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.remove(id);
    }

    #[test]
    fn test_array_validation() {
        let schema = r#"{
            "type":"array",
            "items":{"type":"string"},
            "minItems":1,
            "maxItems":3
        }"#;
        let mut store = SchemaStore::new();
        let mut last: Option<*mut c_char> = None;

        let id = store.compile(schema, &mut last);
        assert_ne!(id, 0);

        store.validate(id, r#"["a","b"]"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#"["a","b",1]"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(!result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.remove(id);
    }

    #[test]
    fn test_format_email() {
        let schema = r#"{"type":"string","format":"email"}"#;
        let mut store = SchemaStore::new();
        let mut last: Option<*mut c_char> = None;

        let id = store.compile(schema, &mut last);
        assert_ne!(id, 0);

        store.validate(id, r#""user@example.com""#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#""not-an-email""#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(!result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.remove(id);
    }

    #[test]
    fn test_record_validation() {
        let schema = r#"{
            "type":"object",
            "additionalProperties":{"type":"number"}
        }"#;
        let mut store = SchemaStore::new();
        let mut last: Option<*mut c_char> = None;

        let id = store.compile(schema, &mut last);
        assert_ne!(id, 0);

        store.validate(id, r#"{"a":1,"b":2}"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#"{"a":"not-a-number"}"#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(!result.valid);
        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.remove(id);
    }

    #[test]
    fn test_json_pointer_to_dot_edge_cases() {
        assert_eq!(json_pointer_to_dot(""), "$");

        // root-level fields
        assert_eq!(json_pointer_to_dot("/name"), "name");

        // nested
        assert_eq!(
            json_pointer_to_dot("/user/profile/name"),
            "user.profile.name"
        );

        // arrays
        assert_eq!(json_pointer_to_dot("/items/0"), "items.0");
        assert_eq!(json_pointer_to_dot("/items/0/name"), "items.0.name");

        // consecutive numeric indexes
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

    #[test]
    fn test_compile_invalid_schema() {
        let schema = r#"{
            "type":"object",
            "properties":"not-an-object"
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        assert_eq!(id, 0);
        assert!(last.is_some());
    }

    #[test]
    fn test_compile_invalid_json() {
        let schema = r#"{"type":"object""#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        assert_eq!(id, 0);
        assert!(last.is_some());
    }

    #[test]
    fn test_wrong_root_type() {
        let schema = r#"{"type":"string"}"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, "123", &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
        assert_eq!(result.errors.len(), 1);
    }

    #[test]
    fn test_required_properties() {
        let schema = r#"{
            "type":"object",
            "required":["name","age"],
            "properties":{
                "name":{"type":"string"},
                "age":{"type":"number"}
            }
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#"{"name":"Alice"}"#, &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
        assert!(!result.errors.is_empty());

        println!("{:#?}", result.errors);
    }

    #[test]
    fn test_additional_properties_rejected() {
        let schema = r#"{
            "type":"object",
            "properties":{
                "name":{"type":"string"}
            },
            "additionalProperties":false
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#"{"name":"Alice","extra":123}"#, &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
    }

    #[test]
    fn test_nullable_string() {
        let schema = r#"{
            "anyOf":[
                {"type":"string"},
                {"type":"null"}
            ]
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#""hello""#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();
        assert!(result.valid);

        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, "null", &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(result.valid);
    }

    #[test]
    fn test_one_of_union() {
        let schema = r#"{
            "oneOf":[
                {"type":"string"},
                {"type":"number"}
            ]
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#""abc""#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(result.valid);

        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, "true", &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
    }

    #[test]
    fn test_enum_validation() {
        let schema = r#"{
            "enum":["draft","published","archived"]
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#""draft""#, &mut last);
        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(result.valid);

        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#""deleted""#, &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
    }

    #[test]
    fn test_nested_error_paths() {
        let schema = r#"{
            "type":"object",
            "properties":{
                "user":{
                    "type":"object",
                    "properties":{
                        "email":{
                            "type":"string",
                            "format":"email"
                        }
                    },
                    "required":["email"]
                }
            }
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, r#"{"user":{"email":"invalid"}}"#, &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);

        assert!(result.errors.iter().any(|e| e.path.contains("user.email")));
    }

    #[test]
    fn test_array_boundaries() {
        let schema = r#"{
            "type":"array",
            "items":{"type":"string"},
            "minItems":1,
            "maxItems":3
        }"#;

        let mut store = SchemaStore::new();
        let mut last = None;

        let id = store.compile(schema, &mut last);

        store.validate(id, "[]", &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);

        unsafe {
            let _ = CString::from_raw(last.take().unwrap());
        }

        store.validate(id, r#"["a","b","c","d"]"#, &mut last);

        let result: ValidationResult =
            serde_json::from_str(unsafe { CStr::from_ptr(last.unwrap()).to_str().unwrap() })
                .unwrap();

        assert!(!result.valid);
    }
}
