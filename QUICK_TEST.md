# 🧪 Quick Testing Guide

## One-Command Deploy & Test

```bash
# 1. Deploy
docker compose up -d

# 2. Wait for services (60 seconds)
sleep 60

# 3. Verify
./verify-deployment.sh
```

---

## Manual Testing Checklist

### ✅ 1. Authentication Flow

**Registration**:
1. Open http://localhost
2. Click "Create an account"
3. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User` (optional)
4. Click "Create account"
5. **Expected**: Redirected to dashboard, logged in

**Logout**:
1. Click "Logout" in header
2. **Expected**: Redirected to login page

**Login**:
1. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
2. Click "Sign in"
3. **Expected**: Redirected to dashboard, logged in

**Protected Routes**:
1. Log out
2. Try accessing http://localhost/dashboard
3. **Expected**: Redirected to login page

---

### ✅ 2. SBOM Generation

1. Login
2. Click "Projects" → "New Project"
3. Create project:
   - Name: `Test Project`
   - Description: `Testing SBOM generation`
4. Click "Scanner" in navigation
5. Select "Upload Files"
6. Upload test files:
   - `test-projects/nodejs-sample/package.json`
   - `test-projects/nodejs-sample/package-lock.json`
7. Select project: `Test Project`
8. Click "Generate SBOM"
9. **Expected**: SBOM created, redirected to project detail

---

### ✅ 3. Vulnerability Scanning

1. In project detail, find the SBOM
2. Click "Scan Vulnerabilities"
3. Wait for scan to complete
4. **Expected**: Vulnerability summary appears with counts

---

### ✅ 4. Export Testing

For the SBOM just created, test each export format:

**CSV Export**:
1. Click "Export" dropdown
2. Select "📄 CSV"
3. **Expected**: CSV file downloads

**Excel Export**:
1. Click "Export" dropdown
2. Select "📊 Excel (.xlsx)"
3. **Expected**: Excel file downloads
4. Open in Excel: Should have Summary + Components sheets

**JSON Export**:
1. Click "Export" dropdown
2. Select "📦 JSON"
3. **Expected**: JSON file downloads
4. Open in text editor: Should have full SBOM data

**SPDX Export**:
1. Click "Export" dropdown
2. Select "🔒 SPDX 2.3"
3. **Expected**: JSON file downloads
4. Validate: Should be valid SPDX 2.3 format

**CycloneDX Export**:
1. Click "Export" dropdown
2. Select "🔄 CycloneDX 1.5"
3. **Expected**: JSON file downloads
4. Validate: Should be valid CycloneDX 1.5 format

---

### ✅ 5. License Analysis

1. In SBOM detail, scroll to "License Summary"
2. **Expected**: 
   - Risk distribution (Low, Medium, High, Unknown)
   - Total components with licenses
   - Policy violation alerts (if any)

---

### ✅ 6. Multi-User Testing

**Create Second User**:
1. Logout
2. Register new user:
   - Email: `user2@example.com`
   - Password: `password456`
3. **Expected**: New user logged in, empty dashboard

**Verify Isolation**:
1. **Expected**: User 2 should NOT see User 1's projects
2. Create a project as User 2
3. Logout and login as User 1
4. **Expected**: User 1 should NOT see User 2's project

---

## API Testing (curl)

### Health Check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","database":"connected"}
```

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "password789",
    "name": "API User"
  }'
# Expected: {"success":true,"user":{...},"token":"..."}
```

### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "password789"
  }'
# Expected: {"success":true,"user":{...},"token":"..."}
```

### Get Protected Resource (Projects)
```bash
# Replace YOUR_TOKEN with actual token from login
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: {"projects":[...]}
```

### Test Unauthorized Access
```bash
curl http://localhost:3000/api/projects
# Expected: {"error":"Unauthorized - No token provided"}
```

---

## Docker Testing

### Check Service Health
```bash
docker compose ps
# All services should be "Up (healthy)"
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Test Database Connection
```bash
docker compose exec postgres psql -U sbom_user -d sbom_manager -c "\dt"
# Should show tables: users, projects, sboms, components, vulnerabilities, etc.
```

### Test Backend Health
```bash
docker compose exec backend wget -qO- http://localhost:3000/api/health
# Expected: {"status":"ok","database":"connected"}
```

### Test Frontend Health
```bash
docker compose exec frontend wget -qO- http://localhost/health
# Expected: healthy
```

---

## Performance Testing

### SBOM Generation Speed
1. Upload large project (e.g., 100+ dependencies)
2. Measure time to generate SBOM
3. **Expected**: < 5 seconds for most projects

### Vulnerability Scan Speed
1. Scan SBOM with 50+ components
2. Measure time to complete scan
3. **Expected**: < 30 seconds (with caching)

### Export Speed
1. Export large SBOM as Excel
2. Measure download time
3. **Expected**: < 3 seconds

---

## Data Persistence Testing

### Test 1: Restart Services
```bash
# Stop services
docker compose down

# Start again
docker compose up -d

# Wait for health
sleep 60

# Login with existing user
# Expected: All data intact (users, projects, SBOMs)
```

### Test 2: Database Backup
```bash
# Backup database
docker compose exec postgres pg_dump -U sbom_user sbom_manager > backup.sql

# Stop everything
docker compose down -v

# Start fresh
docker compose up -d
sleep 60

# Restore
docker compose exec -T postgres psql -U sbom_user sbom_manager < backup.sql

# Login
# Expected: All data restored
```

---

## Common Issues & Solutions

### Issue: Backend won't start
```bash
# Check logs
docker compose logs backend

# Common fix: Wait for database
docker compose restart backend
```

### Issue: Frontend shows blank page
```bash
# Check if backend is accessible
curl http://localhost:3000/api/health

# Check frontend logs
docker compose logs frontend
```

### Issue: "Invalid token" errors
```bash
# Solution: Logout and login again
# JWT tokens expire after 7 days
```

### Issue: Export downloads empty file
```bash
# Check backend logs
docker compose logs backend

# Verify SBOM exists
curl http://localhost:3000/api/sboms/SBOM_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Success Indicators

✅ **All services healthy** - `docker compose ps` shows all UP (healthy)  
✅ **User can register** - New account created successfully  
✅ **User can login** - JWT token received, dashboard loads  
✅ **Protected routes work** - Redirects to login when not authenticated  
✅ **SBOM generation works** - Files uploaded, SBOM created  
✅ **Vulnerability scan works** - Summary shows vulnerability counts  
✅ **All 5 exports work** - CSV, Excel, JSON, SPDX, CycloneDX download  
✅ **License analysis works** - Risk distribution displayed  
✅ **Data persists** - Survives service restart  
✅ **Multi-user isolation** - Users can't see each other's projects  

---

## Test Completion Report

After testing, document:

- [ ] Authentication tested (register, login, logout, protected routes)
- [ ] SBOM generation tested (upload, scan, view)
- [ ] Vulnerability scanning tested (NVD/OSV integration)
- [ ] All 5 export formats tested (CSV, Excel, JSON, SPDX, CDX)
- [ ] License analysis tested (risk calculation, policy violations)
- [ ] Multi-user isolation tested
- [ ] Data persistence tested (restart, backup/restore)
- [ ] Performance acceptable (< 5s SBOM gen, < 30s vuln scan)
- [ ] Docker deployment working (one-command up)
- [ ] Health checks passing for all services

**If all checked**: ✅ **Phase 4 fully validated!**

---

**Need help?** Check:
- DOCKER_SETUP.md - Deployment troubleshooting
- README.md - Architecture and API docs
- PHASE4_COMPLETE.md - Implementation details
