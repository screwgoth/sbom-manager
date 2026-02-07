# SBOM Manager - Docker Deployment Guide

## Quick Start (One Command!)

```bash
docker compose up -d
```

Access the application at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Reverse Proxy**: http://localhost:8080

## What's Included

The Docker setup includes:

1. **PostgreSQL Database** (postgres:16-alpine)
   - Persistent data storage
   - Health checks
   - Automatic initialization

2. **Backend API** (Bun + Hono)
   - Auto-migration on startup
   - JWT authentication
   - RESTful API
   - Health monitoring

3. **Frontend** (React + Vite + Nginx)
   - Production build
   - Nginx static serving
   - Optimized assets

4. **Nginx Reverse Proxy** (Optional)
   - Routes /api/* to backend
   - Routes /* to frontend
   - Unified access point

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://sbom_user:sbom_password@postgres:5432/sbom_manager

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Backend
PORT=3000
NODE_ENV=production
```

## Services

### PostgreSQL
- **Port**: 5432
- **User**: sbom_user
- **Password**: sbom_password
- **Database**: sbom_manager
- **Volume**: postgres_data (persistent)

### Backend
- **Port**: 3000
- **Health Check**: http://localhost:3000/api/health
- **Auto Migration**: Runs on startup

### Frontend
- **Port**: 80
- **Nginx**: Static file serving
- **React Router**: SPA routing

### Nginx Proxy
- **Port**: 8080
- **Routes**: /api/* → backend:3000, /* → frontend:80

## Commands

### Start All Services
```bash
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop All Services
```bash
docker compose down
```

### Stop and Remove Data
```bash
docker compose down -v
```

### Rebuild After Code Changes
```bash
docker compose up -d --build
```

### Check Service Health
```bash
docker compose ps
```

## First Time Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd sbom-manager
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your secret key
   ```

3. **Start the stack**
   ```bash
   docker compose up -d
   ```

4. **Wait for services to be healthy** (30-60 seconds)
   ```bash
   docker compose ps
   ```

5. **Create your first user**
   - Open http://localhost
   - Click "Create an account"
   - Register with email/password
   - Start using SBOM Manager!

## Production Deployment

For production, make sure to:

1. **Change JWT_SECRET** to a strong random key
2. **Use HTTPS** with a reverse proxy (Traefik, Caddy, etc.)
3. **Set strong database passwords**
4. **Enable backup** for postgres_data volume
5. **Configure firewall** rules
6. **Set resource limits** in docker-compose.yml
7. **Enable monitoring** (Prometheus, Grafana)

### Example with SSL (Using Caddy)

```yaml
# Add to docker-compose.yml
caddy:
  image: caddy:alpine
  ports:
    - "443:443"
    - "80:80"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
```

```Caddyfile
# Caddyfile
sbom.example.com {
    reverse_proxy nginx:80
}
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Common issue: database not ready
# Solution: Wait 30 seconds and restart
docker compose restart backend
```

### Frontend shows blank page
```bash
# Check if backend is accessible
curl http://localhost:3000/api/health

# Check frontend logs
docker compose logs frontend
```

### Database connection issues
```bash
# Check if postgres is healthy
docker compose ps postgres

# Connect to database
docker compose exec postgres psql -U sbom_user -d sbom_manager
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER .
```

## Development vs Production

### Development (Local)
```bash
# Backend
cd backend
bun install
bun run dev

# Frontend
cd frontend
bun install
bun run dev
```

### Production (Docker)
```bash
docker compose up -d
```

## Data Persistence

All data is stored in Docker volumes:
- `postgres_data`: Database files

To backup:
```bash
# Backup database
docker compose exec postgres pg_dump -U sbom_user sbom_manager > backup.sql

# Restore database
docker compose exec -T postgres psql -U sbom_user sbom_manager < backup.sql
```

## Monitoring

### Check service health
```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend health
curl http://localhost/health
```

### Resource usage
```bash
docker stats
```

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify health: `docker compose ps`
3. Review documentation: README.md
4. Check GitHub issues

## License

MIT License - See LICENSE file
