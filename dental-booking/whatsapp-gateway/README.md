# WhatsApp Gateway for Dental Booking Agent

WhatsApp integration using Baileys for the Dental Booking Agent system.

## Features

- Multi-device WhatsApp Web protocol
- QR code authentication
- Automatic message handling
- Session persistence
- Auto-reconnection
- Bridge to FastAPI backend

## Quick Start with Docker

### 1. Build and start all services

```bash
npm run docker:build
npm run docker:up
```

### 2. View WhatsApp logs to get QR code

```bash
npm run docker:logs:whatsapp
```

### 3. Scan QR code

Open WhatsApp on your phone:
1. Go to Settings > Linked Devices
2. Tap "Link a Device"
3. Scan the QR code shown in the terminal

### 4. Wait for connection

Once connected, you'll see:
```
✅ WhatsApp connected successfully!
```

## Manual Setup (Without Docker)

### 1. Install dependencies

```bash
cd whatsapp-gateway
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
BACKEND_URL=http://localhost:8001
SESSION_PATH=./sessions
LOG_LEVEL=info
ENVIRONMENT=development
```

### 3. Run in development mode

```bash
npm run dev
```

### 4. Scan QR code

The QR code will appear in your terminal. Scan it with WhatsApp.

## How It Works

```
WhatsApp Message → Baileys → WhatsApp Gateway → FastAPI Backend → OpenAI → Response → WhatsApp
```

1. User sends message on WhatsApp
2. Baileys receives the message
3. Gateway forwards to FastAPI `/webhook/message`
4. Backend processes with AI agent
5. Gateway sends reply back to WhatsApp

## Docker Commands

```bash
# View WhatsApp logs
npm run docker:logs:whatsapp

# Restart WhatsApp service
npm run docker:restart:whatsapp

# Stop all services
npm run docker:down
```

## Session Management

- Sessions are stored in `/app/sessions` inside the container
- Persisted using Docker volumes (`whatsapp-sessions`)
- If you disconnect, just restart and it will reconnect automatically
- To reset connection: remove the volume and scan QR again

```bash
# Remove session and start fresh
docker-compose down
docker volume rm appChatGpt_whatsapp-sessions
docker-compose up -d
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

### QR Code not showing

```bash
# Check logs
npm run docker:logs:whatsapp

# Restart service
npm run docker:restart:whatsapp
```

### Connection keeps disconnecting

- Make sure backend is running
- Check backend URL in environment variables
- Verify network connectivity

### Session expired

```bash
# Clear session and reconnect
docker-compose down
docker volume rm appChatGpt_whatsapp-sessions
docker-compose up -d
npm run docker:logs:whatsapp
```

### Backend not responding

```bash
# Check backend health
curl http://localhost:8001/health

# View backend logs
npm run docker:logs:backend
```

## Important Notes

- Keep your phone connected to internet initially (for QR scan)
- After QR scan, phone can be offline
- Session persists even if container restarts
- Multi-device protocol - works even if phone is off after initial setup
- Messages are processed automatically
- No manual intervention needed after setup

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | FastAPI backend URL | `http://backend:8001` |
| `SESSION_PATH` | Path to store session | `./sessions` |
| `LOG_LEVEL` | Logging level | `info` |
| `ENVIRONMENT` | Environment name | `development` |

## Supported Message Types

Currently supported:
- Text messages
- Extended text (with links, mentions)
- Image captions

Not yet supported:
- Voice messages
- Video messages
- Documents
- Stickers

## Architecture

```
whatsapp-gateway/
├── src/
│   ├── index.ts          # Main entry point
│   ├── whatsapp-client.ts # Baileys client wrapper
│   ├── api-client.ts      # FastAPI bridge
│   ├── config.ts          # Configuration
│   └── logger.ts          # Logging setup
├── sessions/              # WhatsApp session data
├── Dockerfile             # Docker configuration
├── package.json
└── tsconfig.json
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
