//! Database service layer
//!
//! This crate provides a clean architecture service layer with dependency injection
//! for all database operations using SeaORM v2.

pub mod error;
pub mod manager;
pub mod migration;
pub mod services;
pub mod types;

// Re-export commonly used types
pub use error::{ServiceError, ServiceResult};
pub use manager::ServiceManager;
pub use migration::run_migrations;

// Re-export entity types for convenience
pub use db_entity::entities;
