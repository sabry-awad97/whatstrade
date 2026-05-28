use derive_getters::Getters;
use typed_builder::TypedBuilder;

/// Application state container
#[derive(TypedBuilder, Getters)]
pub struct AppState {
    #[builder(setter(into))]
    service_manager: db_service::ServiceManager,
}
