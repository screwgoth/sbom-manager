import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectsApi } from '../lib/api';

// Supported dependency file patterns
const SUPPORTED_FILES = {
  'package.json': 'npm',
  'package-lock.json': 'npm',
  'requirements.txt': 'python',
  'Pipfile': 'python',
  'Pipfile.lock': 'python',
  'pyproject.toml': 'python',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'build.gradle.kts': 'java',
  'go.mod': 'go',
  'go.sum': 'go',
  'Cargo.toml': 'rust',
  'Cargo.lock': 'rust',
};

export default function Scanner() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scanMode, setScanMode] = useState<'upload' | 'directory'>('upload');
  const [directoryPath, setDirectoryPath] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectVersion, setProjectVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then(res => res.data),
  });

  // Validate if file is a supported dependency file
  const isValidDependencyFile = (fileName: string): boolean => {
    return Object.keys(SUPPORTED_FILES).some(pattern => fileName.toLowerCase().includes(pattern.toLowerCase()));
  };

  // Get ecosystem type for a file
  const getFileEcosystem = (fileName: string): string => {
    for (const [pattern, ecosystem] of Object.entries(SUPPORTED_FILES)) {
      if (fileName.toLowerCase().includes(pattern.toLowerCase())) {
        return ecosystem;
      }
    }
    return 'unknown';
  };

  // Handle file selection from input
  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach(file => {
      if (isValidDependencyFile(file.name)) {
        // Check if file already exists
        if (!selectedFiles.some(f => f.name === file.name)) {
          newFiles.push(file);
        }
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files are not supported dependency files:\n${invalidFiles.join('\n')}\n\nSupported files: package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, etc.`);
    }

    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  // Remove a specific file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (data: any) => {
      if (scanMode === 'upload') {
        const formData = new FormData();
        formData.append('projectId', data.projectId);
        formData.append('projectName', data.projectName);
        formData.append('projectVersion', data.projectVersion);
        if (data.author) formData.append('author', data.author);

        selectedFiles.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/scanner/scan/upload', {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Scan failed');
        }

        return response.json();
      } else {
        // Directory scan
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/scanner/scan/directory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId: data.projectId,
            projectName: data.projectName,
            projectVersion: data.projectVersion,
            author: data.author,
            directoryPath: data.directoryPath,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Scan failed');
        }

        return response.json();
      }
    },
    onSuccess: (data) => {
      setScanResult(data.result);
      // Clear files after successful scan
      if (scanMode === 'upload') {
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
  });

  const handleScan = () => {
    if (scanMode === 'upload' && selectedFiles.length === 0) {
      alert('Please select at least one dependency file to scan');
      return;
    }

    if (scanMode === 'directory' && !directoryPath) {
      alert('Please enter a directory path');
      return;
    }

    if (!projectId || !projectName) {
      alert('Please select a project and enter a project name');
      return;
    }

    scanMutation.mutate({
      projectId,
      projectName,
      projectVersion,
      author,
      directoryPath,
    });
  };

  const handleViewResults = () => {
    if (scanResult?.sbomId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SBOM Scanner</h1>
        <p className="text-gray-600 mt-2">
          Scan project dependencies and generate Software Bill of Materials
        </p>
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Multi-file upload supported
        </div>
      </div>

      {/* Scan Mode Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Scan Mode</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setScanMode('upload')}
            className={`px-4 py-2 rounded ${
              scanMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setScanMode('directory')}
            className={`px-4 py-2 rounded ${
              scanMode === 'directory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Scan Directory
          </button>
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Project Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                const project = projectsData?.projects?.find((p: any) => p.id === e.target.value);
                if (project) setProjectName(project.name);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select a project --</option>
              {projectsData?.projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="my-project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Version</label>
            <input
              type="text"
              value={projectVersion}
              onChange={(e) => setProjectVersion(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="1.0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Author (optional)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Your name"
            />
          </div>
        </div>
      </div>

      {/* File Upload or Directory Input */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {scanMode === 'upload' ? 'Upload Dependency Files (Multiple Files Supported)' : 'Directory Path'}
        </h2>

        {scanMode === 'upload' ? (
          <div>
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  Multiple dependency files supported: package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, etc.
                </p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              accept=".json,.txt,.xml,.gradle,.toml,.lock,.sum,.mod,.kts"
            />

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Files ({selectedFiles.length})
                  </p>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file, idx) => {
                    const ecosystem = getFileEcosystem(file.name);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <svg
                            className="h-5 w-5 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="font-medium text-blue-600 uppercase">
                                {ecosystem}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove file"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Ecosystem Summary */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-1">Detected Ecosystems:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(selectedFiles.map(f => getFileEcosystem(f.name)))).map(eco => (
                        <span
                          key={eco}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded uppercase"
                        >
                          {eco}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="/path/to/project"
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter the full path to the project directory to scan
            </p>
          </div>
        )}
      </div>

      {/* Scan Button */}
      <div className="flex gap-4">
        <button
          onClick={handleScan}
          disabled={scanMutation.isPending}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {scanMutation.isPending ? 'Scanning...' : 'Start Scan'}
        </button>

        {scanResult && (
          <button
            onClick={handleViewResults}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            View Results
          </button>
        )}
      </div>

      {/* Error Display */}
      {scanMutation.isError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-700 font-medium">Scan Failed</p>
          <p className="text-red-600 text-sm">{(scanMutation.error as Error)?.message}</p>
        </div>
      )}

      {/* Results Display */}
      {scanResult && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-4">Scan Complete! ✓</h2>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">SBOM ID:</span>{' '}
                <code className="bg-white px-2 py-1 rounded">{scanResult.sbomId}</code>
              </p>
              <p>
                <span className="font-medium">Primary Ecosystem:</span>{' '}
                <span className="uppercase font-mono">{scanResult.ecosystem}</span>
              </p>
              <p>
                <span className="font-medium">Total Components Found:</span>{' '}
                <span className="font-bold text-green-700">{scanResult.componentsCount}</span>
              </p>
            </div>

            {/* Files Processed */}
            {scanResult.filesProcessed && scanResult.filesProcessed.length > 0 && (
              <div className="pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-900 mb-3">
                  Files Processed ({scanResult.filesProcessed.length}):
                </p>
                <div className="space-y-2">
                  {scanResult.filesProcessed.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded border border-green-200"
                    >
                      <div className="flex items-center space-x-3">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-xs text-gray-600">
                            <span className="uppercase font-semibold text-green-700">
                              {file.ecosystem}
                            </span>
                            {' • '}
                            {file.componentCount} components
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ecosystems Summary */}
            {scanResult.ecosystems && scanResult.ecosystems.length > 1 && (
              <div className="pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Multiple Ecosystems Detected:</p>
                <div className="flex flex-wrap gap-2">
                  {scanResult.ecosystems.map((eco: string) => (
                    <span
                      key={eco}
                      className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded uppercase"
                    >
                      {eco}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ecosystem Support Info */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">Supported Ecosystems</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-800">Node.js</p>
            <p className="text-blue-600">package.json, package-lock.json</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Python</p>
            <p className="text-blue-600">requirements.txt, Pipfile, pyproject.toml</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Java</p>
            <p className="text-blue-600">pom.xml, build.gradle</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Go</p>
            <p className="text-blue-600">go.mod, go.sum</p>
          </div>
          <div>
            <p className="font-medium text-blue-800">Rust</p>
            <p className="text-blue-600">Cargo.toml, Cargo.lock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
