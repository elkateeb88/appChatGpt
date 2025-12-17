# Development Guide - Dental Booking System

Complete guide for local development with **Hot Reload** support.

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Edit .env with your credentials
nano .env

# 3. Start in development mode with hot reload
docker-compose -f docker-compose.dev.yml up

# 4. Access the services:
# - Dashboard: http://localhost:3001
# - Backend API: http://localhost:8001
# - API Docs: http://localhost:8001/docs
# - WhatsApp Gateway: http://localhost:3002
```

## Development vs Production

### Development Mode (Recommended for development)
```bash
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- ✅ **Hot Reload** - Changes appear instantly
- ✅ No rebuild needed for code changes
- ✅ Source code mounted as volumes
- ✅ Debug mode enabled
- ✅ Detailed logs
- ⚡ Fast iteration

**When to use:**
- Developing features
- Testing changes
- Debugging issues
- Learning the codebase

### Production Mode
```bash
docker-compose up
```

**Features:**
- 🏭 Optimized builds
- 🚀 Better performance
- 🔒 Security hardened
- 📦 Minimal image size
- ⏱️ Slower to rebuild

**When to use:**
- Deploying to production
- Testing production builds
- Performance testing

---

## Hot Reload - How It Works

### Dashboard (Next.js)
```yaml
volumes:
  - ./dental-booking/dashboard:/app
  - /app/node_modules  # Prevents overwriting
  - /app/.next         # Prevents overwriting
```

**What happens when you edit files:**
1. Edit `page.tsx` or any React component
2. Save the file
3. **Instantly see changes** in browser (1-2 seconds)
4. ❌ **No need** to restart or rebuild!

### Backend (FastAPI)
```yaml
volumes:
  - ./dental-booking/backend:/app
command: uvicorn ... --reload
```

**What happens when you edit files:**
1. Edit Python files in `backend/app/`
2. Save the file
3. FastAPI automatically reloads (2-3 seconds)
4. ❌ **No need** to restart!

### WhatsApp Gateway (TypeScript)
```yaml
volumes:
  - ./dental-booking/whatsapp-gateway/src:/app/src
```

**Note:** Currently requires restart for TypeScript changes.
To add hot reload, we can configure nodemon (optional).

---

## Common Development Tasks

### 1. Editing Dashboard UI

```bash
# Start development mode
docker-compose -f docker-compose.dev.yml up dashboard

# Edit any file in dental-booking/dashboard/
# Example:
nano dental-booking/dashboard/app/whatsapp/page.tsx

# Save and see changes immediately in browser!
```

### 2. Editing Backend Logic

```bash
# Start development mode
docker-compose -f docker-compose.dev.yml up backend

# Edit any file in dental-booking/backend/app/
# Example:
nano dental-booking/backend/app/services/agent_service.py

# Save and backend auto-reloads!
```

### 3. Installing New Packages

#### Dashboard (npm packages)
```bash
# Enter the container
docker-compose -f docker-compose.dev.yml exec dashboard sh

# Install package
npm install package-name

# Exit
exit

# Package is saved in node_modules (persisted via volume)
```

Or directly:
```bash
cd dental-booking/dashboard
npm install package-name

# Restart container to load new package
docker-compose -f docker-compose.dev.yml restart dashboard
```

#### Backend (pip packages)
```bash
# Add package to requirements.txt
echo "new-package==1.0.0" >> dental-booking/backend/requirements.txt

# Rebuild backend
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up backend
```

### 4. Viewing Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f dashboard
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f whatsapp

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 dashboard
```

### 5. Restarting Services

```bash
# Restart all
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart dashboard
docker-compose -f docker-compose.dev.yml restart backend

# Stop all
docker-compose -f docker-compose.dev.yml down

# Start again
docker-compose -f docker-compose.dev.yml up
```

---

## When Do You Need to Rebuild?

### ❌ Never Need Rebuild (Hot Reload)
- ✅ Editing `.tsx`, `.ts`, `.jsx`, `.js` files in dashboard
- ✅ Editing `.py` files in backend
- ✅ Editing `.css` or Tailwind classes
- ✅ Changing component logic
- ✅ Updating API endpoints

### 🔄 Need Restart Only
- Changing `.env` variables
- Updating configuration files

```bash
docker-compose -f docker-compose.dev.yml restart
```

### 🔨 Need Rebuild
- Adding new npm packages (dashboard)
- Adding new pip packages (backend)
- Changing `Dockerfile` or `Dockerfile.dev`
- Changing `package.json` or `requirements.txt`

```bash
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up
```

---

## Debugging Tips

### 1. Check Service Status
```bash
docker-compose -f docker-compose.dev.yml ps
```

### 2. Check Logs for Errors
```bash
# Dashboard logs
docker-compose -f docker-compose.dev.yml logs dashboard | grep -i error

