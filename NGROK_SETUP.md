# ngrok Setup Guide - WhatsApp Webhook

Complete guide to setup ngrok for WhatsApp Business Cloud API webhook testing.

## What is ngrok?

ngrok creates a secure tunnel from a public URL to your local development server. This is essential for:
- Testing WhatsApp webhooks locally
- Receiving webhook events from Meta
- Development without deploying to production

## Step 1: Create ngrok Account (Free)

1. Go to https://ngrok.com/
2. Click **"Sign up"** (free account)
3. After login, go to **"Your Authtoken"**: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

## Step 2: Configure ngrok

```bash
# Add your authtoken (replace with your actual token)
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Example:
```bash
ngrok config add-authtoken 2abc123def456_YourTokenHere
```

## Step 3: Start ngrok Tunnel

Open a **new terminal window** and run:

```bash
# Start ngrok for WhatsApp Gateway (port 3002)
ngrok http 3002
```

You should see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.33.0
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3002

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### Important URLs:
- **Public URL**: `https://abc123def456.ngrok-free.app` (this changes each time you restart ngrok)
- **Web Interface**: http://127.0.0.1:4040 (view webhook requests in real-time)

## Step 4: Configure Meta Webhook

### Option A: Using Meta Developer Console

1. Go to https://developers.facebook.com/
2. Select your WhatsApp Business app
3. Go to **WhatsApp → Configuration**
4. Click **"Edit"** in Webhook section
5. Enter:
   - **Callback URL**: `https://YOUR-NGROK-URL.ngrok-free.app/webhook`
   - **Verify Token**: The same token from your `.env` file (`WEBHOOK_VERIFY_TOKEN`)
6. Click **"Verify and Save"**

Example:
- Callback URL: `https://abc123def456.ngrok-free.app/webhook`
- Verify Token: `my_secure_token_12345`

### Option B: Using Meta API

```bash
# Get your app token from Meta dashboard
APP_ID="your-app-id"
APP_SECRET="your-app-secret"
VERIFY_TOKEN="your-verify-token"
NGROK_URL="https://your-ngrok-url.ngrok-free.app"

# Subscribe to webhook
curl -X POST "https://graph.facebook.com/v18.0/${APP_ID}/subscriptions" \
  -d "object=whatsapp_business_account" \
  -d "callback_url=${NGROK_URL}/webhook" \
  -d "verify_token=${VERIFY_TOKEN}" \
  -d "fields=messages" \
  -d "access_token=${APP_SECRET}"
```

## Step 5: Test Webhook Connection

### Test 1: Verify Endpoint Works Locally

```bash
# Test locally first
curl "http://localhost:3002/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test_challenge"

# Should return: test_challenge
```

### Test 2: Verify Endpoint Through ngrok

```bash
# Test through ngrok
curl "https://YOUR-NGROK-URL.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=hello"

# Should return: hello
```

### Test 3: Check ngrok Web Interface

Open http://127.0.0.1:4040 in your browser to see:
- All incoming webhook requests
- Request details
- Response status
- **Very useful for debugging!**

## Step 6: Subscribe to Webhook Fields

In Meta Developer Console:
1. Go to **WhatsApp → Configuration → Webhook**
2. Click **"Manage"**
3. Subscribe to these fields:
   - ✅ **messages** (required)
   - ✅ **message_deliveries** (optional)
   - ✅ **message_reads** (optional)
4. Save

## Step 7: Test End-to-End

### Send Test Message from Meta

1. Go to **WhatsApp → Getting Started**
2. Find the **"Send test message"** section
3. Enter your phone number
4. Send a test message

