# WhatsApp Integration Setup Guide

Complete guide to setup WhatsApp integration with Baileys for the Dental Booking Agent.

## Overview

The WhatsApp Gateway connects your personal WhatsApp number to the dental booking system, allowing patients to book appointments via WhatsApp messages.

## Architecture

```
Patient WhatsApp → Your WhatsApp (Baileys) → Gateway Service → FastAPI Backend → OpenAI GPT-4o-mini
```

## Prerequisites

- Docker & Docker Compose installed
- Personal WhatsApp number
- Smartphone with WhatsApp installed
- Backend and Dashboard already running

## Step-by-Step Setup

### 1. Verify Backend is Running

```bash
# Check if backend is healthy
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "agent": "ready"
}
```

### 2. Build WhatsApp Gateway

```bash
# Build the WhatsApp service
docker-compose build whatsapp
```

### 3. Start WhatsApp Gateway

```bash
# Start WhatsApp service
docker-compose up -d whatsapp
```

### 4. Get QR Code

```bash
# View WhatsApp logs
npm run docker:logs:whatsapp
```

You'll see output like:
```
🚀 Starting WhatsApp Gateway for Dental Booking Agent...
Environment: production
Backend URL: http://backend:8001
Starting WhatsApp connection...
Scan the QR code below with your WhatsApp:

█████████████████████████████████
█████████████████████████████████
████ ▄▄▄▄▄ █▀█ █▄▄▀▄█ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ ▀ ▀█ █   █ ████
████ █▄▄▄█ █▀ █▀▀█▄ █ █▄▄▄█ ████
...
```

### 5. Link Your WhatsApp

On your phone:

1. Open WhatsApp
2. Go to **Settings** (⚙️)
3. Tap **Linked Devices**
4. Tap **Link a Device**
5. Scan the QR code from the terminal

### 6. Wait for Connection

After scanning, you'll see:
```
✅ WhatsApp connected successfully!
✅ Backend API is healthy
```

### 7. Test the Integration

Send a message to your WhatsApp number from another phone:

```
السلام عليكم
```

Expected bot response:
```
أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟
```

## Complete Test Flow

### Arabic Test

```
Patient: السلام عليكم
Bot: أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟

Patient: محمد علي
Bot: أهلاً محمد! شو الخدمة اللي بتحتاجها؟
1️⃣ فحص وتشخيص - 50₪
2️⃣ تنظيف الأسنان - 100₪
...

Patient: 2
Bot: تمام! اخترت تنظيف الأسنان. أي يوم بيناسبك؟

Patient: غداً
Bot: الأوقات المتاحة ليوم 2024-01-16:
• 10:00 صباحاً
• 11:30 صباحاً
...
```

### English Test

```
Patient: Hello
Bot: Hello! May I have your full name please?

Patient: Ahmed Ali
Bot: Hello Ahmed! Which service do you need?
1️⃣ Examination & Diagnosis - 50₪
2️⃣ Teeth Cleaning - 100₪
...
```

## Docker Commands

### View Logs

```bash
# All services
npm run docker:logs

# WhatsApp only
npm run docker:logs:whatsapp

# Backend only
npm run docker:logs:backend
```

### Restart Services

```bash
# Restart WhatsApp
npm run docker:restart:whatsapp

# Restart all
docker-compose restart
```

### Stop Services

```bash
# Stop all
npm run docker:down

# Stop WhatsApp only
docker-compose stop whatsapp
```

## Session Management

### Session Persistence

- Session data is stored in Docker volume `whatsapp-sessions`
- Persists across container restarts
- No need to rescan QR code after restart

### Reset Session

If you need to link a different number or reset:

```bash
# Stop services
docker-compose down

# Remove session volume
docker volume rm appChatGpt_whatsapp-sessions

# Start again
docker-compose up -d

# Get new QR code
npm run docker:logs:whatsapp
```

## Monitoring

### Check WhatsApp Status

```bash
# View real-time logs
docker-compose logs -f whatsapp
```

### Check Backend Connection

```bash
# Inside container
docker exec -it dental-booking-whatsapp node -e "
const axios = require('axios');
axios.get('http://backend:8000/health')
  .then(r => console.log('Backend OK:', r.data))
  .catch(e => console.error('Backend Error:', e.message));
"
```

