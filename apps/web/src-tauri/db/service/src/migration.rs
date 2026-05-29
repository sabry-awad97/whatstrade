//! Database migration utilities

use sea_orm::{DatabaseConnection, DbErr};
use tracing::info;

/// Run database migrations using SeaORM schema sync
///
/// This function synchronizes the database schema with the entity definitions.
/// It's suitable for development and testing environments.
///
/// **Performance Note**: Schema sync performs introspection queries on all tables,
/// which can be slow (1-2s per table). For production, consider using proper
/// migration tools like `sea-orm-migration` or disabling this entirely.
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
    // Skip migrations in production or when SKIP_MIGRATIONS env var is set
    if std::env::var("SKIP_MIGRATIONS").is_ok() {
        info!("Skipping database migrations (SKIP_MIGRATIONS is set)");
        return Ok(());
    }

    // In release builds, skip schema sync by default unless FORCE_MIGRATIONS is set
    #[cfg(not(debug_assertions))]
    {
        if std::env::var("FORCE_MIGRATIONS").is_err() {
            info!("Skipping schema sync in release mode (set FORCE_MIGRATIONS=1 to enable)");
            return Ok(());
        }
    }

    let start = std::time::Instant::now();
    info!("Running database migrations...");

    // Sync schema for all entities in db_entity crate
    // Note: This performs introspection queries which can be slow
    db.get_schema_registry("db_entity::*").sync(db).await?;

    let duration = start.elapsed();
    info!(
        "Database migrations completed successfully in {:.2}s",
        duration.as_secs_f64()
    );
    Ok(())
}
