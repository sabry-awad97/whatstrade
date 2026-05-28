//! Database entity definitions for WhatsTrade
//!
//! This crate contains SeaORM v2 entity definitions converted from Prisma schema.
//! Each entity is organized in its own module with:
//! - `mod.rs`: SeaORM entity definition with relations
//! - `dto.rs`: Data Transfer Object with TypedBuilder and Getters

pub mod entities;

// Re-export all entities for convenient access
pub use entities::*;
