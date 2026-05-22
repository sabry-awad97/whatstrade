# 🐳 WhatsTrade Docker Configuration

This directory contains Docker configurations for the WhatsTrade application infrastructure.

## 📁 Directory Structure

```
docker/
├── postgres/
│   ├── Dockerfile              # Custom PostgreSQL 18 image with extensions
│   ├── postgresql.conf         # PostgreSQL configuration
│   ├── init/                   # Database initialization scripts
│   │   └── 01-init-extensions.sql
│   └── backups/                # Database backup storage
└── README.md                   # This file
```

## 🚀 Quick Start

### Start All Services

```bash
# Using Task (recommended)
task db:start

# Or using Docker Compose directly
docker compose up -d
```

### Stop All Services

```bash
task db:stop
# or
docker compose stop
```

### View Logs

```bash
task db:logs
# or
docker compose logs -f postgres
```

## 🗄️ PostgreSQL Database

### Features

- **PostgreSQL 18** - Latest stable version
- **pgvector** - Vector similarity search for AI/ML features
- **pg_textsearch** - Advanced full-text search capabilities
- **pg_trgm** - Fuzzy text search
- **uuid-ossp** - UUID generation
- **pgcrypto** - Cryptographic functions

### Connection Details

| Parameter | Value        |
| --------- | ------------ |
| Host      | `localhost`  |
| Port      | `5432`       |
| Database  | `whatstrade` |
| User      | `postgres`   |
| Password  | `password`   |

**Connection String:**

```
postgresql://postgres:password@localhost:5432/whatstrade
```

### Database Management

#### Access PostgreSQL Shell

```bash
task db:shell
# or
docker exec -it whatstrade-postgres psql -U postgres -d whatstrade
```

#### Run Drizzle Studio (GUI)

```bash
task db:studio
# or
bun run --filter @workspace/db db:studio
```

#### Database Migrations

```bash
# Generate migrations
task db:generate

# Push schema changes
task db:push

# Run migrations
task db:migrate
```

## 🔧 Configuration

### PostgreSQL Configuration

The PostgreSQL configuration is located at `docker/postgres/postgresql.conf` and includes:

- **Memory Settings**: Optimized for development workloads
- **Connection Pooling**: Up to 100 concurrent connections
- **Logging**: Slow query logging (>1s)
- **Performance**: Parallel query execution enabled
- **Extensions**: Pre-loaded pg_stat_statements and pg_textsearch

### Custom Extensions

Extensions are automatically installed on first database creation via the init script:

- `uuid-ossp` - UUID generation
- `pgcrypto` - Password hashing
- `pg_stat_statements` - Query performance monitoring
- `pg_trgm` - Fuzzy text search
- `btree_gin` - Composite indexes
- `vector` - Vector similarity search
- `pg_textsearch` - Advanced full-text search

## 📦 Volumes

### Persistent Data

- `whatstrade_postgres_data` - Database data storage
- `./docker/postgres/backups` - Backup storage (bind mount)

### Backup & Restore

#### Create Backup

```bash
docker exec whatstrade-postgres pg_dump -U postgres whatstrade > ./docker/postgres/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore from Backup

```bash
docker exec -i whatstrade-postgres psql -U postgres whatstrade < ./docker/postgres/backups/backup_file.sql
```

## 🔍 Monitoring

### Health Check

```bash
docker compose ps
```

The PostgreSQL container includes a health check that verifies:

- Database is accepting connections
- Database `whatstrade` is accessible

### Query Performance

Access pg_stat_statements for query performance analysis:

```sql
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

## 🧹 Cleanup

### Stop and Remove Containers

```bash
task db:down
# or
docker compose down
```

### Remove All Data (⚠️ Destructive)

```bash
docker compose down -v
```

This will delete all database data permanently.

## 🔐 Security Notes

### Development Environment

The current configuration is optimized for **development** with:

- Simple password authentication
- SSL disabled
- All connections allowed

### Production Recommendations

For production deployment:

1. **Configure environment variables** - Copy `.env.example` to `.env` and set secure values
2. **Change default password** - Set a strong `POSTGRES_PASSWORD` in `.env`
3. **Enable SSL** in `postgresql.conf`
4. **Restrict connections** via `pg_hba.conf`
5. **Use secrets management** (Docker secrets, Vault, etc.)
6. **Enable connection pooling** (PgBouncer)
7. **Set up automated backups**
8. **Configure monitoring** (Prometheus, Grafana)

### Environment Setup

Before running docker-compose, create a `.env` file from the example:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and set your secure values
# At minimum, change POSTGRES_PASSWORD and update DATABASE_URL accordingly
```

**Important:** Never commit `.env` to version control. It's already in `.gitignore`.

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs postgres

# Verify port availability
netstat -an | findstr 5432
```

### Connection Refused

1. Ensure container is running: `docker compose ps`
2. Check health status: `docker compose ps`
3. Verify connection string in `.env` files
4. Check firewall settings

### Extensions Not Loading

```bash
# Verify extensions are installed
docker exec whatstrade-postgres psql -U postgres -d whatstrade -c "\dx"
```

### Reset Database

```bash
task db:reset
```

This will:

1. Stop and remove containers
2. Start fresh containers
3. Push latest schema

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/18/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🤝 Contributing

When modifying Docker configurations:

1. Test changes locally
2. Update this README if needed
3. Document any new environment variables
4. Ensure backward compatibility
