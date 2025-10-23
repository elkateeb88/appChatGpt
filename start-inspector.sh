#!/bin/bash

# Start MCP Inspector for Numeroesim Communication Server
# This script starts the inspector and opens it in the browser

echo "🚀 Starting Numeroesim MCP Inspector..."
echo ""

# Kill any existing inspector processes
if lsof -ti:6274 > /dev/null 2>&1; then
    echo "⚠️  Stopping existing inspector on port 6274..."
    lsof -ti:6274 | xargs kill -9 2>/dev/null
fi

if lsof -ti:6277 > /dev/null 2>&1; then
    echo "⚠️  Stopping existing proxy on port 6277..."
    lsof -ti:6277 | xargs kill -9 2>/dev/null
fi

# Wait a moment for ports to be released
sleep 1

echo ""
echo "📦 Launching inspector..."
echo ""

# Start the inspector
npx @modelcontextprotocol/inspector node src/index.js
