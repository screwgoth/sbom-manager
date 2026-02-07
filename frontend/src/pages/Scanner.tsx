import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { projectsApi } from '../lib/api';

export default function Scanner() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [scanMode, setScanMode] = useState<'upload' | 'directory'>('upload');
  const [directoryPath, setDirectoryPath] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectVersion, setProjectVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then(res => res.data),
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (data: any) => {
      if (scanMode === 'upload') {
        const formData = new FormData();
        formData.append('projectId', data.projectId);
        formData.append('projectName', data.projectName);
        formData.append('projectVersion', data.projectVersion);
        if (data.author) formData.append('author', data.author);

        if (selectedFiles) {
          Array.from(selectedFiles).forEach((file, index) => {
            formData.append(`file${index}`, file);
          });
        }

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
    },
  });

  const handleScan = () => {
    if (scanMode === 'upload' && (!selectedFiles || selectedFiles.length === 0)) {
      alert('Please select files to scan');
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
          {scanMode === 'upload' ? 'Upload Dependency Files' : 'Directory Path'}
        </h2>

        {scanMode === 'upload' ? (
          <div>
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="w-full p-2 border rounded"
              accept=".json,.txt,.xml,.gradle,.toml,.lock,.sum,.mod,.kts"
            />
            <p className="text-sm text-gray-500 mt-2">
              Supported files: package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, etc.
            </p>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">Selected files:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {Array.from(selectedFiles).map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
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
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">SBOM ID:</span>{' '}
              <code className="bg-white px-2 py-1 rounded">{scanResult.sbomId}</code>
            </p>
            <p>
              <span className="font-medium">Ecosystem:</span>{' '}
              <span className="uppercase font-mono">{scanResult.ecosystem}</span>
            </p>
            <p>
              <span className="font-medium">Components Found:</span>{' '}
              <span className="font-bold">{scanResult.componentsCount}</span>
            </p>
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
