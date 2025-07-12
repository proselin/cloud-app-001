# PostgreSQL Migration Guide

This project has been migrated from SQLite to PostgreSQL. Follow the steps below to set up your development environment.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed

## Quick Setup

### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL and pgAdmin containers
docker-compose up -d

# Check if containers are running
docker-compose ps
```

### 2. Environment Configuration

The PostgreSQL connection settings are configured in `resources/config/.env.humid`:

```bash
# PostgreSQL Database Configuration
db.host=localhost
db.port=5432
db.username=humid_user
db.password=humid_password
db.database=humid_db
db.ssl=false
```

### 3. Start the Application

```bash
# Build and start the humid service
npm run humid:dev
```

## Database Access

### pgAdmin Web Interface
- URL: http://localhost:5050
- Email: admin@humid.local
- Password: admin123

### Direct PostgreSQL Connection
- Host: localhost
- Port: 5432
- Database: humid_db
- Username: humid_user
- Password: humid_password

## Migration Notes

### Changes Made:

1. **Database Module** (`apps/humid/src/app/config/database/database.module.ts`):
   - Changed from `better-sqlite3` to `postgres`
   - Updated configuration to use PostgreSQL connection parameters
   - Added SSL support option

2. **Environment Configuration** (`apps/humid/src/app/config/env/load-config.ts`):
   - Replaced `db.location` with PostgreSQL connection parameters
   - Added host, port, username, password, database, and SSL options

3. **Dependencies**:
   - Removed: `better-sqlite3`
   - Added: `pg` and `@types/pg`

4. **Docker Setup**:
   - Added `docker-compose.yml` with PostgreSQL and pgAdmin services
   - Added `init.sql` for database initialization

### TypeORM Synchronization

The application uses `synchronize: true` for development, which means:
- Tables will be automatically created from your entities
- Schema changes will be applied automatically
- **WARNING**: Don't use `synchronize: true` in production!

## Production Considerations

For production deployment:

1. Set `synchronize: false` in the database configuration
2. Use TypeORM migrations for schema management
3. Use environment variables for database credentials
4. Enable SSL connections (`db.ssl=true`)
5. Consider using connection pooling

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify environment variables in `.env.humid`

### Port Conflicts
If port 5432 is already in use, update the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use 5433 instead
```
Then update `db.port=5433` in your environment file.

### Data Persistence
Database data is persisted in a Docker volume named `postgres_data`. To reset the database:
```bash
docker-compose down -v  # Removes volumes
docker-compose up -d    # Recreates containers
```
