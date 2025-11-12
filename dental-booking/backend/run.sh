#!/bin/bash

# Dental Booking Agent - Run Script

echo "🦷 Starting Dental Booking Agent..."
echo "=================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example and add your credentials."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements if needed
if [ ! -f "venv/installed" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# Run the server
echo "🚀 Starting FastAPI server..."
echo "=================================="
echo "Server will be available at: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo "=================================="

cd app && uvicorn main:app --reload --host 0.0.0.0 --port 8000
