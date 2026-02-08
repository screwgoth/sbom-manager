# Quick Start: Multi-File Upload

## 🚀 TL;DR

Upload multiple dependency files at once to generate a unified SBOM.

## ⚡ 60-Second Guide

### Step 1: Navigate to Scanner
```
http://localhost:5173/scanner
```

### Step 2: Select Project
- Choose existing project or enter new project name
- Fill in version and author (optional)

### Step 3: Upload Files (Choose One)

**Option A: Drag & Drop** 🖱️
1. Drag files from your file manager
2. Drop onto the blue upload zone
3. See files appear in preview list

**Option B: Click to Select** 📁
1. Click the upload zone
2. Select multiple files (Ctrl/Cmd + Click)
3. Click "Open"

### Step 4: Review & Scan
1. Check the file preview list
2. Remove unwanted files with ❌ button
3. Verify detected ecosystems
4. Click "Start Scan"

### Step 5: View Results
- See total components found
- Review which files were processed
- Check detected ecosystems
- Click "View Results" for detailed analysis

---

## 📦 Example: Full-Stack Project

### Scenario
You have a full-stack project with:
- React frontend (package.json)
- Python backend (requirements.txt)
- Go microservice (go.mod)

### Upload All Three
```bash
# Files to select:
frontend/package.json
backend/requirements.txt
services/api/go.mod
```

### Result
✅ One unified SBOM with:
- All npm packages from frontend
- All Python packages from backend
- All Go modules from microservice
- Automatic deduplication of shared dependencies

---

## 🎯 Common Scenarios

### Scenario 1: Monorepo with Multiple package.json Files
```
workspace/
  ├── apps/web/package.json
  ├── apps/mobile/package.json
  └── packages/shared/package.json
```
**Action**: Upload all 3 files → Get combined dependency list

### Scenario 2: Project with Lock Files
```
project/
  ├── package.json
  └── package-lock.json
```
**Action**: Upload both → More accurate version info

### Scenario 3: Multi-Language Project
```
project/
  ├── frontend/package.json
  ├── backend/requirements.txt
  └── scripts/go.mod
```
**Action**: Upload all 3 → Multi-ecosystem SBOM

---

## ✅ Supported Files Checklist

### Node.js / npm
- [ ] package.json
- [ ] package-lock.json

### Python
- [ ] requirements.txt
- [ ] Pipfile
- [ ] Pipfile.lock
- [ ] pyproject.toml

### Java
- [ ] pom.xml
- [ ] build.gradle
- [ ] build.gradle.kts

### Go
- [ ] go.mod
- [ ] go.sum

### Rust
- [ ] Cargo.toml
- [ ] Cargo.lock

---

## 🛡️ File Validation

### What Happens When You Upload?

**Valid Files** ✅
- Added to preview list
- Ecosystem detected automatically
- File size shown

**Invalid Files** ❌
- Rejected with warning message
- Not added to preview
- List of supported files shown

### Example Invalid Files:
- `README.md` - Not a dependency file
- `config.json` - Wrong file type
- `image.png` - Not text-based

---

## 🎨 UI Features

### Visual Indicators

**Upload Zone**
- 🔵 Blue border when dragging files
- 📁 File icon and instructions
- Click anywhere to select files

**File Preview Cards**
- 📄 File name and size
- 🏷️ Ecosystem badge (NPM, PYTHON, GO, etc.)
- ❌ Remove button
- Color-coded by ecosystem

**Ecosystem Summary**
- Shows all detected ecosystems
- Highlights when multiple ecosystems found
- Helps verify before scanning

**Scan Results**
- ✅ Success indicator
- 📊 Total components count
- 📋 Per-file breakdown
- 🔗 Quick link to detailed view

---

## 🔍 Tips & Tricks

### Tip 1: Preview Before Scan
Always check the file preview to ensure:
- All intended files are included
- No duplicate files
- Correct ecosystems detected

### Tip 2: Remove Unwanted Files
Click the ❌ button to remove files without re-uploading

### Tip 3: Clear All
Use "Clear All" button to start over

### Tip 4: File Size Matters
Keep individual files under 10MB for best performance

### Tip 5: Mix Ecosystems Freely
Don't worry about mixing file types - the scanner handles it!

---

## ❓ Troubleshooting

### Problem: Files not being accepted
**Solution**: Check file names match supported patterns (see checklist above)

### Problem: Wrong ecosystem detected
**Solution**: Ensure file name is exact (case-sensitive)

### Problem: Drag & drop not working
**Solution**: Try clicking the upload zone instead

### Problem: Scan fails with multiple files
**Solution**: Try scanning files individually to find problematic file

### Problem: Same component appears multiple times
**Solution**: This is expected if different versions exist in different files

---

## 📞 Need Help?

1. Check [MULTI_FILE_UPLOAD.md](./MULTI_FILE_UPLOAD.md) for detailed documentation
2. Review [CHANGELOG.md](../CHANGELOG.md) for recent updates
3. Run `./test-multi-file-upload.sh` to verify API is working
4. Check browser console for detailed error messages

---

## 🎉 Success Checklist

After scanning, you should see:

- [x] Green success message
- [x] SBOM ID generated
- [x] Total component count
- [x] List of files processed
- [x] Detected ecosystems
- [x] "View Results" button

If all checked, congratulations! Your multi-file SBOM is ready! 🎊
