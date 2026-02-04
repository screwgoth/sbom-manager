# SBOM Manager - Product Requirements Document

**Version:** 1.0  
**Date:** 2026-02-04  
**Author:** ScrewMolt  
**Status:** Draft

---

## 1. Executive Summary

SBOM Manager is a web-based application for generating, managing, and analyzing Software Bill of Materials (SBOM) in compliance with CERT-In Technical Guidelines v2.0. The tool helps organizations maintain visibility into their software supply chain, track vulnerabilities, ensure license compliance, and export reports in multiple formats.

---

## 2. Problem Statement

Organizations face increasing pressure to:
- Understand the composition of their software systems
- Track vulnerabilities across dependencies
- Comply with regulatory requirements (CERT-In, EU CRA)
- Manage license risks in open-source components
- Respond quickly to security incidents (e.g., Log4j-style events)

Current solutions are either:
- Too complex and expensive for smaller teams
- Fragmented across multiple tools
- Not aligned with Indian regulatory guidelines

---

## 3. Goals & Objectives

### Primary Goals
1. **Generate SBOMs** from project dependencies (npm, pip, maven, go, etc.)
2. **Store & Version** SBOMs with full history
3. **Track Vulnerabilities** by cross-referencing with NVD/CVE databases
4. **Ensure License Compliance** with policy checks
5. **Export Reports** in CSV, JSON, and Excel formats

### Success Metrics
- Generate SBOM from a project in < 30 seconds
- Support 5+ package ecosystems
- Achieve CERT-In minimum element compliance
- Zero-click vulnerability alerts

---

## 4. Target Users

| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| **Security Engineer** | Monitors vulnerabilities | Alerts, CVE tracking, risk assessment |
| **Developer** | Builds software | Quick scans, CI/CD integration |
| **Compliance Officer** | Ensures regulatory adherence | Audit reports, CERT-In compliance |
| **Procurement Team** | Evaluates vendor software | Vendor SBOM validation |

---

## 5. Features & Requirements

### 5.1 Core Features (MVP)

#### F1: Project Scanner
- **Description:** Scan project directories to detect and parse dependency files
- **Supported Ecosystems:**
  - Node.js (package.json, package-lock.json)
  - Python (requirements.txt, Pipfile, pyproject.toml)
  - Java (pom.xml, build.gradle)
  - Go (go.mod, go.sum)
  - Rust (Cargo.toml)
- **Output:** Structured component list with metadata

#### F2: SBOM Generator
- **Description:** Generate SBOMs compliant with industry standards
- **Formats:**
  - SPDX (JSON, Tag-Value)
  - CycloneDX (JSON, XML)
- **CERT-In Compliance:** Include all 21 minimum data fields
  - Component Name, Version, Description
  - Supplier, License, Origin
  - Dependencies, Vulnerabilities, Patch Status
  - Release Date, EOL Date, Criticality
  - Usage Restrictions, Checksums/Hashes
  - Author, Timestamp, Unique Identifier
  - Executable/Archive/Structured Properties

#### F3: SBOM Repository
- **Description:** Store, version, and manage multiple SBOMs
- **Features:**
  - Project-based organization
  - Version history with diffs
  - Search and filter
  - Tags and metadata

#### F4: Vulnerability Tracker
- **Description:** Cross-reference components with vulnerability databases
- **Data Sources:**
  - National Vulnerability Database (NVD)
  - GitHub Advisory Database
  - OSV (Open Source Vulnerabilities)
- **Features:**
  - Severity scoring (CVSS)
  - Affected version matching
  - Remediation suggestions
  - Alert notifications

#### F5: License Compliance
- **Description:** Analyze and flag license risks
- **Features:**
  - SPDX license identifier mapping
  - License compatibility checking
  - Policy-based alerts (e.g., no GPL in commercial)
  - Unknown license flagging

#### F6: Export Module
- **Description:** Export SBOMs and reports in multiple formats
- **Formats:**
  - **JSON:** Native SPDX/CycloneDX format
  - **CSV:** Flat table with all component fields
  - **Excel (.xlsx):** Formatted workbook with:
    - Summary sheet (project info, stats)
    - Components sheet (full inventory)
    - Vulnerabilities sheet (CVEs, severity)
    - Licenses sheet (compliance status)
    - Conditional formatting for risk levels

### 5.2 Future Features (Post-MVP)

- CI/CD Integration (GitHub Actions, GitLab CI)
- SBOM Diff & Comparison
- Dependency Graph Visualization
- API for programmatic access
- Team collaboration & RBAC
- SBOM Signing & Verification
- Container Image Scanning
- QBOM/CBOM Support (Quantum/Cryptographic BOMs)

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | Node.js (Bun runtime) + Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **Scanning** | Custom parsers + Syft integration |
| **Vulnerability Data** | NVD API + OSV API |
| **Export** | ExcelJS, json2csv |

