# WhatsApp Business Cloud API Integration Guide

Complete guide to setup WhatsApp Business Cloud API integration for the Dental Booking Agent.

## Overview

The WhatsApp Gateway connects WhatsApp Business API to the dental booking system, allowing patients to book appointments via WhatsApp messages using Meta's official Cloud API.

## Architecture

```
Patient WhatsApp → Meta Cloud API → Webhook → Gateway Service → FastAPI Backend → OpenAI GPT-4o-mini
```

## Prerequisites

- Docker & Docker Compose installed
- Meta (Facebook) Developer Account
- WhatsApp Business App (registered with Meta)
- Access to Meta for Developers platform
- Backend and Dashboard already running

## Step-by-Step Setup

### 1. Setup WhatsApp Business App on Meta

#### 1.1 Create or Select an App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details and create

#### 1.2 Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** in the products list
2. Click **"Set up"** to add WhatsApp Business Platform
3. Wait for the setup to complete

#### 1.3 Get Your Credentials

You need three pieces of information:

1. **Phone Number ID**:
   - Go to WhatsApp → Getting Started
   - Under "Send and receive messages"
   - Copy the **Phone Number ID**

2. **Access Token**:
   - Go to WhatsApp → Getting Started
   - Under "Temporary access token" (for testing)
   - Or create a permanent token in Settings → Basic → Access Tokens

3. **Verify Token** (you create this):
   - Any secure random string (e.g., `my_secure_verify_token_123`)
   - You'll use this when configuring the webhook

### 2. Configure Environment Variables

Create or update `.env` file in the `dental-booking/whatsapp-gateway` directory:

```bash
# WhatsApp Business Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WEBHOOK_VERIFY_TOKEN=your_verify_token_here

# Backend Configuration
BACKEND_URL=http://backend:8001

# Server Configuration
PORT=3002
ENVIRONMENT=production
```

### 3. Verify Backend is Running

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

### 4. Build and Start WhatsApp Gateway

```bash
# Build the WhatsApp service
docker-compose build whatsapp

# Start WhatsApp service
docker-compose up -d whatsapp
```

### 5. Check Service Status

```bash
# View WhatsApp logs
npm run docker:logs:whatsapp

# Or directly
docker-compose logs -f whatsapp
```

You should see:
```
🚀 Starting WhatsApp Business Cloud API Gateway...
Environment: production
Backend URL: http://backend:8001
Port: 3002
✅ Backend API is healthy
✅ WhatsApp Gateway listening on port 3002
📡 Webhook endpoint: http://localhost:3002/webhook
```

### 6. Setup Webhook in Meta

You need a public URL for the webhook. For development, use **ngrok** or **localtunnel**.

#### 6.1 Using ngrok (Recommended for Development)

```bash
# Install ngrok (if not installed)
# Download from https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3002
```

You'll get a URL like: `https://abc123.ngrok.io`

#### 6.2 Configure Webhook in Meta

1. Go to your app in Meta for Developers
2. Navigate to **WhatsApp** → **Configuration**
3. In the **Webhook** section, click **"Edit"**
4. Enter your webhook URL:
   - **Callback URL**: `https://your-domain.com/webhook` (or your ngrok URL)
   - **Verify Token**: The same token you set in `WEBHOOK_VERIFY_TOKEN`
5. Click **"Verify and Save"**

#### 6.3 Subscribe to Webhook Fields

After verification, subscribe to webhook fields:
1. Click **"Manage"** in the Webhook section
2. Subscribe to **"messages"** field
3. Save changes

### 7. Test the Integration

Send a message to your WhatsApp Business number from another phone:

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

## Configuration Management

### Environment Variables

The gateway uses environment variables for configuration. All credentials are stored securely in `.env` file:

- `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp Business Phone Number ID from Meta
- `WHATSAPP_ACCESS_TOKEN`: Access token from Meta (permanent or temporary)
- `WEBHOOK_VERIFY_TOKEN`: Custom token for webhook verification
- `BACKEND_URL`: URL to your backend service (default: http://backend:8001)
- `PORT`: Port for the gateway service (default: 3002)

### Updating Configuration

If you need to change credentials:

```bash
# 1. Update .env file
nano dental-booking/whatsapp-gateway/.env

# 2. Restart the service
docker-compose restart whatsapp

# 3. Check logs
docker-compose logs -f whatsapp
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

### Problem: Webhook Verification Failed

**Possible causes:**
- Wrong verify token
- Webhook URL not accessible
- Service not running

**Solution:**
```bash
# 1. Check service is running
docker-compose ps whatsapp

# 2. Verify environment variables
docker-compose exec whatsapp env | grep WEBHOOK

# 3. Test webhook locally
curl "http://localhost:3002/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Should return "test" if verification token is correct

# 4. Make sure ngrok is running and URL is correct
```

