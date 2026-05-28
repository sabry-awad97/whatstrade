//! Entity modules
//!
//! Each module contains:
//! - Entity definition (mod.rs)
//! - DTO definition (dto.rs)

pub mod account;
pub mod audit_log;
pub mod group;
pub mod r#match;
pub mod matching_weights;
pub mod offer;
pub mod request;
pub mod review_item;
pub mod session;
pub mod user;
pub mod verification;
pub mod whatsapp_message_queue;
pub mod whatsapp_session;

// Re-export entities
pub use account::Entity as Account;
pub use audit_log::Entity as AuditLog;
pub use group::Entity as Group;
pub use r#match::Entity as Match;
pub use matching_weights::Entity as MatchingWeights;
pub use offer::Entity as Offer;
pub use request::Entity as Request;
pub use review_item::Entity as ReviewItem;
pub use session::Entity as Session;
pub use user::Entity as User;
pub use verification::Entity as Verification;
pub use whatsapp_message_queue::Entity as WhatsAppMessageQueue;
pub use whatsapp_session::Entity as WhatsAppSession;
