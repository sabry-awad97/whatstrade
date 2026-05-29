//! Stats service for dashboard statistics

use crate::{
    entities::{group, r#match, offer, request},
    error::{ServiceError, ServiceResult},
};
use chrono::{Datelike, TimeZone};
use rust_decimal::Decimal;
use sea_orm::{DatabaseConnection, entity::*, query::*};
use std::sync::Arc;

/// Service for dashboard statistics
pub struct StatsService {
    db: Arc<DatabaseConnection>,
}

impl StatsService {
    /// Create a new stats service
    ///
    /// # Arguments
    ///
    /// * `db` - Database connection
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create an Arc-wrapped stats service for dependency injection
    pub fn arc(db: Arc<DatabaseConnection>) -> Arc<Self> {
        Arc::new(Self::new(db))
    }

    /// Get dashboard statistics
    ///
    /// # Returns
    ///
    /// * `Ok(DashboardStatsDto)` - Dashboard statistics
    /// * `Err(ServiceError)` - If query fails
    pub async fn get_dashboard_stats(&self) -> ServiceResult<DashboardStatsDto> {
        // Use UTC to ensure consistent "today" boundary
        let now = chrono::Utc::now();
        let today_start = chrono::Utc
            .with_ymd_and_hms(now.year(), now.month(), now.day(), 0, 0, 0)
            .single()
            .ok_or_else(|| ServiceError::internal("Failed to calculate today's start"))?;

        // Run all queries in parallel for better performance
        let (
            total_offers,
            total_requests,
            total_matches,
            pending_matches,
            auto_confirmed,
            active_groups,
            today_offers,
            today_requests,
        ) = tokio::try_join!(
            offer::Entity::find().count(self.db.as_ref()),
            request::Entity::find().count(self.db.as_ref()),
            r#match::Entity::find().count(self.db.as_ref()),
            r#match::Entity::find()
                .filter(r#match::Column::Status.eq(r#match::MatchStatus::Pending))
                .count(self.db.as_ref()),
            r#match::Entity::find()
                .filter(r#match::Column::Status.eq(r#match::MatchStatus::AutoConfirmed))
                .count(self.db.as_ref()),
            group::Entity::find()
                .filter(group::Column::IsMonitored.eq(true))
                .count(self.db.as_ref()),
            offer::Entity::find()
                .filter(offer::Column::CreatedAt.gte(today_start))
                .count(self.db.as_ref()),
            request::Entity::find()
                .filter(request::Column::CreatedAt.gte(today_start))
                .count(self.db.as_ref()),
        )?;

        // Get average match score separately (returns ServiceResult)
        let avg_match_score = Self::get_avg_match_score(&self.db).await?;

        let today_messages = today_offers + today_requests;
        let match_rate = if total_offers > 0 {
            (total_matches as f64 / total_offers as f64) * 100.0
        } else {
            0.0
        };

        Ok(DashboardStatsDto {
            total_offers,
            total_requests,
            total_matches,
            pending_matches,
            auto_confirmed,
            avg_match_score,
            active_groups,
            today_messages,
            match_rate,
        })
    }

    /// Get average match score
    async fn get_avg_match_score(db: &DatabaseConnection) -> ServiceResult<f64> {
        use sea_orm::sea_query::Expr;

        let result = r#match::Entity::find()
            .select_only()
            .column_as(Expr::cust("AVG(score)"), "avg_score")
            .into_tuple::<Option<Decimal>>()
            .one(db)
            .await?;

        match result {
            Some(Some(avg)) => Ok(avg.to_string().parse::<f64>().unwrap_or(0.0)),
            _ => Ok(0.0),
        }
    }
}

/// Dashboard statistics DTO
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DashboardStatsDto {
    pub total_offers: u64,
    pub total_requests: u64,
    pub total_matches: u64,
    pub pending_matches: u64,
    pub auto_confirmed: u64,
    pub avg_match_score: f64,
    pub active_groups: u64,
    pub today_messages: u64,
    pub match_rate: f64,
}
