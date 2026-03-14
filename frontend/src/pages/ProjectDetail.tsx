import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, sbomsApi, componentsApi, analysisApi, exportApi } from '../lib/api';
import {
  ArrowLeft,
  FileText,
  Shield,
  Scale,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import PageShell from '../components/PageShell';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSbomId, setSelectedSbomId] = useState<string | null>(null);
  const [vulnerabilitySummary, setVulnerabilitySummary] = useState<any>(null);
  const [licenseSummary, setLicenseSummary] = useState<any>(null);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [openExportDropdown, setOpenExportDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openExportDropdown) {
        const dropdown = dropdownRef.current[openExportDropdown];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenExportDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openExportDropdown]);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectsApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: sbomsData, isLoading: sbomsLoading } = useQuery({
    queryKey: ['sboms', id],
    queryFn: async () => {
      const response = await sbomsApi.getByProjectId(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['components', selectedSbomId],
    queryFn: async () => {
      const response = await componentsApi.getBySbomId(selectedSbomId!);
      return response.data;
    },
    enabled: !!selectedSbomId,
  });

  // Mutation for triggering vulnerability scan
  const scanVulnerabilitiesMutation = useMutation({
    mutationFn: (sbomId: string) => analysisApi.scanVulnerabilities(sbomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      fetchSummaries();
    },
  });

  // Fetch vulnerability and license summaries
  const fetchSummaries = async () => {
    if (!selectedSbomId) return;
    
    setLoadingSummaries(true);
    try {
      const [vulnResponse, licResponse] = await Promise.all([
        analysisApi.getVulnerabilitySummary(selectedSbomId),
        analysisApi.getLicenseSummary(selectedSbomId, 'commercial'),
      ]);

      if (vulnResponse.data.success) {
        setVulnerabilitySummary(vulnResponse.data.summary);
      }

      if (licResponse.data.success) {
        setLicenseSummary(licResponse.data.summary);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoadingSummaries(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [selectedSbomId]);

  const handleExport = (sbomId: string, exportFn: (id: string) => void) => {
    exportFn(sbomId);
    setOpenExportDropdown(null);
  };

  if (projectLoading) {
    return <div className="text-center text-gray-400 p-8">Loading project...</div>;
  }

  if (!projectData?.project) {
    return <div className="text-center text-red-400 p-8">Project not found</div>;
  }

  const project = projectData.project;

  return (
    <PageShell
      title={project.name}
      description={project.description || 'No description'}
      actions={
        <Link
          to="/projects"
          className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-navy-700 hover:bg-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      }
      sidebar={
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-white">Project Details</h3>
          <p className="text-sm text-gray-400 mt-2">
            Use this screen to review and export SBOMs for this project.
          </p>
        </div>
      }
    >

      {/* Project Info */}
      <div className="bg-navy-800 shadow-lg rounded-lg border border-navy-600 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Project Information</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-400">Project ID</dt>
            <dd className="mt-1 text-sm text-gray-300 font-mono text-xs">{project.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-300">
              {new Date(project.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-400">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-300">
              {new Date(project.updatedAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-400">Total SBOMs</dt>
            <dd className="mt-1 text-sm text-gray-300">
              {sbomsData?.sboms?.length || 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* SBOMs List */}
      <div className="bg-navy-800 shadow-lg rounded-lg border border-navy-600 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">SBOMs</h3>
          <button 
            onClick={() => navigate('/scanner')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Generate New SBOM
          </button>
        </div>
        {sbomsLoading ? (
          <p className="text-gray-400">Loading SBOMs...</p>
        ) : sbomsData?.sboms?.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {sbomsData.sboms.map((sbom: any) => (
              <li key={sbom.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Version {sbom.version} ({sbom.format.toUpperCase()})
                      </p>
                      <p className="text-sm text-gray-400">
                        Created {new Date(sbom.createdAt).toLocaleString()}
                        {sbom.author && ` by ${sbom.author}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        scanVulnerabilitiesMutation.mutate(sbom.id);
                      }}
                      disabled={scanVulnerabilitiesMutation.isPending}
                      className="px-3 py-1 text-sm bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 disabled:opacity-50 flex items-center border border-red-700"
                    >
                      {scanVulnerabilitiesMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Scan Vulnerabilities
                        </>
                      )}
                    </button>
                    
                    {/* Export Dropdown - Fixed Version */}
                    <div className="relative" ref={(el) => { dropdownRef.current[sbom.id] = el; }}>
                      <button
                        onClick={() => setOpenExportDropdown(openExportDropdown === sbom.id ? null : sbom.id)}
                        className="px-3 py-1 text-sm bg-green-900/30 text-green-300 rounded hover:bg-green-900/50 flex items-center border border-green-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </button>
                      
                      {openExportDropdown === sbom.id && (
                        <div className="absolute right-0 mt-1 w-56 bg-navy-800 rounded-md shadow-xl border border-gray-600 z-50">
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-navy-600">
                              Standard Formats
                            </div>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadCSV)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 transition-colors"
                            >
                              📄 CSV
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadExcel)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 transition-colors"
                            >
                              📊 Excel (.xlsx)
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadJSON)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 transition-colors"
                            >
                              📦 JSON
                            </button>
                            <div className="border-t border-navy-600 my-1"></div>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-navy-600">
                              SBOM Formats
                            </div>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadSPDX)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 transition-colors"
                            >
                              🔒 SPDX 2.3
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadCycloneDX)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 transition-colors"
                            >
                              🔄 CycloneDX 1.5
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setSelectedSbomId(selectedSbomId === sbom.id ? null : sbom.id)}
                      className="px-3 py-1 text-sm bg-blue-900/30 text-blue-300 rounded hover:bg-blue-900/50 border border-blue-700"
                    >
                      {selectedSbomId === sbom.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>
                
                {/* SBOM Details */}
                {selectedSbomId === sbom.id && (
                  <div className="mt-6 space-y-6">
                    {/* Vulnerability Summary */}
                    {loadingSummaries ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        <span className="ml-2 text-gray-400">Loading analysis...</span>
                      </div>
                    ) : (
                      <>
                        {/* Vulnerabilities */}
                        {vulnerabilitySummary && (
                          <div className="bg-navy-700/50 rounded-lg p-4 border border-gray-600">
                            <div className="flex items-center mb-3">
                              <Shield className="h-5 w-5 text-red-400 mr-2" />
                              <h4 className="font-medium text-white">Vulnerability Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="bg-red-900/30 rounded px-3 py-2 border border-red-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-red-300">Critical</span>
                                  <XCircle className="h-4 w-4 text-red-400" />
                                </div>
                                <p className="text-xl font-bold text-red-100">{vulnerabilitySummary.critical}</p>
                              </div>
                              <div className="bg-orange-900/30 rounded px-3 py-2 border border-orange-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-orange-300">High</span>
                                  <AlertCircle className="h-4 w-4 text-orange-400" />
                                </div>
                                <p className="text-xl font-bold text-orange-100">{vulnerabilitySummary.high}</p>
                              </div>
                              <div className="bg-yellow-900/30 rounded px-3 py-2 border border-yellow-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-yellow-300">Medium</span>
                                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                </div>
                                <p className="text-xl font-bold text-yellow-100">{vulnerabilitySummary.medium}</p>
                              </div>
                              <div className="bg-blue-900/30 rounded px-3 py-2 border border-blue-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-blue-300">Low</span>
                                  <AlertCircle className="h-4 w-4 text-blue-400" />
                                </div>
                                <p className="text-xl font-bold text-blue-100">{vulnerabilitySummary.low}</p>
                              </div>
                              <div className="bg-navy-700 rounded px-3 py-2 border border-gray-600">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-300">Total</span>
                                  <Shield className="h-4 w-4 text-gray-400" />
                                </div>
                                <p className="text-xl font-bold text-white">{vulnerabilitySummary.total}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* License Summary */}
                        {licenseSummary && (
                          <div className="bg-navy-700/50 rounded-lg p-4 border border-gray-600">
                            <div className="flex items-center mb-3">
                              <Scale className="h-5 w-5 text-purple-400 mr-2" />
                              <h4 className="font-medium text-white">License Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-green-900/30 rounded px-3 py-2 border border-green-700">
                                <span className="text-xs text-green-300">Low Risk</span>
                                <p className="text-xl font-bold text-green-100">{licenseSummary.riskDistribution.low}</p>
                              </div>
                              <div className="bg-yellow-900/30 rounded px-3 py-2 border border-yellow-700">
                                <span className="text-xs text-yellow-300">Medium Risk</span>
                                <p className="text-xl font-bold text-yellow-100">{licenseSummary.riskDistribution.medium}</p>
                              </div>
                              <div className="bg-red-900/30 rounded px-3 py-2 border border-red-700">
                                <span className="text-xs text-red-300">High Risk</span>
                                <p className="text-xl font-bold text-red-100">{licenseSummary.riskDistribution.high}</p>
                              </div>
                              <div className="bg-navy-700 rounded px-3 py-2 border border-gray-600">
                                <span className="text-xs text-gray-300">Unknown</span>
                                <p className="text-xl font-bold text-white">{licenseSummary.unknownCount}</p>
                              </div>
                            </div>
                            {licenseSummary.policyViolations.length > 0 && (
                              <div className="bg-red-900/30 border border-red-700 rounded p-2 mt-2">
                                <p className="text-xs text-red-200 font-medium">
                                  ⚠️ {licenseSummary.policyViolations.length} Policy Violation(s)
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Components Table */}
                    {componentsLoading ? (
                      <p className="text-sm text-gray-400">Loading components...</p>
                    ) : componentsData?.components?.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                          Components ({componentsData.components.length})
                        </h4>
                        <div className="bg-navy-800 border border-navy-600 rounded-lg overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-750 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Version</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">License</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Supplier</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {componentsData.components.map((comp: any) => (
                                  <tr key={comp.id} className="hover:bg-navy-700/50">
                                    <td className="px-4 py-2 font-mono text-xs text-white">{comp.name}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{comp.version}</td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        !comp.license ? 'bg-navy-700 text-gray-400' : 'bg-green-900/30 text-green-300 border border-green-700'
                                      }`}>
                                        {comp.license || 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-400">{comp.supplier || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No components found</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400 mb-4">
              No SBOMs yet. Generate one to get started!
            </p>
            <button 
              onClick={() => navigate('/scanner')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate SBOM
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
