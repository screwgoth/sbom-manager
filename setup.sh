#!/bin/bash

# SBOM Manager - Setup Script
# This script automates the initial setup of the SBOM Manager application

set -e

echo "🚀 SBOM Manager - Phase 1 Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install Bun first:${NC}"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo -e "${GREEN}✓ Bun is installed${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
echo ""

echo "Installing root dependencies..."
bun install

echo "Installing backend dependencies..."
cd backend && bun install && cd ..

echo "Installing frontend dependencies..."
cd frontend && bun install && cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check for PostgreSQL
echo ""
echo "🗄️  Checking database..."
echo ""

if command -v docker &> /dev/null || command -v docker-compose &> /dev/null; then
    echo "Docker detected. You can start PostgreSQL with:"
    echo "   docker compose up -d"
    echo ""
    read -p "Start PostgreSQL now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose up -d
        echo -e "${GREEN}✓ PostgreSQL started${NC}"
        echo "Waiting for database to be ready..."
        sleep 5
    fi
elif command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed locally${NC}"
    echo "Make sure the database is running and configured in backend/.env"
else
    echo -e "${YELLOW}⚠️  PostgreSQL not detected${NC}"
    echo "Please install PostgreSQL or Docker to continue"
    echo "See README.md for installation instructions"
    exit 1
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
echo ""

cd backend

if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

bun run db:migrate

echo -e "${GREEN}✓ Database migrations completed${NC}"

cd ..

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env file..."
    cp frontend/.env.example frontend/.env
fi

# Final instructions
echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && bun run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && bun run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "4. Test the health endpoint:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "📚 For more information, see README.md"
echo ""