# Backend logs
docker-compose -f docker-compose.dev.yml logs backend | grep -i error
```

### 3. Enter Container Shell
```bash
# Dashboard
docker-compose -f docker-compose.dev.yml exec dashboard sh

# Backend
docker-compose -f docker-compose.dev.yml exec backend bash

# List files
ls -la

# Check environment
env
```

### 4. Test API Manually
```bash
# Health check
curl http://localhost:8001/health

# WhatsApp status
curl http://localhost:3002/status

# Test webhook
curl "http://localhost:3002/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=hello"
```

### 5. Clear Everything and Start Fresh
```bash
# Stop all
docker-compose -f docker-compose.dev.yml down

# Remove volumes (caution: deletes data)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild
docker-compose -f docker-compose.dev.yml build

# Start fresh
docker-compose -f docker-compose.dev.yml up
```

---

## Performance Tips

### 1. Start Only What You Need
```bash
# Only dashboard
docker-compose -f docker-compose.dev.yml up dashboard

# Dashboard + Backend
docker-compose -f docker-compose.dev.yml up dashboard backend

# Everything
docker-compose -f docker-compose.dev.yml up
```

### 2. Run Services in Background
```bash
docker-compose -f docker-compose.dev.yml up -d

# View logs when needed
docker-compose -f docker-compose.dev.yml logs -f
```

### 3. Use Docker Desktop Resources Wisely
In Docker Desktop settings:
- **Memory**: 4GB minimum, 8GB recommended
- **CPUs**: 2 minimum, 4 recommended
- **Swap**: 1GB minimum

---

## Common Issues

### Issue: "Cannot find module" in Dashboard

**Solution:**
```bash
# Reinstall dependencies
docker-compose -f docker-compose.dev.yml exec dashboard npm install

# Or rebuild
docker-compose -f docker-compose.dev.yml build dashboard
docker-compose -f docker-compose.dev.yml up dashboard
```

### Issue: Changes Not Appearing

**Dashboard:**
1. Check browser console for errors
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Check logs: `docker-compose -f docker-compose.dev.yml logs dashboard`

**Backend:**
1. Check if auto-reload is working in logs
2. Verify file is saved
3. Restart: `docker-compose -f docker-compose.dev.yml restart backend`

### Issue: Port Already in Use

```bash
# Check what's using the port
lsof -i :3001
lsof -i :8001

# Stop the service or change port in .env
nano .env

# Change:
DASHBOARD_PORT=3002  # or any other port
```

---

## Environment Variables Reference

### Required for All Services
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-xxx
```

### WhatsApp Business API
```bash
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=your-token
WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### Service Ports
```bash
BACKEND_PORT=8001
DASHBOARD_PORT=3001
WHATSAPP_PORT=3002
```

### Development Settings
```bash
ENVIRONMENT=development
LOG_LEVEL=debug          # Options: debug, info, warning, error
DEFAULT_LANGUAGE=ar      # Options: ar, en
```

---

## Best Practices

1. **Always Use Development Mode** for coding
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Keep Logs Open** in a separate terminal
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

3. **Test Locally First** before committing
   - Test in browser
   - Check logs for errors
   - Verify API calls work

4. **Use Git Branches** for features
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "Add new feature"
   ```

5. **Don't Commit Secrets**
   - `.env` is in `.gitignore`
   - Never commit API keys
   - Use `.env.example` as template

---

## Next Steps

After successful development setup:

1. **Try making a change**:
   - Edit `dental-booking/dashboard/app/page.tsx`
   - See it update instantly!

2. **Explore the codebase**:
   - Dashboard: `dental-booking/dashboard/`
   - Backend: `dental-booking/backend/`
   - WhatsApp: `dental-booking/whatsapp-gateway/`

3. **Read the docs**:
   - [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) - WhatsApp integration
   - [README.md](./README.md) - Project overview
   - [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker details

4. **Start building!** 🚀

---

**Happy coding!** ✨
