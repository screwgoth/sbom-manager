# SBOM Manager

A comprehensive web-based application for generating, managing, and analyzing Software Bill of Materials (SBOM) in compliance with CERT-In Technical Guidelines v2.0.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Bun + Hono (Node.js API framework)
- **Database**: PostgreSQL + Drizzle ORM
- **Monorepo**: Bun workspaces

### Project Structure
```
sbom-manager/
├── backend/           # Hono API server
│   ├── src/
│   │   ├── db/       # Database schema & migrations
│   │   ├── routes/   # API routes
│   │   └── index.ts  # Main server file
│   └── drizzle/      # Generated SQL migrations
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities & API client
│   │   └── App.tsx      # Main app component
│   └── public/
├── docker-compose.yml   # PostgreSQL container
└── PRD.md              # Product Requirements Document
```

## 🚀 Phase 1: Foundation (COMPLETE)

### ✅ Completed Tasks

1. **Monorepo Structure**
   - Set up Bun workspaces with frontend and backend
   - Configured shared dependencies and build scripts

2. **Backend (Bun + Hono)**
   - Initialized Hono server with middleware (CORS, logger, prettyJSON)
   - Created API route structure:
     - `/api/health` - System health check
     - `/api/projects` - Project CRUD operations
     - `/api/sboms` - SBOM management
     - `/api/components` - Component tracking
     - `/api/vulnerabilities` - Vulnerability management
   - Configured environment variables

3. **Database (PostgreSQL + Drizzle ORM)**
   - Designed complete schema per PRD section 6.3:
     - `projects` - Project information
     - `sboms` - SBOM versions and metadata
     - `components` - Software components with CERT-In compliance fields
     - `vulnerabilities` - CVE tracking
     - `component_vulnerabilities` - Junction table for many-to-many
   - Generated SQL migrations
   - Set up Drizzle ORM with relations

4. **Frontend (React + TypeScript + Vite)**
   - Initialized Vite project with React 18 and TypeScript
   - Configured Tailwind CSS for styling
   - Integrated shadcn/ui components
   - Set up React Router for navigation
   - Configured TanStack Query for data fetching
   - Created core pages:
     - Dashboard - Overview and system status
     - Projects - Project listing and management
     - ProjectDetail - Individual project view
   - Built reusable Layout component with navigation

5. **API Client & State Management**
   - Created centralized API client with axios
   - Set up TanStack Query for caching and mutations
   - Implemented all API endpoints for CRUD operations

6. **Environment Configuration**
   - Docker Compose for PostgreSQL
   - Environment variable templates (.env.example)
   - Development configuration for both frontend and backend

## 📋 Prerequisites

Before starting, ensure you have:

