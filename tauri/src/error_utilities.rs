use git2::Error;
use serde_json::Error as SerdeJsonError;
use tauri::ipc::InvokeError;
use thiserror;
pub fn gitErrorMapper(err: git2::Error) -> InvokeError {
    return InvokeError::from_error(err);
}
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("JSON error: {0}")]
    JsonError(#[from] SerdeJsonError),

    #[error("Invoke error: {0}")]
    InvokeError(String),

    #[error("Git error: {0}")]
    GitError(#[from] git2::Error),

    #[error("STD error: {0}")]
    StdError(#[from] std::io::Error),

    #[error("Other error: {0}")]
    Error(String),
}
