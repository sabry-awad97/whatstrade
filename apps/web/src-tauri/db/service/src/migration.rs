//! Database migration utilities

use sea_orm::{DatabaseConnection, DbErr};
use tracing::info;

/// Run database migrations using SeaORM schema sync
///
/// This function synchronizes the database schema with the entity definitions.
/// It's suitable for development and testing environments.
///
/// # Arguments
///
/// * `db` - Database connection reference
///
/// # Returns
///
/// * `Ok(())` if migrations succeed
/// * `Err(DbErr)` if migrations fail
///
/// # Example
///
/// ```rust,no_run
/// use sea_orm::Database;
/// use db_service::run_migrations;
///
/// # async fn example() -> Result<(), sea_orm::DbErr> {
/// let db = Database::connect("postgresql://localhost/mydb").await?;
/// run_migrations(&db).await?;
/// # Ok(())
/// # }
/// ```
pub async fn run_migrations(db: &DatabaseConnection) -> Result<(), DbErr> {
    info!("Running database migrations...");

    // Sync schema for all entities in db_entity crate
    db.get_schema_registry("db_entity::*").sync(db).await?;

    info!("Database migrations completed successfully");
    Ok(())
}
