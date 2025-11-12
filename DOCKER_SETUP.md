# Docker Setup Guide - Dental Booking System

## Prerequisites

- Docker & Docker Compose installed
- Supabase account with project setup
- OpenAI API key

## Quick Start

### 1. Setup Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-your-openai-api-key
```

Also create backend `.env`:

```bash
cp dental-booking/backend/.env.example dental-booking/backend/.env
# Edit with same credentials
```

### 2. Build and Run with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Services

- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

### 4. Stop Services

```bash
docker-compose down
```

## Development Mode

### Run Backend Only

```bash
docker-compose up backend
```

### Run Dashboard Only (Local Development)

```bash
cd dental-booking/dashboard
npm install
npm run dev
```

Dashboard will run on http://localhost:3001

## Project Structure

```
.
├── docker-compose.yml           # Main compose file
└── dental-booking/
    ├── backend/
    │   ├── Dockerfile          # Backend container
    │   ├── .env                # Backend env vars
    │   └── app/                # FastAPI application
    ├── dashboard/
    │   ├── Dockerfile          # Dashboard container
    │   ├── .env.local          # Dashboard env vars
    │   └── app/                # Next.js application
    └── whatsapp-gateway/
        ├── Dockerfile          # WhatsApp container
        └── index.js            # Baileys integration
```

## Services

### Backend (FastAPI)
- **Port**: 8001 (host) → 8000 (container)
- **Health Check**: Automatic with retry
- **Dependencies**: Python 3.11, FastAPI, OpenAI, Supabase

### Dashboard (Next.js 15)
- **Port**: 3001
- **Stack**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Features**:
  - Overview dashboard with stats
  - Bookings management
  - Services listing
  - Conversations tracking

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8001
lsof -i :3001

# Stop the service or change port in docker-compose.yml
```

### Database Connection Error

- Verify Supabase credentials in `.env`
- Check if you ran the seed.sql script
- Ensure Supabase project is active

### Dashboard Can't Connect to Backend

- Check backend is running: `docker-compose ps`
- Verify NEXT_PUBLIC_API_URL in dashboard/.env.local
- For local dev: use `http://localhost:8001`
- For Docker: services use internal DNS names

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build dashboard

# Restart services
docker-compose up -d
```

## Production Deployment

For production, update:

1. Remove `depends_on` for better orchestration
2. Add proper health checks
3. Use environment-specific .env files
4. Set up reverse proxy (Nginx/Traefik)
5. Enable HTTPS
6. Configure CORS properly
7. Add rate limiting

Example production docker-compose snippet:

```yaml
services:
  backend:
    restart: always
    environment:
      - ENVIRONMENT=production
    # ... other configs
```

## Useful Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs dashboard

# Execute command in container
docker-compose exec backend python -m pytest
docker-compose exec dashboard npm run lint

# Clean up everything
docker-compose down -v
docker system prune -a
```

## Next Steps

1. Setup database with seed.sql
2. Test API endpoints
3. Customize dashboard
4. Add authentication
5. Configure production environment
