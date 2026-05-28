use utilities::Id;
use derive_getters::Getters;
use serde::Serialize;

use crate::error::AppResult;

/// Result of a mutation operation (create, update, delete)
#[derive(Serialize, Clone, Debug, Getters)]
pub struct MutationResponse {
    id: Id,
}

impl From<Id> for MutationResponse {
    fn from(id: Id) -> Self {
        Self { id }
    }
}

/// Represents an error message for IPC communication.
#[derive(Serialize)]
struct IpcError {
    message: String,
}

/// Represents a result for IPC communication, containing data.
#[derive(Serialize)]
pub struct IpcResult<D>
where
    D: Serialize,
{
    pub data: D,
}

/// Represents an IPC response, which may contain either an error or a simple result.
#[derive(Serialize)]
pub struct IpcResponse<D>
where
    D: Serialize,
{
    error: Option<IpcError>,
    result: Option<IpcResult<D>>,
}

impl<D> From<AppResult<D>> for IpcResponse<D>
where
    D: Serialize,
{
    /// Converts an `AppResult<D>` into an `IpcResponse<D>`.
    ///
    /// If the result is `Ok`, constructs an `IpcResponse` with `result` containing the data.
    /// If the result is `Err`, constructs an `IpcResponse` with `error` containing the error message.
    fn from(res: AppResult<D>) -> Self {
        match res {
            Ok(data) => IpcResponse {
                error: None,
                result: Some(IpcResult { data }),
            },
            Err(err) => IpcResponse {
                error: Some(IpcError {
                    message: format!("{}", err),
                }),
                result: None,
            },
        }
    }
}