### Problem: Messages Not Being Received

**Possible causes:**
- Webhook not subscribed to "messages" field
- Invalid access token
- Phone number not verified
- Backend is down

**Solution:**
```bash
# 1. Check backend
curl http://localhost:8001/health

# 2. Check WhatsApp gateway status
curl http://localhost:3002/status

# 3. View logs for errors
docker-compose logs --tail=50 whatsapp

# 4. Verify webhook subscription in Meta dashboard
# Go to WhatsApp → Configuration → Webhook → Manage
# Ensure "messages" is checked
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

### Problem: "Invalid Access Token" or 401 Errors

**Possible causes:**
- Access token expired (temporary tokens expire after 24 hours)
- Wrong token copied
- Token doesn't have required permissions

**Solution:**
```bash
# 1. Generate a new access token from Meta
# Go to WhatsApp → Getting Started → Temporary access token
# Or create a permanent token

# 2. Update .env file with new token
nano dental-booking/whatsapp-gateway/.env

# 3. Restart service
docker-compose restart whatsapp

# 4. Test with the status endpoint
curl http://localhost:3002/status
```

### Problem: Webhook Not Receiving Messages

**Solution:**
```bash
# 1. Test ngrok is working
curl https://your-ngrok-url.ngrok.io/webhook

# 2. Check if webhook is properly configured in Meta
# The callback URL should be: https://your-ngrok-url.ngrok.io/webhook

# 3. Send a test message from Meta dashboard
# Go to WhatsApp → Getting Started → Send test message

# 4. Check gateway logs
docker-compose logs -f whatsapp
```

## Security Notes

1. **Access Tokens**: Keep your WhatsApp access token secure. Never commit it to version control.
   - Use `.env` files (already in `.gitignore`)
   - Rotate tokens periodically
   - Use permanent tokens for production

2. **Webhook Verify Token**: Use a strong, random string for webhook verification.
   - At least 20 characters
   - Combination of letters, numbers, and symbols
   - Different from other tokens

3. **Environment Variables**: Protect your `.env` file:
   ```bash
   # Set proper permissions
   chmod 600 dental-booking/whatsapp-gateway/.env
   ```

4. **HTTPS Required**: Meta requires HTTPS for webhooks:
   - Development: Use ngrok or localtunnel
   - Production: Use proper SSL certificates

5. **Logs**: Logs may contain phone numbers and message content. Be careful when sharing logs.

## Production Considerations

### High Availability

For production, consider:
- Running on a VPS with good uptime (99.9%+)
- Setting up monitoring alerts (uptime monitoring)
- Using permanent access tokens (not temporary)
- Configuring rate limiting
- Multiple WhatsApp Business numbers for different clinics

### Access Token Management

**Temporary vs Permanent Tokens:**

- **Temporary Token** (Testing):
  - Expires after 24 hours
  - Good for development
  - Get from WhatsApp → Getting Started

- **Permanent Token** (Production):
  - Never expires (unless revoked)
  - Required for production
  - Generate from App Settings → Basic → App Tokens
  - Or use System User tokens with longer validity

### Scaling

For multiple dentists/clinics:
1. Create separate WhatsApp Business numbers
2. Deploy multiple gateway instances (one per number)
3. Each instance with its own configuration
4. Use different ports (3002, 3003, 3004, etc.)

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

**Q: Do I need a phone to stay online?**
A: No! WhatsApp Business Cloud API is completely cloud-based. No phone or device needed.

**Q: What's the difference between WhatsApp Business App and WhatsApp Business Platform?**
A:
- **WhatsApp Business App**: Mobile app for small businesses (manual operation)
- **WhatsApp Business Platform** (Cloud API): API for automated messaging (what we use)

**Q: How many messages can it handle?**
A: Meta provides generous limits:
- Development: 1,000 conversations/month (free)
- Production: Unlimited (paid based on usage)
- Rate limits apply (check Meta documentation)

**Q: What happens if the container restarts?**
A: The gateway automatically reconnects using the access token. No manual intervention needed.

**Q: Can I use multiple phone numbers?**
A: Yes, you need to:
1. Register multiple WhatsApp Business numbers in Meta
2. Deploy separate gateway instances for each number
3. Configure each with its own Phone Number ID and Access Token

**Q: How much does WhatsApp Business Platform cost?**
A:
- **First 1,000 conversations/month**: Free
- **After that**: Pricing varies by country (check Meta's pricing page)
- **Business-initiated conversations**: Higher cost
- **User-initiated conversations** (like our booking system): Lower cost

**Q: Do I need a verified Facebook Business account?**
A: For production with real users, yes. For development/testing, a regular Meta developer account is sufficient.

**Q: Can I test without deploying to a public server?**
A: Yes, use ngrok to create a temporary public URL for your local development server.

---

**Made with ❤️ for Gaza dental clinics**