- **Bun** >= 1.3.0 ([Install Bun](https://bun.sh))
- **Docker** (for PostgreSQL) OR **PostgreSQL** >= 14 installed locally
- **Node.js** >= 18 (comes with Bun)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd /home/ubuntu/.openclaw/workspace/sbom-manager

# Install root dependencies
bun install

# Install backend dependencies
cd backend && bun install

# Install frontend dependencies
cd ../frontend && bun install
```

### 2. Start PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
# From the project root
docker compose up -d

# Verify database is running
docker compose ps
```

**Option B: Using Local PostgreSQL**

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE USER sbom_user WITH PASSWORD 'sbom_password';
CREATE DATABASE sbom_manager OWNER sbom_user;
GRANT ALL PRIVILEGES ON DATABASE sbom_manager TO sbom_user;
\q
```

### 3. Run Database Migrations

```bash
cd backend
bun run db:migrate
```

### 4. Start Development Servers

**Terminal 1: Backend API**
```bash
cd backend
bun run dev
# Backend will run on http://localhost:3000
```

**Terminal 2: Frontend Dev Server**
```bash
cd frontend
bun run dev
# Frontend will run on http://localhost:5173
```

**Alternatively: Start Both Together**
```bash
# From project root
bun run dev
```

### 5. Verify Installation

1. **Check Backend Health**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-07T04:24:00.000Z",
     "database": "connected"
   }
   ```

2. **Open Frontend**
   - Navigate to http://localhost:5173
   - You should see the SBOM Manager dashboard
   - System status should show "All systems operational"

## 🧪 Testing the Application

### Create a Test Project

1. Go to http://localhost:5173/projects
2. Click "New Project"
3. Enter:
   - **Name**: Test SBOM Project
   - **Description**: My first SBOM project
4. Click "Create Project"
5. You should see the project in the list
6. Click on the project to view details

### Test API Endpoints

```bash
# Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Project",
    "description": "Created via API"
  }'

# Get all projects
curl http://localhost:3000/api/projects

# Get project by ID
curl http://localhost:3000/api/projects/{PROJECT_ID}
```

## 📊 Database Schema

### Tables Created

- **projects** - Store project metadata
- **sboms** - Version-controlled SBOM documents
- **components** - Software components with CERT-In required fields
- **vulnerabilities** - CVE database
- **component_vulnerabilities** - Links components to vulnerabilities

### Key Features

- UUID primary keys for all tables
- Cascade deletes for data integrity
- JSONB fields for flexible metadata storage
- Enums for controlled values (severity, format, status)
- Timestamp tracking (created_at, updated_at)
- Full relational support via Drizzle ORM

## 🔧 Development Commands

### Backend

```bash
cd backend

bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run start        # Start production server
bun run db:generate  # Generate new migrations
bun run db:migrate   # Run pending migrations
bun run db:studio    # Open Drizzle Studio (DB GUI)
```

### Frontend

```bash
cd frontend

bun run dev          # Start Vite dev server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint
```

## 📁 Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://sbom_user:sbom_password@localhost:5432/sbom_manager
PORT=3000
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## 🎯 What's Working

✅ Full monorepo setup with Bun workspaces
✅ Hono backend API with all CRUD routes
✅ PostgreSQL database with complete schema
✅ Database migrations generated and ready
✅ React frontend with Tailwind CSS
✅ Dashboard with system health monitoring
✅ Project management (create, list, view, delete)
✅ API client with TanStack Query integration
✅ Responsive UI with shadcn/ui styling
✅ Docker Compose for easy database setup
✅ Environment configuration

## 🔜 Next Steps: Phase 2 (Core Scanner)

Phase 1 foundation is now complete! The next phase will implement:

1. **Dependency File Parsers**
   - Node.js (package.json, package-lock.json)
   - Python (requirements.txt, Pipfile, pyproject.toml)
   - Java (pom.xml, build.gradle)
   - Go (go.mod)
   - Rust (Cargo.toml)

2. **SBOM Generation**
   - SPDX format generator
   - CycloneDX format generator
   - CERT-In compliance validation
   - Component extraction and storage

3. **Scanner UI**
   - File upload interface
   - Project directory scanner
   - Progress tracking
   - Results preview

4. **Component Storage**
   - Bulk component insertion
   - Dependency graph parsing
   - Metadata enrichment

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps  # If using Docker
sudo systemctl status postgresql  # If using local PostgreSQL

# Check connection manually
psql -h localhost -U sbom_user -d sbom_manager

# Reset database (WARNING: deletes all data)
docker compose down -v  # If using Docker
docker compose up -d
cd backend && bun run db:migrate
```

### Port Conflicts

If ports 3000 or 5173 are in use:

```bash
# Backend: Change PORT in backend/.env
PORT=3001

# Frontend: Update vite.config.ts server.port
```

### Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf bun.lockb
bun install
```

## 📚 Additional Resources

- [PRD (Product Requirements Document)](./PRD.md)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Bun Documentation](https://bun.sh/docs)
- [SPDX Specification](https://spdx.github.io/spdx-spec/)
- [CERT-In Guidelines](https://www.cert-in.org.in)

## 📝 License

[Add your license here]

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 🚀
