# WhatsApp Gateway for Dental Booking Agent

WhatsApp Business Cloud API integration for the Dental Booking Agent system.

## Features

- WhatsApp Business Cloud API integration
- Webhook-based message receiving
- Automatic message handling
- No QR code needed - uses Access Token
- Scalable and reliable
- Bridge to FastAPI backend

## Prerequisites

Before starting, you need:

1. **WhatsApp Business Account** - Create at [Meta Business Suite](https://business.facebook.com/)
2. **Phone Number ID** - From WhatsApp Business API settings
3. **Access Token** - Permanent token from Meta App Dashboard
4. **Webhook Verify Token** - Any custom string you choose

## Quick Start

### 1. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WEBHOOK_VERIFY_TOKEN=my_secret_token_12345
BACKEND_URL=http://backend:8001
PORT=3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Gateway

```bash
npm run dev
```

### 4. Configure Webhook in Meta

1. Go to [Meta App Dashboard](https://developers.facebook.com/)
2. Navigate to WhatsApp > Configuration
3. Set Webhook URL: `https://your-domain.com/webhook`
4. Set Verify Token: Same as `WEBHOOK_VERIFY_TOKEN` in `.env`
5. Subscribe to `messages` events

### 5. Test the Integration

Send a message to your WhatsApp Business number and check the logs!

## How It Works

```
WhatsApp Message → Meta Webhook → Gateway → FastAPI Backend → OpenAI → Response → WhatsApp Cloud API
```

1. User sends message on WhatsApp
2. Meta sends webhook event to `/webhook`
3. Gateway extracts message and forwards to Backend API
4. Backend processes with AI agent
5. Gateway sends reply via WhatsApp Cloud API

## API Endpoints

### GET /webhook
Webhook verification endpoint for Meta.

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Your verify token
- `hub.challenge` - Challenge string to return

### POST /webhook
Receives incoming WhatsApp messages from Meta.

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "whatsapp-gateway"
}
```

### GET /status
Gateway status and configuration.

**Response:**
```json
{
  "status": "running",
  "apiType": "WhatsApp Business Cloud API",
  "phoneNumberId": "123456789012345",
  "configured": true
}
```

## Testing

Send a WhatsApp message to your number:

```
السلام عليكم
```

Expected response:
```
أهلاً وسهلاً! ممكن تعطيني اسمك الكامل؟
```

## Troubleshooting

### Webhook verification failed

- Check that `WEBHOOK_VERIFY_TOKEN` matches in both `.env` and Meta dashboard
- Ensure webhook URL is publicly accessible (use ngrok for local testing)

### Messages not received

```bash
# Check gateway logs
npm run dev

# Check webhook subscription in Meta dashboard
# Ensure "messages" event is subscribed

# Test webhook manually
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"field":"messages","value":{"messages":[{"from":"972599123456","type":"text","text":{"body":"test"}}]}}]}]}'
```

### Failed to send message

- Verify `WHATSAPP_ACCESS_TOKEN` is valid and not expired
- Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- Ensure phone number is registered with WhatsApp Business

### Backend not responding

```bash
# Check backend health
curl http://localhost:8001/health

# Check backend URL in .env
echo $BACKEND_URL
```

## Important Notes

- No phone needed after setup (Cloud API handles everything)
- Access Token should be permanent (not temporary)
- Webhook must be HTTPS in production (use ngrok for local testing)
- Messages are processed automatically
- 1000 free messages per month with Cloud API
- All conversation data stored in your database

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID | ✅ Yes | - |
| `WHATSAPP_ACCESS_TOKEN` | Permanent Access Token from Meta | ✅ Yes | - |
| `WEBHOOK_VERIFY_TOKEN` | Custom token for webhook verification | ✅ Yes | - |
| `BACKEND_URL` | FastAPI backend URL | No | `http://backend:8001` |
| `PORT` | Server port | No | `3000` |
| `LOG_LEVEL` | Logging level | No | `info` |
| `ENVIRONMENT` | Environment name | No | `development` |

## Supported Message Types

Currently supported:
- ✅ Text messages

Coming soon:
- 📋 Image messages with captions
- 📋 Quick reply buttons
- 📋 Template messages
- 📋 Media messages (images, documents)

## Architecture

```
whatsapp-gateway/
├── src/
│   ├── index.ts       # Main entry point + Express server
│   ├── api-client.ts  # FastAPI backend client
│   ├── config.ts      # Configuration
│   └── logger.ts      # Logging setup
├── .env.example       # Environment variables template
├── Dockerfile         # Docker configuration
├── package.json
├── tsconfig.json
└── README.md
```

## WhatsApp Cloud API Flow

```
┌─────────────┐
│   Patient   │
└──────┬──────┘
       │ Sends message
       ▼
┌─────────────────┐
│ WhatsApp Cloud  │
│      API        │
└──────┬──────────┘
       │ Webhook POST
       ▼
┌─────────────────┐
│  This Gateway   │◄──────── Configured via .env
└──────┬──────────┘
       │ Forward message
       ▼
┌─────────────────┐
│ Backend API     │
│  (FastAPI)      │
└──────┬──────────┘
       │ Process with AI
       ▼
┌─────────────────┐
│   OpenAI GPT    │
└──────┬──────────┘
       │ Return response
       ▼
┌─────────────────┐
│  This Gateway   │
└──────┬──────────┘
       │ Send via Cloud API
       ▼
┌─────────────────┐
│   Patient's     │
│   WhatsApp      │
└─────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## License

MIT
