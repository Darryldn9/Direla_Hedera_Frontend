#!/bin/bash

# !!!!!
# Run chmod +x start.sh
# Run ./start.sh

# Direla - Start Script
# This script starts both the backend and frontend development servers concurrently

echo "🚀 Starting Direla Development Environment..."
echo "=================================================="

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    # Kill all background processes started by this script
    jobs -p | xargs -r kill
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected structure: ./backend and ./frontend directories"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in background
echo "📱 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started successfully!"
echo "   Backend:  http://localhost:3000 (or check terminal output)"
echo "   Frontend: Expo development server (check terminal output)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=================================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID