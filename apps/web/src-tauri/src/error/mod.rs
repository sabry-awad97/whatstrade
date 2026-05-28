//! Application error types and result handling

/// Application-wide error type
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// Database service error
    #[error(transparent)]
    Service(#[from] db_service::ServiceError),
    /// Generic parsing error
    #[error("{0}")]
    ParseError(String),
}

impl From<&str> for AppError {
    fn from(s: &str) -> Self {
        AppError::ParseError(s.to_string())
    }
}

impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError::ParseError(s)
    }
}

/// Application result type alias
pub type AppResult<T> = Result<T, AppError>;
