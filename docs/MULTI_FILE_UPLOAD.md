# Multi-File Upload Feature

## Overview

The SBOM Manager scanner now supports uploading and scanning multiple dependency files in a single operation. This allows you to analyze projects with multiple ecosystems or multiple dependency files from the same ecosystem.

## Features

### 🎯 Key Capabilities

1. **Multiple File Selection**: Upload multiple dependency files at once
2. **Drag & Drop Support**: Drag files directly into the upload zone
3. **Mixed Ecosystems**: Scan files from different package managers in one scan (e.g., package.json + requirements.txt + go.mod)
4. **File Validation**: Automatically validates that uploaded files are supported dependency files
5. **Visual Preview**: See all selected files before scanning with:
   - File name and size
   - Detected ecosystem type
   - Ability to remove individual files
6. **Detailed Results**: View which files were processed and how many components were found in each

### 📋 Supported File Types

The scanner accepts the following dependency files:

| Ecosystem | Supported Files |
|-----------|----------------|
| **Node.js/npm** | package.json, package-lock.json |
| **Python** | requirements.txt, Pipfile, Pipfile.lock, pyproject.toml |
| **Java** | pom.xml, build.gradle, build.gradle.kts |
| **Go** | go.mod, go.sum |
| **Rust** | Cargo.toml, Cargo.lock |

## How to Use

### Option 1: Click to Upload

1. Navigate to the Scanner page
2. Ensure "Upload Files" mode is selected
3. Click the upload zone (or the hidden file input is triggered)
4. Select one or more dependency files from your file system
5. Valid files will appear in the preview list
6. Remove any unwanted files using the ❌ button
7. Fill in project information
8. Click "Start Scan"

### Option 2: Drag and Drop

1. Navigate to the Scanner page
2. Drag one or more dependency files from your file manager
3. Drop them onto the upload zone (it will highlight in blue)
4. Valid files will appear in the preview list
5. Remove any unwanted files if needed
6. Fill in project information
7. Click "Start Scan"

## Use Cases

### Mixed Ecosystem Project

If your project uses multiple technologies (e.g., a Python backend with a Node.js frontend):

```
Files to upload:
- backend/requirements.txt (Python dependencies)
- frontend/package.json (Node.js dependencies)
```

The scanner will:
- Parse both files
- Combine all components into a single SBOM
- Show both ecosystems in the results

### Multiple Files Same Ecosystem

If you have multiple dependency files from the same ecosystem:

```
Files to upload:
- services/api/package.json
- services/worker/package.json
- frontend/package.json
```

The scanner will:
- Parse all package.json files
- Deduplicate components (same package@version only appears once)
- Generate a unified SBOM

## API Changes

### Backend Endpoint

**Endpoint**: `POST /api/scanner/scan/upload`

**Request**: `multipart/form-data` with multiple files

```
Content-Type: multipart/form-data
--boundary
Content-Disposition: form-data; name="projectId"

project-123
--boundary
Content-Disposition: form-data; name="projectName"

my-project
--boundary
Content-Disposition: form-data; name="file0"; filename="package.json"
Content-Type: application/json

{file content}
--boundary
Content-Disposition: form-data; name="file1"; filename="requirements.txt"
Content-Type: text/plain

{file content}
--boundary--
```

**Response**:

```json
{
  "success": true,
  "result": {
    "sbomId": "123e4567-e89b-12d3-a456-426614174000",
    "ecosystem": "npm",
    "componentsCount": 42,
    "filesProcessed": [
      {
        "fileName": "package.json",
        "ecosystem": "npm",
        "componentCount": 25
      },
      {
        "fileName": "requirements.txt",
        "ecosystem": "python",
        "componentCount": 17
      }
    ],
    "ecosystems": ["npm", "python"]
  }
}
```

## Technical Implementation

### Frontend Changes

- **Scanner.tsx**: Enhanced with:
  - File array state management instead of FileList
  - Drag-and-drop event handlers
  - File validation logic
  - Ecosystem detection
  - Individual file removal
  - Visual file preview component

### Backend Changes

- **scanner-service.ts**: Enhanced to:
  - Track each file processed
  - Record ecosystem and component count per file
  - Return detailed processing results
  - Support multiple ecosystems in one scan

- **types.ts**: Extended `ScanResult` interface:
  ```typescript
  interface ScanResult {
    // ... existing fields
    filesProcessed?: Array<{
      fileName: string;
      ecosystem: string;
      componentCount: number;
    }>;
    ecosystems?: string[];
  }
  ```

## Testing

### Test Files Included

The `test-multi-upload/` directory contains sample files for testing:

- `package.json` - Node.js dependencies
- `requirements.txt` - Python dependencies
- `go.mod` - Go dependencies

### Test Scenarios

1. **Single Ecosystem, Multiple Files**
   - Upload: 2 different package.json files
   - Expected: Combined SBOM with deduplicated components

2. **Mixed Ecosystems**
   - Upload: package.json + requirements.txt + go.mod
   - Expected: Combined SBOM, multiple ecosystems detected

3. **Invalid Files Mixed In**
   - Upload: package.json + random.txt + image.jpg
   - Expected: Only package.json accepted, others rejected with warning

4. **Large File Count**
   - Upload: 10+ dependency files
   - Expected: All processed, results shown correctly

## Known Limitations

1. **File Size**: Individual files should be under 10MB
2. **Total Files**: Recommend maximum 20 files per scan
3. **Ecosystem Detection**: Uses the first detected ecosystem as "primary" for SBOM metadata
4. **Component Deduplication**: Only deduplicates exact name@version matches

## Future Enhancements

- [ ] Progress indicator for large file processing
- [ ] Ecosystem-based grouping in results
- [ ] Export individual SBOMs per ecosystem
- [ ] Support for compressed archives (zip/tar)
- [ ] Drag-and-drop entire directories
- [ ] File content preview before scan

## Troubleshooting

### Files Not Being Accepted

**Problem**: Dragging files shows no preview

**Solution**:
- Ensure files are recognized dependency files (check supported file types)
- Check file names match expected patterns (case-sensitive)
- Try clicking the upload zone instead

### Scan Fails with Multiple Files

**Problem**: Error message "Failed to parse [filename]"

**Solution**:
- Check file is valid JSON/text format
- Ensure file content matches its name (e.g., package.json contains valid JSON)
- Try scanning files individually to identify problematic file

### Components Not Deduplicating

**Problem**: Same package appears multiple times

**Solution**:
- This is expected if different versions are in different files
- Only exact name@version matches are deduplicated
- Check that package versions are actually identical

## Support

For issues or questions:
1. Check this documentation
2. Review test scenarios in `test-multi-upload/`
3. Check browser console for detailed errors
4. Review server logs for backend issues
