# Changelog

All notable changes to the SBOM Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - Migration to Node.js (2026-02-08)
- **Runtime Migration**: Migrated from Bun to Node.js 20 LTS for broader compatibility and ecosystem support
  - Updated all backend scripts to use Node.js with `tsx` for TypeScript execution
  - Replaced Bun.serve() with @hono/node-server for HTTP server
  - Updated all package.json scripts from `bun run` to `npm run`
  - Replaced `bun.lock` with `package-lock.json` for npm dependency management
  - Updated Dockerfiles to use `node:20-alpine` base images
  - Updated docker-compose.yml backend command to use `npx tsx` and `node`
  - Added TypeScript compiler (`tsc`) for production builds
  - Added `tsx` for development with hot reload support
- **Build System**: Switched from Bun's native bundler to TypeScript compiler
  - Backend now compiles to JavaScript in `dist/` directory
  - Frontend build remains unchanged (Vite works with both)
- **Type Safety**: Added proper TypeScript configurations with tsconfig.json
  - Fixed type issues with Hono context variables
  - Improved type safety for Drizzle ORM queries
- **Documentation**: Updated all documentation to reflect Node.js/npm usage
  - README.md prerequisites and installation instructions
  - All command examples throughout documentation
  - Troubleshooting guides and development commands
- **Functionality**: All features remain 100% identical - zero breaking changes
  - All 20+ API endpoints work identically
  - Authentication, scanning, vulnerability tracking unchanged
  - All 5 export formats work identically
  - Docker deployment fully functional

### Technical Migration Details
- Replaced `@types/bun` with `@types/node` and `typescript` packages
- Added proper Hono context typing with Variables interface
- Fixed Drizzle ORM query chaining (`.where().where()` → `and()`)
- Updated all npm scripts for workspace compatibility
- No changes to database schema or migrations
- No changes to API contracts or responses

### Added
- **Multi-File Upload Support**: Scanner now accepts multiple dependency files in a single scan
  - Drag-and-drop interface for easy file selection
  - Visual file preview with individual file removal
  - Support for mixed ecosystems (e.g., npm + python + go in one scan)
  - File type validation and ecosystem detection
  - Detailed scan results showing which files were processed
  - File size and ecosystem badges in preview
  - Combined SBOM output with automatic component deduplication
- New API response fields:
  - `filesProcessed`: Array of processed files with ecosystem and component counts
  - `ecosystems`: Array of all detected ecosystems in the scan
- Comprehensive documentation in `/docs/MULTI_FILE_UPLOAD.md`
- Test script `test-multi-file-upload.sh` for API validation
- Sample test files in `test-multi-upload/` directory

### Changed
- Frontend `Scanner.tsx` component completely redesigned with:
  - File array state management (replaces FileList)
  - Drag-and-drop event handlers
  - File validation logic
  - Enhanced UI with file preview cards
  - Ecosystem summary display
- Backend `scanner-service.ts` enhanced to:
  - Track individual file processing details
  - Return comprehensive scan metadata
  - Support multiple ecosystems in one operation
- `ScanResult` interface extended with optional fields for detailed reporting

### Improved
- User experience with visual feedback during file selection
- Scanner UI now clearly indicates multi-file support
- Better error messages for invalid file types
- Results display shows per-file statistics

### Technical Details
- Files are validated client-side before upload
- Supported file patterns: package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, and more
- Components are deduplicated by name@version across all files
- Primary ecosystem is determined from first processed file
- Files can be removed individually before scanning

## [1.0.0] - 2024-02-07

### Phase 4 Complete
- JWT authentication with user registration/login
- Docker deployment with docker-compose
- SPDX JSON/XML/YAML export
- CycloneDX JSON/XML export  
- CSV/Excel export for components and vulnerabilities
- Production-ready deployment scripts
- Comprehensive testing suite

### Phase 3 Complete
- Vulnerability scanning via NVD and OSV APIs
- License compliance tracking with policy engine
- Enhanced dashboard with vulnerability and license summaries
- Real-time vulnerability scanning after SBOM generation
- 24-hour caching for API responses

### Phase 2 Complete
- SBOM generation for 5 ecosystems (npm, Python, Java, Go, Rust)
- SPDX 2.3 compliant output
- 12 supported dependency file formats
- CERT-In compliance with all 21 minimum data fields

### Phase 1 Complete
- PostgreSQL database with Drizzle ORM
- REST API with Hono
- React frontend with TypeScript
- Project and SBOM management

---

## Release Notes

### Multi-File Upload Feature (Current)

This release introduces comprehensive multi-file upload support, allowing users to:

1. **Upload multiple files simultaneously** via drag-and-drop or file selection
2. **Mix ecosystems** in a single scan (e.g., analyze a full-stack project with frontend and backend dependencies)
3. **Preview selected files** with ecosystem detection before scanning
4. **Remove individual files** from the upload queue
5. **View detailed results** showing which files contributed which components

**Use Cases:**
- Full-stack projects with multiple package managers
- Monorepos with multiple sub-projects
- Projects with both production and development dependencies in separate files
- Cross-platform applications using multiple language ecosystems

**Breaking Changes:** None - fully backward compatible

**Migration:** No migration needed - existing single-file uploads continue to work

**Testing:**
```bash
# Run the multi-file upload test script
./test-multi-file-upload.sh

# Or manually test with sample files
curl -X POST http://localhost:3000/api/scanner/scan/upload \
  -F "projectId=test-123" \
  -F "projectName=multi-test" \
  -F "file0=@test-multi-upload/package.json" \
  -F "file1=@test-multi-upload/requirements.txt" \
  -F "file2=@test-multi-upload/go.mod"
```

**Documentation:** See [docs/MULTI_FILE_UPLOAD.md](./docs/MULTI_FILE_UPLOAD.md) for detailed usage guide

---

[1.0.0]: https://github.com/screwgoth/sbom-manager/releases/tag/v1.0.0
[Unreleased]: https://github.com/screwgoth/sbom-manager/compare/v1.0.0...HEAD
