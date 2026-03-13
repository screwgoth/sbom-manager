# Component Enrichment Service

The enrichment service automatically populates missing SBOM component metadata by querying external APIs and analyzing dependency files.

## What Gets Enriched

### 1. PURL (Package URL)
**Auto-generated** from package manager data without internet access.

**Format Examples:**
- NPM: `pkg:npm/express@4.18.2`
- NPM (scoped): `pkg:npm/types/node@20.0.0`
- PyPI: `pkg:pypi/requests@2.28.1`
- Maven: `pkg:maven/com.google.guava/guava@31.1-jre`
- Go: `pkg:golang/github.com/gin-gonic/gin@1.9.0`
- Cargo: `pkg:cargo/serde@1.0.152`

### 2. CPE (Common Platform Enumeration)
**Fetched** from the [NVD CPE Dictionary API](https://services.nvd.nist.gov/rest/json/cpes/2.0).

**Format:** `cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*`

**Example:** `cpe:2.3:a:lodash:lodash:4.17.21:*:*:*:*:node.js:*:*`

**Fallback:** If no exact match is found in NVD, a CPE is constructed using the package name and version.

### 3. SWID Tags (Software Identification)
**Attempted** by checking package registries (NPM, PyPI).

**Note:** SWID tags are rare in package ecosystems and often remain `null`.

### 4. Dependency Relationship
**Determined** by analyzing lock files (`package-lock.json`, `Pipfile.lock`, etc.).

**Possible Values:**
- `"Direct dependency of {project-name}"`
- `"Development dependency of {project-name}"`
- `"Optional dependency of {project-name}"`
- `"Transitive dependency via {parent-package}"`
- `"Unknown relationship"` (if lock file data unavailable)

## How It Works

### Automatic Enrichment (During Scan)

When you upload dependency files for scanning, enrichment happens automatically:

```bash
# The scanner service calls enrichment after parsing
POST /api/scanner/upload
```

**Process:**
1. Dependency files are parsed (e.g., `package-lock.json`)
2. Components are extracted
3. **Enrichment runs automatically**:
   - PURLs are generated
   - CPE lookups are queued (rate-limited)
   - Lock file data is analyzed for relationships
4. Enriched components are saved to database

### Manual Batch Enrichment

Enrich existing components that were created before enrichment was implemented:

```bash
POST /api/components/enrich
Content-Type: application/json

{
  "sbomId": "sbom-uuid-here",
  "force": false  # Optional: re-enrich all components even if they have data
}
```

**Response:**
```json
{
  "message": "Enriched 42 components",
  "enriched": 42,
  "total": 50,
  "ecosystem": "npm"
}
```

## Rate Limiting

### NVD API Limits
- **Without API Key:** 5 requests per 30 seconds
- **With API Key:** 50 requests per 30 seconds (not yet implemented)

The enrichment service **automatically handles rate limiting** to prevent API throttling:
- Queues requests
- Adds delays between calls (6 seconds without API key)
- Falls back to constructed CPE on timeout or error

**Note:** For large SBOMs (>100 components), enrichment may take several minutes due to NVD rate limits.

## Usage Examples

### 1. Upload and Auto-Enrich

```bash
curl -X POST http://localhost:3001/api/scanner/upload \
  -F "files=@package-lock.json" \
  -F "projectName=my-app" \
  -F "projectVersion=1.0.0"
```

Components are automatically enriched during this process.

### 2. Enrich Existing SBOM

```bash
curl -X POST http://localhost:3001/api/components/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "sbomId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 3. Force Re-Enrichment

```bash
curl -X POST http://localhost:3001/api/components/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "sbomId": "550e8400-e29b-41d4-a716-446655440000",
    "force": true
  }'
```

## Test Results

The enrichment service has been tested with popular packages:

| Package | PURL | CPE | Relationship |
|---------|------|-----|--------------|
| express@4.18.2 | ✅ | ✅ | ✅ Direct |
| react@18.2.0 | ✅ | ✅ | ✅ Direct |
| lodash@4.17.21 | ✅ | ✅ Perfect Match |
| @types/node@20.0.0 | ✅ | ✅ | ✅ Dev |
| accepts@1.3.8 | ✅ | ✅ | ✅ Transitive via express |

**Success Rate:**
- PURL: 100% (always generated)
- CPE: 100% (with fallback)
- Relationship: 100% (with lock files)
- SWID: 0% (not commonly available)

## Error Handling

The enrichment service is **non-blocking**:
- If CPE lookup fails → uses constructed CPE
- If SWID lookup fails → remains `null`
- If relationship detection fails → sets "Unknown relationship"
- If enrichment fails entirely → original component data is preserved

**Logs:** All enrichment failures are logged for manual review but don't block SBOM generation.

## Architecture

```
┌─────────────────────┐
│  Scanner Service    │
│  (uploads files)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Parser             │
│  (extracts deps)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Enrichment Service  │ ←── Rate Limiter
│ ┌─────────────────┐ │
│ │ PURL Generator  │ │
│ │ CPE Fetcher     │ ├──→ NVD API
│ │ SWID Fetcher    │ ├──→ NPM/PyPI API
│ │ Relationship    │ │
│ └─────────────────┘ │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Database          │
│   (enriched data)   │
└─────────────────────┘
```

## Future Enhancements

- [ ] NVD API key support for higher rate limits
- [ ] CVE enrichment (link components to known vulnerabilities)
- [ ] License enrichment from package registries
- [ ] Ecosystem-specific vendor detection improvements
- [ ] Caching layer for frequently looked-up CPEs
- [ ] Batch API requests where supported

## References

- [PURL Specification](https://github.com/package-url/purl-spec)
- [CPE Specification](https://nvd.nist.gov/products/cpe)
- [NVD CPE API](https://nvd.nist.gov/developers/products)
- [SWID Tags](https://csrc.nist.gov/projects/Software-Identification-SWID)