## Troubleshooting

### Problem: QR Code Not Showing

**Solution:**
```bash
# Restart WhatsApp service
docker-compose restart whatsapp

# View logs again
npm run docker:logs:whatsapp
```

### Problem: Connection Keeps Dropping

**Possible causes:**
- Phone lost internet connection
- Session expired
- Backend is down

**Solution:**
```bash
# Check backend
curl http://localhost:8001/health

# Restart WhatsApp
docker-compose restart whatsapp

# If persists, reset session
docker-compose down
docker volume rm appChatGpt_whatsapp-sessions
docker-compose up -d
```

### Problem: Messages Not Being Processed

**Check:**
1. WhatsApp is connected:
   ```bash
   npm run docker:logs:whatsapp
   ```
   Look for: `✅ WhatsApp connected successfully!`

2. Backend is responding:
   ```bash
   curl -X POST http://localhost:8001/webhook/message \
     -H "Content-Type: application/json" \
     -d '{"phone": "972599123456", "message": "test"}'
   ```

3. Check logs:
   ```bash
   # WhatsApp logs
   npm run docker:logs:whatsapp

   # Backend logs
   npm run docker:logs:backend
   ```

### Problem: "Backend API health check failed"

**Solution:**
```bash
# Check if backend is running
docker ps | grep backend

# Start backend if not running
docker-compose up -d backend

# Wait for backend to be healthy
docker-compose logs -f backend
```

### Problem: Session Expired Error

**Solution:**
```bash
# Clear session and reconnect
docker-compose down
docker volume rm appChatGpt_whatsapp-sessions
docker-compose up -d
npm run docker:logs:whatsapp
# Scan new QR code
```

## Security Notes

1. **Session Files**: Session data contains authentication credentials. Keep `sessions/` directory secure.

2. **Docker Volume**: The `whatsapp-sessions` volume contains sensitive data. Don't share it.

3. **Linked Devices**: Monitor linked devices in WhatsApp settings regularly.

4. **Logs**: Logs may contain phone numbers. Be careful when sharing logs.

## Production Considerations

### High Availability

For production, consider:
- Running on a VPS with good uptime
- Setting up monitoring alerts
- Regular session backups
- Multiple WhatsApp numbers (load balancing)

### Scaling

For multiple dentists/clinics:
1. Deploy multiple gateway instances
2. Each with its own WhatsApp number
3. Use load balancer to distribute

### Monitoring

Set up monitoring for:
- Connection status
- Message processing time
- Error rates
- Backend API health

## Advanced Configuration

### Custom Backend URL

Edit `docker-compose.yml`:
```yaml
whatsapp:
  environment:
    - BACKEND_URL=http://your-custom-backend:8000
```

### Custom Log Level

```yaml
whatsapp:
  environment:
    - LOG_LEVEL=debug  # Options: debug, info, warn, error
```

### Resource Limits

```yaml
whatsapp:
  deploy:
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
```

## Support

### Check Service Status

```bash
# All services status
docker-compose ps

# Detailed info
docker-compose ps whatsapp
```

### View Recent Logs

```bash
# Last 100 lines
docker-compose logs --tail=100 whatsapp

# Follow logs
docker-compose logs -f whatsapp
```

### Restart Everything

```bash
docker-compose down
docker-compose up -d
```

## Next Steps

After successful setup:

1. Share your WhatsApp number with patients
2. Monitor conversations in the dashboard: http://localhost:3001/conversations
3. Check bookings: http://localhost:3001/bookings
4. View API docs: http://localhost:8001/docs

## FAQ

**Q: Does my phone need to stay online?**
A: Only during initial QR scan. After that, it can be offline (multi-device protocol).

**Q: Can I use WhatsApp Business number?**
A: Yes, both personal and business numbers work.

**Q: How many messages can it handle?**
A: Depends on your server resources. Tested up to 100 concurrent conversations.

**Q: What happens if the container restarts?**
A: It auto-reconnects using saved session. No need to rescan QR.

**Q: Can I use multiple phone numbers?**
A: Yes, deploy multiple gateway instances with different session paths.

**Q: Is this against WhatsApp ToS?**
A: Baileys uses WhatsApp Web protocol. Check WhatsApp ToS for your use case.

---

**Made with ❤️ for Gaza dental clinics**
