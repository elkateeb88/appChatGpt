#!/bin/bash

# ================================================
# ngrok Quick Start Script
# ================================================

echo "🚀 Starting ngrok for WhatsApp Webhook..."
echo ""

# Check if authtoken is configured
if ! ngrok config check &>/dev/null; then
    echo "⚠️  ngrok authtoken not configured!"
    echo ""
    echo "📋 Follow these steps:"
    echo "1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Sign up (free) or login"
    echo "3. Copy your authtoken"
    echo "4. Run: ngrok config add-authtoken YOUR_TOKEN_HERE"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

echo "✅ ngrok is configured"
echo ""

# Check if port 3002 is available
if ! curl -s http://localhost:3002/status &>/dev/null; then
    echo "⚠️  WhatsApp Gateway is not running on port 3002"
    echo ""
    echo "Start it with:"
    echo "  docker-compose -f docker-compose.dev.yml up"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🌐 Starting ngrok tunnel on port 3002..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start ngrok
ngrok http 3002

# Note: ngrok will run in foreground
# Press Ctrl+C to stop
