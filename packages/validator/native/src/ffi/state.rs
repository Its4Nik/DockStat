use std::ffi::CString;
use std::sync::{LazyLock, Mutex};

pub static LAST_RESULT: LazyLock<Mutex<Option<CString>>> = LazyLock::new(|| Mutex::new(None));