### 6.2 System Components

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Dashboard│  │Projects │  │ Scanner │  │ Reports │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend API (Hono)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  SBOM   │  │  Vuln   │  │ License │  │ Export  │   │
│  │Generator│  │ Tracker │  │ Checker │  │ Service │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   PostgreSQL    │  │   External APIs (NVD, OSV)  │  │
│  │  - Projects     │  │                             │  │
│  │  - SBOMs        │  │                             │  │
│  │  - Components   │  │                             │  │
│  │  - Vulns Cache  │  │                             │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Data Model (Core Entities)

```
Project
├── id (UUID)
├── name
├── description
├── created_at
└── updated_at

SBOM
├── id (UUID)
├── project_id (FK)
├── version
├── format (spdx/cyclonedx)
├── created_at
├── author
└── raw_content (JSONB)

Component
├── id (UUID)
├── sbom_id (FK)
├── name
├── version
├── supplier
├── license
├── purl (Package URL)
├── checksum_sha256
├── dependencies (JSONB)
└── metadata (JSONB)

Vulnerability
├── id (UUID)
├── cve_id
├── severity
├── cvss_score
├── description
├── affected_versions
├── fixed_version
├── references (JSONB)
└── last_updated

ComponentVulnerability
├── component_id (FK)
├── vulnerability_id (FK)
└── status (open/mitigated/false_positive)
```

---

## 7. User Interface

### 7.1 Key Screens

1. **Dashboard**
   - Project overview cards
   - Vulnerability summary (critical/high/medium/low)
   - Recent scans
   - Quick actions

2. **Project View**
   - SBOM history timeline
   - Component inventory table
   - Vulnerability alerts
   - License breakdown chart

3. **Scanner**
   - Upload/connect project
   - Ecosystem detection
   - Scan progress
   - Results preview

4. **Reports**
   - Export format selection
   - Field customization
   - Download/email options

### 7.2 Design Principles
- Clean, professional interface
- Dark/light mode support
- Responsive (desktop-first)
- Accessible (WCAG 2.1 AA)

---

## 8. Export Specifications

### 8.1 JSON Export
- Native SPDX 2.3 or CycloneDX 1.5 format
- Pretty-printed with 2-space indent
- UTF-8 encoding

### 8.2 CSV Export
| Field | Description |
|-------|-------------|
| component_name | Name of the component |
| component_version | Version string |
| supplier | Vendor/maintainer |
| license | SPDX license ID |
| purl | Package URL |
| checksum | SHA-256 hash |
| vulnerability_count | Number of known CVEs |
| highest_severity | Critical/High/Medium/Low/None |
| release_date | Component release date |
| eol_date | End of life date |

### 8.3 Excel Export

**Sheet 1: Summary**
- Project name, scan date, author
- Total components count
- Vulnerability breakdown by severity
- License distribution

**Sheet 2: Components**
- Full component inventory
- Conditional formatting:
  - Red: Critical vulnerabilities
  - Orange: High vulnerabilities
  - Yellow: Medium vulnerabilities
  - Green: No vulnerabilities

**Sheet 3: Vulnerabilities**
- CVE ID, description, severity
- Affected component
- Fix version (if available)
- References

**Sheet 4: Licenses**
- License name, SPDX ID
- Component count
- Compliance status
- Risk level

---

## 9. Compliance & Standards

### 9.1 CERT-In Alignment
- All 21 minimum data fields supported
- SPDX and CycloneDX format compliance
- Unique identifier (PURL) implementation
- License management with SPDX identifiers

### 9.2 Industry Standards
- SPDX 2.3 specification
- CycloneDX 1.5 specification
- CPE (Common Platform Enumeration)
- PURL (Package URL) specification

---

## 10. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (monorepo structure)
- [ ] Database schema & migrations
- [ ] Basic API scaffolding
- [ ] UI component library setup

### Phase 2: Core Scanner (Week 3-4)
- [ ] Dependency file parsers (npm, pip, maven)
- [ ] SBOM generation (SPDX format)
- [ ] Component storage
- [ ] Basic UI for scanning

### Phase 3: Vulnerability & License (Week 5-6)
- [ ] NVD API integration
- [ ] Vulnerability matching logic
- [ ] License detection & policy engine
- [ ] Dashboard with alerts

### Phase 4: Export & Polish (Week 7-8)
- [ ] JSON/CSV/Excel export
- [ ] Report customization
- [ ] UI polish & responsive design
- [ ] Documentation & testing

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| NVD API rate limits | Delayed vulnerability data | Local caching, OSV fallback |
| Parser accuracy | Missing components | Multiple parser sources, manual override |
| Large project performance | Slow scans | Streaming processing, pagination |
| License detection errors | Compliance gaps | SPDX database, manual review option |

---

## 12. Open Questions

1. Should we support on-premise deployment or SaaS-only?
2. Authentication method: OAuth, email/password, or both?
3. Priority order for package ecosystem support?
4. Freemium model or single pricing tier?

---

## 13. References

- [CERT-In SBOM Guidelines v2.0](https://www.cert-in.org.in)
- [SPDX Specification](https://spdx.github.io/spdx-spec/)
- [CycloneDX Specification](https://cyclonedx.org/specification/)
- [NVD API Documentation](https://nvd.nist.gov/developers)
- [PURL Specification](https://github.com/package-url/purl-spec)

---

*This document is a living specification and will be updated as requirements evolve.*
