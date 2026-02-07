import { useQuery } from '@tanstack/react-query';
import { projectsApi, healthApi, sbomsApi, analysisApi } from '../lib/api';
import { 
  AlertCircle, 
  CheckCircle, 
  FolderOpen, 
  Shield, 
  FileText, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [vulnerabilitySummary, setVulnerabilitySummary] = useState<any>(null);
  const [licenseSummary, setLicenseSummary] = useState<any>(null);

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await healthApi.check();
      return response.data;
    },
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data;
    },
  });

  const { data: sbomsData, isLoading: sbomsLoading } = useQuery({
    queryKey: ['sboms'],
    queryFn: async () => {
      const response = await sbomsApi.getAll();
      return response.data;
    },
  });

  // Fetch vulnerability and license summaries for all SBOMs
  useEffect(() => {
    const fetchSummaries = async () => {
      if (!sbomsData?.sboms?.length) return;

      let totalVulns = { critical: 0, high: 0, medium: 0, low: 0, none: 0, total: 0 };
      let totalLicenses = {
        totalComponents: 0,
        unknownCount: 0,
        policyViolations: [] as any[],
        riskDistribution: { low: 0, medium: 0, high: 0 },
        licenseCounts: {} as Record<string, number>,
      };

      for (const sbom of sbomsData.sboms) {
        try {
          const vulnResponse = await analysisApi.getVulnerabilitySummary(sbom.id);
          const licResponse = await analysisApi.getLicenseSummary(sbom.id, 'commercial');

          if (vulnResponse.data.success) {
            const summary = vulnResponse.data.summary;
            totalVulns.critical += summary.critical || 0;
            totalVulns.high += summary.high || 0;
            totalVulns.medium += summary.medium || 0;
            totalVulns.low += summary.low || 0;
            totalVulns.none += summary.none || 0;
            totalVulns.total += summary.total || 0;
          }

          if (licResponse.data.success) {
            const summary = licResponse.data.summary;
            totalLicenses.totalComponents += summary.totalComponents || 0;
            totalLicenses.unknownCount += summary.unknownCount || 0;
            totalLicenses.policyViolations.push(...(summary.policyViolations || []));
            totalLicenses.riskDistribution.low += summary.riskDistribution.low || 0;
            totalLicenses.riskDistribution.medium += summary.riskDistribution.medium || 0;
            totalLicenses.riskDistribution.high += summary.riskDistribution.high || 0;
            
            // Merge license counts
            if (summary.licenseCounts) {
              for (const [license, count] of Object.entries(summary.licenseCounts)) {
                totalLicenses.licenseCounts[license] = 
                  (totalLicenses.licenseCounts[license] || 0) + (count as number);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching summaries for SBOM ${sbom.id}:`, error);
        }
      }

      setVulnerabilitySummary(totalVulns);
      setLicenseSummary(totalLicenses);
    };

    fetchSummaries();
  }, [sbomsData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your SBOM projects, vulnerabilities, and license compliance
        </p>
      </div>

      {/* Health Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        {healthLoading ? (
          <p className="text-gray-500">Checking system health...</p>
        ) : healthData?.status === 'healthy' ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>All systems operational</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>System health check failed</span>
          </div>
        )}
        {healthData && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Database:</span>
              <span className="ml-2 font-medium">{healthData.database}</span>
            </div>
            <div>
              <span className="text-gray-500">Last checked:</span>
              <span className="ml-2 font-medium">
                {new Date(healthData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <FolderOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {projectsLoading ? '...' : projectsData?.projects?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active SBOMs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sbomsLoading ? '...' : sbomsData?.sboms?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Components Tracked</p>
              <p className="text-2xl font-semibold text-gray-900">
                {licenseSummary?.totalComponents || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Vulnerability Summary</h3>
        </div>
        {vulnerabilitySummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Critical</p>
                    <p className="text-2xl font-bold text-red-900">{vulnerabilitySummary.critical}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">High</p>
                    <p className="text-2xl font-bold text-orange-900">{vulnerabilitySummary.high}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Medium</p>
                    <p className="text-2xl font-bold text-yellow-900">{vulnerabilitySummary.medium}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Low</p>
                    <p className="text-2xl font-bold text-blue-900">{vulnerabilitySummary.low}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{vulnerabilitySummary.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </div>

            {vulnerabilitySummary.total === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">No vulnerabilities detected! Your dependencies are secure.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No vulnerability data available yet.</p>
            <p className="text-sm mt-1">Scan your projects to detect vulnerabilities.</p>
          </div>
        )}
      </div>

      {/* License Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Scale className="h-6 w-6 text-purple-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">License Compliance</h3>
        </div>
        {licenseSummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-800">Low Risk</p>
                <p className="text-2xl font-bold text-green-900">{licenseSummary.riskDistribution.low}</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-900">{licenseSummary.riskDistribution.medium}</p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">High Risk</p>
                <p className="text-2xl font-bold text-red-900">{licenseSummary.riskDistribution.high}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-800">Unknown</p>
                <p className="text-2xl font-bold text-gray-900">{licenseSummary.unknownCount}</p>
              </div>
            </div>

            {/* Policy Violations */}
            {licenseSummary.policyViolations.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">
                  ⚠️ {licenseSummary.policyViolations.length} Policy Violation(s)
                </h4>
                <ul className="space-y-1 text-sm text-red-800">
                  {licenseSummary.policyViolations.slice(0, 5).map((violation: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-medium">{violation.componentName}</span> - {violation.license}: {violation.reason}
                    </li>
                  ))}
                  {licenseSummary.policyViolations.length > 5 && (
                    <li className="text-red-600">
                      ... and {licenseSummary.policyViolations.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Top Licenses */}
            {Object.keys(licenseSummary.licenseCounts).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Top Licenses</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(licenseSummary.licenseCounts)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .slice(0, 8)
                    .map(([license, count]: any) => (
                      <div key={license} className="bg-gray-50 rounded px-3 py-2 text-sm">
                        <span className="font-medium text-gray-900">{license}</span>
                        <span className="text-gray-600 ml-2">({count})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Scale className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No license data available yet.</p>
            <p className="text-sm mt-1">Scan your projects to analyze licenses.</p>
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h3>
        {projectsLoading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projectsData?.projects?.length > 0 ? (
          <div className="space-y-3">
            {projectsData.projects.slice(0, 5).map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No projects yet. Create one to get started!</p>
            <Link
              to="/projects"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
