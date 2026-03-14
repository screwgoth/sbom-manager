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
    return <div className="text-center text-text-secondary p-8">Loading project...</div>;
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
          className="inline-flex items-center px-4 py-2 border border-border rounded-lg shadow-sm text-3xl font-medium text-text-secondary bg-bg-tertiary hover:bg-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      }
      sidebar={
        <div className="px-6 py-5">
          <h3 className="text-3xl font-semibold text-text-primary">Project Details</h3>
          <p className="text-3xl text-text-secondary mt-2">
            Use this screen to review and export SBOMs for this project.
          </p>
        </div>
      }
    >

      {/* Project Info */}
      <div className="bg-bg-card shadow-lg rounded-xl border border-borderp-8">
        <h3 className="text-3xl font-medium text-text-primary mb-8">Project Information</h3>
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <dt className="text-3xl font-medium text-text-secondary">Project ID</dt>
            <dd className="mt-1 text-3xl text-text-secondary font-mono text-xs">{project.id}</dd>
          </div>
          <div>
            <dt className="text-3xl font-medium text-text-secondary">Created</dt>
            <dd className="mt-1 text-3xl text-text-secondary">
              {new Date(project.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-3xl font-medium text-text-secondary">Last Updated</dt>
            <dd className="mt-1 text-3xl text-text-secondary">
              {new Date(project.updatedAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-3xl font-medium text-text-secondary">Total SBOMs</dt>
            <dd className="mt-1 text-3xl text-text-secondary">
              {sbomsData?.sboms?.length || 0}
            </dd>
          </div>
        </dl>
      </div>

      {/* SBOMs List */}
      <div className="bg-bg-card shadow-lg rounded-xl border border-borderp-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-medium text-text-primary">SBOMs</h3>
          <button 
            onClick={() => navigate('/scanner')}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-3xl font-medium text-text-primary bg-accent-blue hover:bg-accent-blue-hover"
          >
            Generate New SBOM
          </button>
        </div>
        {sbomsLoading ? (
          <p className="text-text-secondary">Loading SBOMs...</p>
        ) : sbomsData?.sboms?.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {sbomsData.sboms.map((sbom: any) => (
              <li key={sbom.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-accent-blue" />
                    <div className="flex-1">
                      <p className="text-3xl font-medium text-text-primary">
                        Version {sbom.version} ({sbom.format.toUpperCase()})
                      </p>
                      <p className="text-3xl text-text-secondary">
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
                      className="px-3 py-1 text-3xl bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 disabled:opacity-50 flex items-center border border-red-700"
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
                        className="px-3 py-1 text-3xl bg-green-900/30 text-green-300 rounded hover:bg-green-900/50 flex items-center border border-green-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </button>
                      
                      {openExportDropdown === sbom.id && (
                        <div className="absolute right-0 mt-1 w-56 bg-bg-card rounded-lg shadow-xl border border-border z-50">
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase border-b border-border">
                              Standard Formats
                            </div>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadCSV)}
                              className="block w-full text-left px-4 py-2 text-3xl text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              📄 CSV
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadExcel)}
                              className="block w-full text-left px-4 py-2 text-3xl text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              📊 Excel (.xlsx)
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadJSON)}
                              className="block w-full text-left px-4 py-2 text-3xl text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              📦 JSON
                            </button>
                            <div className="border-t border-border my-1"></div>
                            <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase border-b border-border">
                              SBOM Formats
                            </div>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadSPDX)}
                              className="block w-full text-left px-4 py-2 text-3xl text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              🔒 SPDX 2.3
                            </button>
                            <button
                              onClick={() => handleExport(sbom.id, exportApi.downloadCycloneDX)}
                              className="block w-full text-left px-4 py-2 text-3xl text-text-secondary hover:bg-bg-tertiary transition-colors"
                            >
                              🔄 CycloneDX 1.5
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setSelectedSbomId(selectedSbomId === sbom.id ? null : sbom.id)}
                      className="px-3 py-1 text-3xl bg-blue-900/30 text-blue-300 rounded hover:bg-blue-900/50 border border-blue-700"
                    >
                      {selectedSbomId === sbom.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>
                
                {/* SBOM Details */}
                {selectedSbomId === sbom.id && (
                  <div className="mt-8 space-y-8">
                    {/* Vulnerability Summary */}
                    {loadingSummaries ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
                        <span className="ml-2 text-text-secondary">Loading analysis...</span>
                      </div>
                    ) : (
                      <>
                        {/* Vulnerabilities */}
                        {vulnerabilitySummary && (
                          <div className="bg-bg-tertiary/50 rounded-xlp-6 border border-border">
                            <div className="flex items-center mb-3">
                              <Shield className="h-5 w-5 text-red-400 mr-2" />
                              <h4 className="font-medium text-text-primary">Vulnerability Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="bg-red-900/30 rounded px-3 py-2 border border-red-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-red-300">Critical</span>
                                  <XCircle className="h-4 w-4 text-red-400" />
                                </div>
                                <p className="text-3xl font-bold text-red-100">{vulnerabilitySummary.critical}</p>
                              </div>
                              <div className="bg-orange-900/30 rounded px-3 py-2 border border-orange-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-orange-300">High</span>
                                  <AlertCircle className="h-4 w-4 text-orange-400" />
                                </div>
                                <p className="text-3xl font-bold text-orange-100">{vulnerabilitySummary.high}</p>
                              </div>
                              <div className="bg-yellow-900/30 rounded px-3 py-2 border border-yellow-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-yellow-300">Medium</span>
                                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                </div>
                                <p className="text-3xl font-bold text-yellow-100">{vulnerabilitySummary.medium}</p>
                              </div>
                              <div className="bg-blue-900/30 rounded px-3 py-2 border border-blue-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-blue-300">Low</span>
                                  <AlertCircle className="h-4 w-4 text-accent-blue" />
                                </div>
                                <p className="text-3xl font-bold text-blue-100">{vulnerabilitySummary.low}</p>
                              </div>
                              <div className="bg-bg-tertiary rounded px-3 py-2 border border-border">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-text-secondary">Total</span>
                                  <Shield className="h-4 w-4 text-text-secondary" />
                                </div>
                                <p className="text-3xl font-bold text-text-primary">{vulnerabilitySummary.total}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* License Summary */}
                        {licenseSummary && (
                          <div className="bg-bg-tertiary/50 rounded-xlp-6 border border-border">
                            <div className="flex items-center mb-3">
                              <Scale className="h-5 w-5 text-purple-400 mr-2" />
                              <h4 className="font-medium text-text-primary">License Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="bg-green-900/30 rounded px-3 py-2 border border-green-700">
                                <span className="text-xs text-green-300">Low Risk</span>
                                <p className="text-3xl font-bold text-green-100">{licenseSummary.riskDistribution.low}</p>
                              </div>
                              <div className="bg-yellow-900/30 rounded px-3 py-2 border border-yellow-700">
                                <span className="text-xs text-yellow-300">Medium Risk</span>
                                <p className="text-3xl font-bold text-yellow-100">{licenseSummary.riskDistribution.medium}</p>
                              </div>
                              <div className="bg-red-900/30 rounded px-3 py-2 border border-red-700">
                                <span className="text-xs text-red-300">High Risk</span>
                                <p className="text-3xl font-bold text-red-100">{licenseSummary.riskDistribution.high}</p>
                              </div>
                              <div className="bg-bg-tertiary rounded px-3 py-2 border border-border">
                                <span className="text-xs text-text-secondary">Unknown</span>
                                <p className="text-3xl font-bold text-text-primary">{licenseSummary.unknownCount}</p>
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
                      <p className="text-3xl text-text-secondary">Loading components...</p>
                    ) : componentsData?.components?.length > 0 ? (
                      <div>
                        <h4 className="text-3xl font-medium text-text-secondary mb-2">
                          Components ({componentsData.components.length})
                        </h4>
                        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                          <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-750 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Version</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">License</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Supplier</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {componentsData.components.map((comp: any) => (
                                  <tr key={comp.id} className="hover:bg-bg-tertiary/50">
                                    <td className="px-4 py-2 font-mono text-xs text-text-primary">{comp.name}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-text-secondary">{comp.version}</td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        !comp.license ? 'bg-bg-tertiary text-text-secondary' : 'bg-green-900/30 text-green-300 border border-green-700'
                                      }`}>
                                        {comp.license || 'Unknown'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-text-secondary">{comp.supplier || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-3xl text-text-secondary">No components found</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary mb-8">
              No SBOMs yet. Generate one to get started!
            </p>
            <button 
              onClick={() => navigate('/scanner')}
              className="px-4 py-2 bg-accent-blue text-text-primary rounded-lg hover:bg-accent-blue-hover"
            >
              Generate SBOM
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
