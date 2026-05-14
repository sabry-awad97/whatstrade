-- ═══════════════════════════════════════════════════════════════════════════════
--  PostgreSQL Extensions Initialization
-- ═══════════════════════════════════════════════════════════════════════════════
--  This script runs automatically on first database creation
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable btree_gin for composite indexes
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable pgvector for vector similarity search (AI/ML features)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable pg_textsearch for advanced full-text search
CREATE EXTENSION IF NOT EXISTS "pg_textsearch";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL extensions initialized successfully';
    RAISE NOTICE '  - pgvector: enabled for AI/ML vector operations';
    RAISE NOTICE '  - pg_textsearch: enabled for advanced full-text search';
END $$;
