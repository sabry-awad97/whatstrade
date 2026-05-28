//! Service manager for dependency injection

use crate::services::{
    AuditService, AuthService, JwtService, MatchingService, OfferService, RequestService,
    UserService,
};
use derive_getters::Getters;
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use typed_builder::TypedBuilder;

/// Service manager containing all application services
///
/// This struct holds Arc-wrapped references to all services, enabling
/// dependency injection throughout the application. Services are constructed
/// with their dependencies and shared via Arc for thread-safe access.
///
/// # Example
///
/// ```rust,no_run
/// use sea_orm::Database;
/// use db_service::ServiceManager;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let db = Database::connect("postgresql://localhost/mydb").await?;
/// let db = Arc::new(db);
///
/// let manager = ServiceManager::builder()
///     .db(db.clone())
///     .jwt_secret("your-secret-key")
///     .build();
///
/// // Use services
/// let users = manager.user_service().list(0, 10).await?;
/// # Ok(())
/// # }
/// ```
#[derive(Getters, TypedBuilder)]
pub struct ServiceManager {
    /// Database connection
    #[builder(setter(into))]
    db: Arc<DatabaseConnection>,

    /// JWT service for token generation and validation
    #[builder(setter(into))]
    jwt_service: Arc<JwtService>,

    /// Audit service for logging operations
    #[builder(setter(into))]
    audit_service: Arc<AuditService>,

    /// User service for managing users
    #[builder(setter(into))]
    user_service: Arc<UserService>,

    /// Auth service for authentication
    #[builder(setter(into))]
    auth_service: Arc<AuthService>,

    /// Offer service for managing offers
    #[builder(setter(into))]
    offer_service: Arc<OfferService>,

    /// Request service for managing requests
    #[builder(setter(into))]
    request_service: Arc<RequestService>,

    /// Matching service for creating matches
    #[builder(setter(into))]
    matching_service: Arc<MatchingService>,
}

impl ServiceManager {
    /// Create a new service manager with default configuration
    ///
    /// This is a convenience method that constructs all services with their
    /// dependencies properly wired. For custom configuration, use the builder.
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `jwt_secret` - Secret key for JWT signing
    ///
    /// # Returns
    ///
    /// A fully configured ServiceManager with all services initialized
    ///
    /// # Example
    ///
    /// ```rust,no_run
    /// use sea_orm::Database;
    /// use db_service::ServiceManager;
    /// use std::sync::Arc;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let db = Database::connect("postgresql://localhost/mydb").await?;
    /// let manager = ServiceManager::new(Arc::new(db), "your-secret-key");
    /// # Ok(())
    /// # }
    /// ```
    pub fn new(db: Arc<DatabaseConnection>, jwt_secret: impl AsRef<[u8]>) -> Self {
        // Initialize services in dependency order
        let jwt_service = JwtService::arc(jwt_secret, None, None);
        let audit_service = AuditService::arc(db.clone());
        let user_service = UserService::arc(db.clone(), audit_service.clone());
        let auth_service = AuthService::arc(db.clone(), user_service.clone(), jwt_service.clone());
        let offer_service = OfferService::arc(db.clone(), audit_service.clone());
        let request_service = RequestService::arc(db.clone(), audit_service.clone());
        let matching_service = MatchingService::arc(
            db.clone(),
            audit_service.clone(),
            offer_service.clone(),
            request_service.clone(),
        );

        Self {
            db,
            jwt_service,
            audit_service,
            user_service,
            auth_service,
            offer_service,
            request_service,
            matching_service,
        }
    }

    /// Create a new service manager with custom JWT token expiry
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    /// * `jwt_secret` - Secret key for JWT signing
    /// * `access_token_expiry_hours` - Access token expiry in hours
    /// * `refresh_token_expiry_days` - Refresh token expiry in days
    pub fn with_custom_jwt_expiry(
        db: Arc<DatabaseConnection>,
        jwt_secret: impl AsRef<[u8]>,
        access_token_expiry_hours: i64,
        refresh_token_expiry_days: i64,
    ) -> Self {
        let jwt_service = JwtService::arc(
            jwt_secret,
            Some(access_token_expiry_hours),
            Some(refresh_token_expiry_days),
        );
        let audit_service = AuditService::arc(db.clone());
        let user_service = UserService::arc(db.clone(), audit_service.clone());
        let auth_service = AuthService::arc(db.clone(), user_service.clone(), jwt_service.clone());
        let offer_service = OfferService::arc(db.clone(), audit_service.clone());
        let request_service = RequestService::arc(db.clone(), audit_service.clone());
        let matching_service = MatchingService::arc(
            db.clone(),
            audit_service.clone(),
            offer_service.clone(),
            request_service.clone(),
        );

        Self {
            db,
            jwt_service,
            audit_service,
            user_service,
            auth_service,
            offer_service,
            request_service,
            matching_service,
        }
    }
}
