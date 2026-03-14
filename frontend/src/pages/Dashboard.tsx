import { useQuery } from '@tanstack/react-query';
import { projectsApi, healthApi, sbomsApi, analysisApi } from '../lib/api';
import { 
  AlertCircle, 
  CheckCircle, 
  FolderOpen, 
  Shield, 
  AlertTriangle,
  XCircle,
  Scale,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

  const { data: sbomsData } = useQuery({
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

  // Calculate projects at risk (projects with vulnerabilities)
  // This is a simplified calculation - in real app, check if project has vulnerabilities
  const projectsAtRisk = (vulnerabilitySummary && vulnerabilitySummary.total > 0 && projectsData?.projects?.length) 
    ? projectsData.projects.length 
    : 0;

  // Mock data for vulnerability trend chart (in real app, fetch from backend)
  const trendData = [
    { date: '14 Jan 2026', vulnerabilities: 0 },
    { date: '21 Jan 2026', vulnerabilities: 0 },
    { date: '28 Jan 2026', vulnerabilities: 0 },
    { date: '04 Feb 2026', vulnerabilities: 0 },
    { date: '11 Feb 2026', vulnerabilities: 0 },
    { date: '18 Feb 2026', vulnerabilities: 0 },
    { date: '25 Feb 2026', vulnerabilities: 0 },
    { date: '04 Mar 2026', vulnerabilities: 0 },
    { date: '11 Mar 2026', vulnerabilities: 0 },
    { date: '14 Mar 2026', vulnerabilities: vulnerabilitySummary?.total || 0 },
  ];

  // Calculate inherited risk score (weighted average of vulnerabilities)
  const inheritedRiskScore = vulnerabilitySummary 
    ? Math.min(
        Math.round(
          (vulnerabilitySummary.critical * 10 + 
           vulnerabilitySummary.high * 7 + 
           vulnerabilitySummary.medium * 4 + 
           vulnerabilitySummary.low * 1) / 10
        ),
        100
      )
    : 0;

  const now = new Date();
  const lastMeasurement = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;

  return (
    <PageShell
      title="Dashboard"
      description=""
      fullWidth={true}
    >
      {/* 4 Metric Cards - Matching Reference Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Portfolio Vulnerabilities */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {vulnerabilitySummary?.total || 0}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              Portfolio Vulnerabilities
            </div>
            <div className="mt-4 pt-4 border-t border-navy-600">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Projects at Risk */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {projectsAtRisk}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              Projects at Risk
            </div>
            <div className="mt-4 pt-4 border-t border-navy-600">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Vulnerable Components */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {vulnerabilitySummary ? 
                (vulnerabilitySummary.critical + vulnerabilitySummary.high + vulnerabilitySummary.medium + vulnerabilitySummary.low) : 
                0
              }
            </div>
            <div className="text-sm text-gray-400 font-medium">
              Vulnerable Components
            </div>
            <div className="mt-4 pt-4 border-t border-navy-600">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Inherited Risk Score */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {inheritedRiskScore}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              Inherited Risk Score
            </div>
            <div className="mt-4 pt-4 border-t border-navy-600">
              <div className="h-1 bg-red-500 rounded-full" style={{ width: `${inheritedRiskScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Vulnerabilities Chart - Matching Reference */}
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-6 mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-1">Portfolio Vulnerabilities</h3>
          <p className="text-sm text-gray-400">
            Last Measurement: {lastMeasurement}
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3d4558" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#222939', 
                  border: '1px solid #3d4558',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="vulnerabilities" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVuln)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vulnerability Breakdown */}
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-6 mb-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-red-400 mr-2" />
          <h3 className="text-lg font-medium text-white">Vulnerability Breakdown</h3>
        </div>
        {vulnerabilitySummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-red-900/20 rounded-lg p-4 border border-red-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-300">Critical</p>
                    <p className="text-2xl font-bold text-red-100">{vulnerabilitySummary.critical}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>

              <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-300">High</p>
                    <p className="text-2xl font-bold text-orange-100">{vulnerabilitySummary.high}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-400" />
                </div>
              </div>

              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Medium</p>
                    <p className="text-2xl font-bold text-yellow-100">{vulnerabilitySummary.medium}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-400" />
                </div>
              </div>

              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300">Low</p>
                    <p className="text-2xl font-bold text-blue-100">{vulnerabilitySummary.low}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-navy-700/50 rounded-lg p-4 border border-navy-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Total</p>
                    <p className="text-2xl font-bold text-white">{vulnerabilitySummary.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>

            {vulnerabilitySummary.total === 0 && (
              <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-100">No vulnerabilities detected! Your dependencies are secure.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p>No vulnerability data available yet.</p>
            <p className="text-sm mt-1">Scan your projects to detect vulnerabilities.</p>
          </div>
        )}
      </div>

      {/* License Compliance */}
      <div className="bg-navy-800 rounded-lg border border-navy-600 p-6 mb-6">
        <div className="flex items-center mb-4">
          <Scale className="h-6 w-6 text-purple-400 mr-2" />
          <h3 className="text-lg font-medium text-white">License Compliance</h3>
        </div>
        {licenseSummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-800/50">
                <p className="text-sm font-medium text-green-300">Low Risk</p>
                <p className="text-2xl font-bold text-green-100">{licenseSummary.riskDistribution.low}</p>
              </div>

              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800/50">
                <p className="text-sm font-medium text-yellow-300">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-100">{licenseSummary.riskDistribution.medium}</p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4 border border-red-800/50">
                <p className="text-sm font-medium text-red-300">High Risk</p>
                <p className="text-2xl font-bold text-red-100">{licenseSummary.riskDistribution.high}</p>
              </div>

              <div className="bg-navy-700/50 rounded-lg p-4 border border-navy-600">
                <p className="text-sm font-medium text-gray-300">Unknown</p>
                <p className="text-2xl font-bold text-white">{licenseSummary.unknownCount}</p>
              </div>
            </div>

            {/* Policy Violations */}
            {licenseSummary.policyViolations.length > 0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                <h4 className="font-medium text-red-200 mb-2">
                  ⚠️ {licenseSummary.policyViolations.length} Policy Violation(s)
                </h4>
                <ul className="space-y-1 text-sm text-red-200">
                  {licenseSummary.policyViolations.slice(0, 5).map((violation: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-medium">{violation.componentName}</span> - {violation.license}: {violation.reason}
                    </li>
                  ))}
                  {licenseSummary.policyViolations.length > 5 && (
                    <li className="text-red-300">
                      ... and {licenseSummary.policyViolations.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Top Licenses */}
            {Object.keys(licenseSummary.licenseCounts).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-white mb-2">Top Licenses</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(licenseSummary.licenseCounts)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .slice(0, 8)
                    .map(([license, count]: any) => (
                      <div key={license} className="bg-navy-700 rounded px-3 py-2 text-sm">
                        <span className="font-medium text-white">{license}</span>
                        <span className="text-gray-400 ml-2">({count})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Scale className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p>No license data available yet.</p>
            <p className="text-sm mt-1">Scan your projects to analyze licenses.</p>
          </div>
        )}
      </div>

      {/* System Status & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <h3 className="text-lg font-medium text-white mb-4">System Status</h3>
          {healthLoading ? (
            <p className="text-gray-400">Checking system health...</p>
          ) : healthData?.status === 'healthy' ? (
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>All systems operational</span>
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>System health check failed</span>
            </div>
          )}
          {healthData && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Database:</span>
                <span className="font-medium text-white">{healthData.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Projects:</span>
                <span className="font-medium text-white">{projectsData?.projects?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active SBOMs:</span>
                <span className="font-medium text-white">{sbomsData?.sboms?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Components Tracked:</span>
                <span className="font-medium text-white">{licenseSummary?.totalComponents || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-navy-800 rounded-lg border border-navy-600 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Projects</h3>
          {projectsLoading ? (
            <p className="text-gray-400">Loading projects...</p>
          ) : projectsData?.projects?.length > 0 ? (
            <div className="space-y-2">
              {projectsData.projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex justify-between items-center p-3 hover:bg-navy-700/50 rounded-md transition-colors"
                >
                  <div>
                    <p className="font-medium text-white text-sm">{project.name}</p>
                    <p className="text-xs text-gray-400">{project.description || 'No description'}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400 text-sm">No projects yet.</p>
              <Link
                to="/projects"
                className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
