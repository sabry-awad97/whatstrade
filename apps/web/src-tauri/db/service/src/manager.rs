//! Service manager for dependency injection

use crate::{
    run_migrations,
    services::{
        AuditService, AuthService, GroupService, JwtService, MatchingService, OfferService,
        RequestService, ReviewService, SimulateService, StatsService, UserService, WeightsService,
        WhatsAppService,
    },
};
use derive_getters::Getters;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::sync::Arc;
use typed_builder::TypedBuilder;

/// Configuration for ServiceManager initialization
#[derive(Clone, TypedBuilder, Getters)]
pub struct ServiceManagerConfig {
    /// Database connection URL
    #[builder(setter(into))]
    database_url: String,

    /// JWT secret for token signing
    #[builder(setter(into))]
    jwt_secret: String,

    /// Access token expiry in hours (default: 1)
    #[builder(default = 1)]
    access_token_expiry_hours: i64,

    /// Refresh token expiry in days (default: 30)
    #[builder(default = 30)]
    refresh_token_expiry_days: i64,

    /// Maximum database connections (default: 100)
    #[builder(default = 100)]
    max_connections: u32,

    /// Minimum database connections (default: 5)
    #[builder(default = 5)]
    min_connections: u32,

    /// Connection timeout in seconds (default: 30)
    #[builder(default = 30)]
    connect_timeout_secs: u64,

    /// Idle timeout in seconds (default: 600)
    #[builder(default = 600)]
    idle_timeout_secs: u64,

    /// Enable SQLx logging (default: true)
    #[builder(default = true)]
    sqlx_logging: bool,

    /// Go WhatsApp service URL
    #[builder(default, setter(into))]
    go_whatsapp_service_url: Option<String>,
}

/// Service manager containing all application services
///
/// This struct holds Arc-wrapped references to all services, enabling
/// dependency injection throughout the application. Services are constructed
/// with their dependencies and shared via Arc for thread-safe access.
///
/// # Example
///
/// ```rust,no_run
/// use db_service::{ServiceManager, ServiceManagerConfig};
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let config = ServiceManagerConfig::builder()
///     .database_url("postgresql://localhost/mydb")
///     .jwt_secret("your-secret-key")
///     .build();
///
/// let manager = ServiceManager::new(config).await?;
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

    /// Group service for managing WhatsApp groups
    #[builder(setter(into))]
    group_service: Arc<GroupService>,

    /// Weights service for matching algorithm weights
    #[builder(setter(into))]
    weights_service: Arc<WeightsService>,

    /// Review service for review queue management
    #[builder(setter(into))]
    review_service: Arc<ReviewService>,

    /// Stats service for dashboard statistics
    #[builder(setter(into))]
    stats_service: Arc<StatsService>,

    /// Simulate service for message simulation
    #[builder(setter(into))]
    simulate_service: Arc<SimulateService>,

    /// WhatsApp service for WhatsApp integration
    #[builder(setter(into))]
    whatsapp_service: Arc<WhatsAppService>,
}

impl ServiceManager {
    /// Create a new service manager with configuration
    ///
    /// This method constructs all services with their dependencies properly wired
    /// and connects to the database using the provided configuration.
    ///
    /// # Arguments
    ///
    /// * `config` - ServiceManager configuration
    ///
    /// # Returns
    ///
    /// A fully configured ServiceManager with all services initialized
    ///
    /// # Example
    ///
    /// ```rust,no_run
    /// use db_service::{ServiceManager, ServiceManagerConfig};
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let config = ServiceManagerConfig::builder()
    ///     .database_url("postgresql://localhost/mydb")
    ///     .jwt_secret("your-secret-key")
    ///     .access_token_expiry_hours(2)
    ///     .refresh_token_expiry_days(7)
    ///     .build();
    ///
    /// let manager = ServiceManager::new(config).await?;
    ///
    /// // Use services
    /// let users = manager.user_service().list(0, 10).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn new(config: ServiceManagerConfig) -> Result<Self, sea_orm::DbErr> {
        // Build database connection options from config
        let mut opt = ConnectOptions::new(config.database_url.clone());
        opt.max_connections(*config.max_connections())
            .min_connections(*config.min_connections())
            .connect_timeout(std::time::Duration::from_secs(
                *config.connect_timeout_secs(),
            ))
            .idle_timeout(std::time::Duration::from_secs(*config.idle_timeout_secs()))
            .sqlx_logging(*config.sqlx_logging());

        // Connect to database
        let db = Arc::new(Database::connect(opt).await?);

        // Run migrations with error handling
        match run_migrations(&db).await {
            Ok(_) => {
                tracing::info!("Migrations completed successfully");
            }
            Err(e) => {
                tracing::warn!(
                    "Migration error (this might be expected if table already exists): {:?}",
                    e
                );
            }
        }

        // Initialize services in dependency order
        let jwt_service = JwtService::arc(
            config.jwt_secret(),
            Some(*config.access_token_expiry_hours()),
            Some(*config.refresh_token_expiry_days()),
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

        // Initialize new services
        let group_service = GroupService::arc(db.clone());
        let weights_service = WeightsService::arc(db.clone());
        let review_service = ReviewService::arc(db.clone(), audit_service.clone());
        let stats_service = StatsService::arc(db.clone());
        let simulate_service =
            SimulateService::arc(db.clone(), offer_service.clone(), request_service.clone());
        let whatsapp_service = WhatsAppService::arc(
            db.clone(),
            config
                .go_whatsapp_service_url()
                .clone()
                .unwrap_or_else(|| "http://localhost:8080".to_string()),
        );

        Ok(Self {
            db,
            jwt_service,
            audit_service,
            user_service,
            auth_service,
            offer_service,
            request_service,
            matching_service,
            group_service,
            weights_service,
            review_service,
            stats_service,
            simulate_service,
            whatsapp_service,
        })
    }
}