You should see:
- Request in ngrok web interface (http://127.0.0.1:4040)
- Log in WhatsApp Gateway container
- Response sent back to WhatsApp

### Send Real WhatsApp Message

1. Open WhatsApp on your phone
2. Send message to your WhatsApp Business number
3. Example: "مرحبا" or "Hello"
4. Bot should respond automatically!

## Monitoring Webhooks

### View in ngrok Web Interface
```bash
# Open in browser
open http://127.0.0.1:4040
```

Features:
- See all HTTP requests in real-time
- Inspect headers, body, response
- Replay requests for testing

### View in WhatsApp Gateway Logs
```bash
# Watch logs in real-time
docker-compose -f docker-compose.dev.yml logs -f whatsapp
```

You should see:
```
📨 Received webhook event
📨 Message from 972599123456: مرحبا
🤖 Bot reply: أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟
✅ Message sent successfully
```

## Common Issues

### Issue 1: "Webhook verification failed"

**Possible causes:**
- Wrong verify token
- ngrok not running
- WhatsApp Gateway not running

**Solution:**
```bash
# 1. Check ngrok is running
curl https://YOUR-NGROK-URL.ngrok-free.app/webhook

# 2. Check verify token matches
cat dental-booking/whatsapp-gateway/.env | grep WEBHOOK_VERIFY_TOKEN

# 3. Test locally
curl "http://localhost:3002/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

### Issue 2: "ngrok URL changes every restart"

**Free plan:** URL changes each time you restart ngrok

**Solutions:**
- **Option A**: Use same ngrok session (don't restart)
- **Option B**: Upgrade to ngrok paid plan ($8/month) for static URL
- **Option C**: Update Meta webhook URL each time ngrok restarts

### Issue 3: "Messages not being received"

**Checklist:**
1. ✅ ngrok is running
2. ✅ WhatsApp Gateway is running
3. ✅ Backend is running
4. ✅ Webhook subscribed to "messages" field
5. ✅ Meta webhook URL is correct

**Debug:**
```bash
# Check ngrok web interface for requests
open http://127.0.0.1:4040

# Check WhatsApp logs
docker-compose -f docker-compose.dev.yml logs whatsapp | tail -50

# Check Backend logs
docker-compose -f docker-compose.dev.yml logs backend | tail -50
```

### Issue 4: "Connection refused"

**Cause:** WhatsApp Gateway not running

**Solution:**
```bash
# Start services
docker-compose -f docker-compose.dev.yml up whatsapp backend

# Verify status
curl http://localhost:3002/status
```

## Development Workflow

### Complete Setup Flow

```bash
# Terminal 1: Start Docker services
docker-compose -f docker-compose.dev.yml up

# Terminal 2: Start ngrok
ngrok http 3002

# Terminal 3: Watch logs
docker-compose -f docker-compose.dev.yml logs -f whatsapp
```

### When ngrok Restarts

```bash
# 1. Get new ngrok URL
# Check terminal where ngrok is running
# Example: https://new-url-12345.ngrok-free.app

# 2. Update Meta webhook
# Go to Meta Developer Console → WhatsApp → Configuration
# Update Callback URL with new ngrok URL

# 3. Test
curl "https://NEW-NGROK-URL.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

## ngrok Pro Features (Optional)

If you upgrade to ngrok Pro ($8/month):
- **Static URLs**: Same URL every time
- **Custom domains**: Use your own domain
- **No "ngrok" in URL**
- **More bandwidth**

Free plan is sufficient for development!

## Alternative to ngrok

If you don't want to use ngrok, alternatives:

### 1. localtunnel (Free)
```bash
npm install -g localtunnel
lt --port 3002
```

### 2. VS Code Port Forwarding
If using VS Code with Remote Development:
- Ports tab → Forward port 3002
- Get public URL

### 3. Cloudflare Tunnel (Free)
```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Run
cloudflared tunnel --url http://localhost:3002
```

## Summary

1. ✅ Install ngrok: `brew install ngrok/ngrok/ngrok`
2. ✅ Add authtoken: `ngrok config add-authtoken YOUR_TOKEN`
3. ✅ Start ngrok: `ngrok http 3002`
4. ✅ Configure Meta webhook with ngrok URL
5. ✅ Subscribe to "messages" field
6. ✅ Test with real WhatsApp message
7. ✅ Monitor in ngrok web interface: http://127.0.0.1:4040

---

**Ready to receive WhatsApp messages!** 🚀📱
