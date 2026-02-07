import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, sbomsApi, componentsApi, analysisApi, exportApi } from '../lib/api';
import {
  ArrowLeft,
  FileText,
  Shield,
  Scale,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSbomId, setSelectedSbomId] = useState<string | null>(null);
  const [vulnerabilitySummary, setVulnerabilitySummary] = useState<any>(null);
  const [licenseSummary, setLicenseSummary] = useState<any>(null);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

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

  if (projectLoading) {
    return <div className="text-center text-gray-500">Loading project...</div>;
  }

  if (!projectData?.project) {
    return <div className="text-center text-red-500">Project not found</div>;
  }

  const project = projectData.project;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/projects"
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {project.description || 'No description'}
          </p>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Project ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{project.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(project.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(project.updatedAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total SBOMs</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {sbomsData?.sboms?.length || 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* SBOMs List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">SBOMs</h3>
          <button 
            onClick={() => navigate('/scanner')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Generate New SBOM
          </button>
        </div>
        {sbomsLoading ? (
          <p className="text-gray-500">Loading SBOMs...</p>
        ) : sbomsData?.sboms?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {sbomsData.sboms.map((sbom: any) => (
              <li key={sbom.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Version {sbom.version} ({sbom.format.toUpperCase()})
                      </p>
                      <p className="text-sm text-gray-500">
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
                      className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 flex items-center"
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
                    <div className="relative group">
                      <button
                        className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Standard Formats</div>
                          <button
                            onClick={() => exportApi.downloadCSV(sbom.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            📄 CSV
                          </button>
                          <button
                            onClick={() => exportApi.downloadExcel(sbom.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            📊 Excel (.xlsx)
                          </button>
                          <button
                            onClick={() => exportApi.downloadJSON(sbom.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            📦 JSON
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">SBOM Formats</div>
                          <button
                            onClick={() => exportApi.downloadSPDX(sbom.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            🔒 SPDX 2.3
                          </button>
                          <button
                            onClick={() => exportApi.downloadCycloneDX(sbom.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            🔄 CycloneDX 1.5
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSbomId(selectedSbomId === sbom.id ? null : sbom.id)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
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
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading analysis...</span>
                      </div>
                    ) : (
                      <>
                        {/* Vulnerabilities */}
                        {vulnerabilitySummary && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <Shield className="h-5 w-5 text-red-600 mr-2" />
                              <h4 className="font-medium text-gray-900">Vulnerability Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="bg-red-100 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-red-800">Critical</span>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                                <p className="text-xl font-bold text-red-900">{vulnerabilitySummary.critical}</p>
                              </div>
                              <div className="bg-orange-100 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-orange-800">High</span>
                                  <AlertCircle className="h-4 w-4 text-orange-600" />
                                </div>
                                <p className="text-xl font-bold text-orange-900">{vulnerabilitySummary.high}</p>
                              </div>
                              <div className="bg-yellow-100 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-yellow-800">Medium</span>
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                </div>
                                <p className="text-xl font-bold text-yellow-900">{vulnerabilitySummary.medium}</p>
                              </div>
                              <div className="bg-blue-100 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-blue-800">Low</span>
                                  <AlertCircle className="h-4 w-4 text-blue-600" />
                                </div>
                                <p className="text-xl font-bold text-blue-900">{vulnerabilitySummary.low}</p>
                              </div>
                              <div className="bg-gray-100 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-800">Total</span>
                                  <Shield className="h-4 w-4 text-gray-600" />
                                </div>
                                <p className="text-xl font-bold text-gray-900">{vulnerabilitySummary.total}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* License Summary */}
                        {licenseSummary && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <Scale className="h-5 w-5 text-purple-600 mr-2" />
                              <h4 className="font-medium text-gray-900">License Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-green-100 rounded px-3 py-2">
                                <span className="text-xs text-green-800">Low Risk</span>
                                <p className="text-xl font-bold text-green-900">{licenseSummary.riskDistribution.low}</p>
                              </div>
                              <div className="bg-yellow-100 rounded px-3 py-2">
                                <span className="text-xs text-yellow-800">Medium Risk</span>
                                <p className="text-xl font-bold text-yellow-900">{licenseSummary.riskDistribution.medium}</p>
                              </div>
                              <div className="bg-red-100 rounded px-3 py-2">
                                <span className="text-xs text-red-800">High Risk</span>
                                <p className="text-xl font-bold text-red-900">{licenseSummary.riskDistribution.high}</p>
                              </div>
                              <div className="bg-gray-100 rounded px-3 py-2">
                                <span className="text-xs text-gray-800">Unknown</span>
                                <p className="text-xl font-bold text-gray-900">{licenseSummary.unknownCount}</p>
                              </div>
                            </div>
                            {licenseSummary.policyViolations.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                <p className="text-xs text-red-800 font-medium">
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
                      <p className="text-sm text-gray-500">Loading components...</p>
                    ) : componentsData?.components?.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Components ({componentsData.components.length})
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Version</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">License</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {componentsData.components.map((comp: any) => (
                                  <tr key={comp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-xs text-gray-900">{comp.name}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{comp.version}</td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        !comp.license ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                                      }`}>
                                        {comp.license || 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-600">{comp.supplier || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No components found</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 mb-4">
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
    </div>
  );
}
