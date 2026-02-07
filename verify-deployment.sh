#!/bin/bash

# SBOM Manager Deployment Verification Script
echo "🔍 SBOM Manager - Deployment Verification"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✅ Docker is installed"

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available"
    echo "   Please install Docker Compose"
    exit 1
fi
echo "✅ Docker Compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from .env.example"
    cp .env.example .env
    echo "   Please edit .env and set JWT_SECRET to a secure value"
fi
echo "✅ Environment file exists"

echo ""
echo "📦 Building Docker images..."
docker compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi
echo "✅ Docker images built successfully"

echo ""
echo "🚀 Starting services..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services"
    exit 1
fi
echo "✅ Services started"

echo ""
echo "⏳ Waiting for services to be healthy (60 seconds)..."
sleep 60

echo ""
echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
    echo "   Check logs: docker compose logs backend"
fi

# Check frontend
if curl -f http://localhost/health &> /dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
    echo "   Check logs: docker compose logs frontend"
fi

# Check database
if docker compose exec -T postgres pg_isready -U sbom_user &> /dev/null; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is not responding"
    echo "   Check logs: docker compose logs postgres"
fi

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🌐 Access Points:"
echo "   Frontend:      http://localhost"
echo "   Backend API:   http://localhost:3000/api"
echo "   Reverse Proxy: http://localhost:8080"
echo ""
echo "📝 Next Steps:"
echo "   1. Open http://localhost in your browser"
echo "   2. Click 'Create an account'"
echo "   3. Register with your email and password"
echo "   4. Start using SBOM Manager!"
echo ""
echo "📖 Documentation:"
echo "   - Docker Setup: DOCKER_SETUP.md"
echo "   - Main README: README.md"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:    docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Restart:      docker compose restart"
echo ""
echo "✨ Deployment verification complete!"
