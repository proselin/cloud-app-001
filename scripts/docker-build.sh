#!/bin/bash

# Build and run script for Docker containers
set -e

echo "🐳 Building Cloud App containers..."

# Build the images
echo "📦 Building humid (NestJS backend)..."
docker build -f apps/humid/Dockerfile -t cloud-humid:latest .

echo "📦 Building cloud (Angular frontend)..."
docker build -f apps/cloud/Dockerfile -t cloud-frontend:latest .

echo "✅ All images built successfully!"

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running docker-compose"
fi

echo "🚀 Ready to run with: docker-compose up -d"
echo "🔧 Or run in development mode with: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up"
