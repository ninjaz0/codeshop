#!/bin/bash

# Exit on error
set -e

echo "========================================="
echo "  🚀 Virtual Mall Auto Deployment Script"
echo "========================================="

# 1. Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js installed: $(node -v)"

# 2. Check PM2 installation
if ! command -v pm2 &> /dev/null; then
    echo "⚙️  Installing PM2 globally..."
    npm install -g pm2
else
    echo "✅ PM2 installed: $(pm2 -v)"
fi

# 3. Install Server Dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# 4. Install Client Dependencies & Build
echo "📦 Installing frontend dependencies..."
cd client
npm install

echo "🛠️  Building frontend..."
npm run build
cd ..

# 5. Start or Restart Backend Server with PM2
echo "🚀 Starting backend server with PM2..."
cd server

# Check if pm2 process already exists
if pm2 status | grep -q "virtual-mall"; then
    echo "🔄 Restarting existing virtual-mall process..."
    pm2 restart virtual-mall
else
    echo "▶️  Starting new virtual-mall process..."
    pm2 start index.js --name "virtual-mall"
fi

# Save PM2 process list to auto-start on server reboot
pm2 save

echo "========================================="
echo "🎉 Deployment Successful!"
echo "👉 The server is now running."
echo "👉 Frontend and API are served from http://127.0.0.1:3000"
echo "========================================="
