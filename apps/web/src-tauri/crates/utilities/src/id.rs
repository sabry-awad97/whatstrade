use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// Professional ID type using UUID v7 for time-ordered, globally unique identifiers
///
/// Benefits of UUID v7:
/// - Time-ordered: Better database indexing performance
/// - Globally unique: No coordination needed across systems
/// - Sortable: Natural chronological ordering
/// - 128-bit: Collision-resistant
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, DeriveValueType)]
#[serde(transparent)]
#[sea_orm(column_type = "Uuid")]
pub struct Id(Uuid);

impl Id {
    /// The nil UUID (all zeros)
    pub const NIL: Self = Self(Uuid::nil());

    /// Generate a new UUID v7 ID
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }

    /// Create an ID from an existing UUID
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    /// Parse an ID from a string
    pub fn parse(s: &str) -> Result<Self, uuid::Error> {
        Ok(Self(Uuid::parse_str(s)?))
    }

    /// Get the inner UUID
    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }

    /// Convert to UUID
    pub fn into_uuid(self) -> Uuid {
        self.0
    }

    /// Get the timestamp component of the UUID v7
    /// Returns milliseconds since Unix epoch
    pub fn timestamp(&self) -> Option<u64> {
        // UUID v7 stores timestamp in first 48 bits
        let bytes = self.0.as_bytes();
        let timestamp = u64::from_be_bytes([
            0, 0, bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5],
        ]);
        Some(timestamp)
    }

    /// Check if this ID was created before another ID
    pub fn is_before(&self, other: &Self) -> bool {
        self.0 < other.0
    }

    /// Check if this ID was created after another ID
    pub fn is_after(&self, other: &Self) -> bool {
        self.0 > other.0
    }
}

impl Default for Id {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for Id {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Uuid> for Id {
    fn from(uuid: Uuid) -> Self {
        Self(uuid)
    }
}

impl From<&Id> for Id {
    fn from(id: &Id) -> Self {
        *id
    }
}

impl From<Id> for Uuid {
    fn from(id: Id) -> Self {
        id.0
    }
}

impl From<Id> for String {
    fn from(id: Id) -> Self {
        id.0.to_string()
    }
}

impl std::str::FromStr for Id {
    type Err = uuid::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(Uuid::parse_str(s)?))
    }
}

// Implement TryFromU64 for SeaORM compatibility
impl sea_orm::TryFromU64 for Id {
    fn try_from_u64(_n: u64) -> Result<Self, sea_orm::DbErr> {
        Err(sea_orm::DbErr::ConvertFromU64(
            "Id cannot be converted from u64",
        ))
    }
}
