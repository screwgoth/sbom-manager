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
import { useTheme } from '../contexts/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
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
  const projectsAtRisk = (vulnerabilitySummary && vulnerabilitySummary.total > 0 && projectsData?.projects?.length) 
    ? projectsData.projects.length 
    : 0;

  // Mock data for vulnerability trend chart
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

  // Chart colors based on theme
  const chartColors = theme === 'dark' 
    ? { grid: '#3d4558', text: '#9ca3af', bg: '#222939', border: '#3d4558' }
    : { grid: '#cbd5e0', text: '#4a5568', bg: '#ffffff', border: '#cbd5e0' };

  return (
    <PageShell
      title="Dashboard"
      description=""
      fullWidth={true}
    >
      {/* 4 Metric Cards - Matching Reference Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {/* Portfolio Vulnerabilities */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary mb-3">
              {vulnerabilitySummary?.total || 0}
            </div>
            <div className="text-base text-text-secondary font-medium">
              Portfolio Vulnerabilities
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="h-1.5 bg-accent-blue rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Projects at Risk */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary mb-3">
              {projectsAtRisk}
            </div>
            <div className="text-base text-text-secondary font-medium">
              Projects at Risk
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="h-1.5 bg-accent-blue rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Vulnerable Components */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary mb-3">
              {vulnerabilitySummary ? 
                (vulnerabilitySummary.critical + vulnerabilitySummary.high + vulnerabilitySummary.medium + vulnerabilitySummary.low) : 
                0
              }
            </div>
            <div className="text-base text-text-secondary font-medium">
              Vulnerable Components
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="h-1.5 bg-accent-blue rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Inherited Risk Score */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary mb-3">
              {inheritedRiskScore}
            </div>
            <div className="text-base text-text-secondary font-medium">
              Inherited Risk Score
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="h-1.5 bg-red-500 rounded-full" style={{ width: `${inheritedRiskScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Vulnerabilities Chart - Matching Reference */}
      <div className="bg-bg-card rounded-xl border border-border p-8 mb-8 shadow-lg">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-text-primary mb-2">Portfolio Vulnerabilities</h3>
          <p className="text-base text-text-secondary">
            Last Measurement: {lastMeasurement}
          </p>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="date" 
                stroke={chartColors.grid} 
                tick={{ fill: chartColors.text, fontSize: 14 }}
              />
              <YAxis 
                stroke={chartColors.grid} 
                tick={{ fill: chartColors.text, fontSize: 14 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartColors.bg, 
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '0.75rem',
                  color: theme === 'dark' ? '#fff' : '#1a1a1a',
                  fontSize: '14px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="vulnerabilities" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVuln)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vulnerability Breakdown */}
      <div className="bg-bg-card rounded-xl border border-border p-8 mb-8 shadow-lg">
        <div className="flex items-center mb-6">
          <Shield className="h-7 w-7 text-red-400 mr-3" />
          <h3 className="text-2xl font-medium text-text-primary">Vulnerability Breakdown</h3>
        </div>
        {vulnerabilitySummary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="bg-red-900/20 rounded-xl p-6 border border-red-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-red-300 mb-2">Critical</p>
                    <p className="text-3xl font-bold text-red-100">{vulnerabilitySummary.critical}</p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
              </div>

              <div className="bg-orange-900/20 rounded-xl p-6 border border-orange-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-orange-300 mb-2">High</p>
                    <p className="text-3xl font-bold text-orange-100">{vulnerabilitySummary.high}</p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-orange-400" />
                </div>
              </div>

              <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-yellow-300 mb-2">Medium</p>
                    <p className="text-3xl font-bold text-yellow-100">{vulnerabilitySummary.medium}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-yellow-400" />
                </div>
              </div>

              <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-blue-300 mb-2">Low</p>
                    <p className="text-3xl font-bold text-blue-100">{vulnerabilitySummary.low}</p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-text-secondary mb-2">Total</p>
                    <p className="text-3xl font-bold text-text-primary">{vulnerabilitySummary.total}</p>
                  </div>
                  <Shield className="h-10 w-10 text-text-secondary" />
                </div>
              </div>
            </div>

            {vulnerabilitySummary.total === 0 && (
              <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                  <p className="text-base text-green-100">No vulnerabilities detected! Your dependencies are secure.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <Shield className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-lg">No vulnerability data available yet.</p>
            <p className="text-base mt-2">Scan your projects to detect vulnerabilities.</p>
          </div>
        )}
      </div>

      {/* License Compliance */}
      <div className="bg-bg-card rounded-xl border border-border p-8 mb-8 shadow-lg">
        <div className="flex items-center mb-6">
          <Scale className="h-7 w-7 text-purple-400 mr-3" />
          <h3 className="text-2xl font-medium text-text-primary">License Compliance</h3>
        </div>
        {licenseSummary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-green-900/20 rounded-xl p-6 border border-green-800/50">
                <p className="text-base font-medium text-green-300 mb-2">Low Risk</p>
                <p className="text-3xl font-bold text-green-100">{licenseSummary.riskDistribution.low}</p>
              </div>

              <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-800/50">
                <p className="text-base font-medium text-yellow-300 mb-2">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-100">{licenseSummary.riskDistribution.medium}</p>
              </div>

              <div className="bg-red-900/20 rounded-xl p-6 border border-red-800/50">
                <p className="text-base font-medium text-red-300 mb-2">High Risk</p>
                <p className="text-3xl font-bold text-red-100">{licenseSummary.riskDistribution.high}</p>
              </div>

              <div className="bg-bg-tertiary rounded-xl p-6 border border-border">
                <p className="text-base font-medium text-text-secondary mb-2">Unknown</p>
                <p className="text-3xl font-bold text-text-primary">{licenseSummary.unknownCount}</p>
              </div>
            </div>

            {/* Policy Violations */}
            {licenseSummary.policyViolations.length > 0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
                <h4 className="font-medium text-red-200 mb-3 text-lg">
                  ⚠️ {licenseSummary.policyViolations.length} Policy Violation(s)
                </h4>
                <ul className="space-y-2 text-base text-red-200">
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
              <div className="mt-6">
                <h4 className="font-medium text-text-primary mb-4 text-lg">Top Licenses</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(licenseSummary.licenseCounts)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .slice(0, 8)
                    .map(([license, count]: any) => (
                      <div key={license} className="bg-bg-tertiary rounded-lg px-4 py-3 text-base">
                        <span className="font-medium text-text-primary">{license}</span>
                        <span className="text-text-secondary ml-2">({count})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <Scale className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-lg">No license data available yet.</p>
            <p className="text-base mt-2">Scan your projects to analyze licenses.</p>
          </div>
        )}
      </div>

      {/* System Status & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Status */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <h3 className="text-2xl font-medium text-text-primary mb-6">System Status</h3>
          {healthLoading ? (
            <p className="text-text-secondary text-base">Checking system health...</p>
          ) : healthData?.status === 'healthy' ? (
            <div className="flex items-center text-green-400 text-base">
              <CheckCircle className="h-6 w-6 mr-3" />
              <span>All systems operational</span>
            </div>
          ) : (
            <div className="flex items-center text-red-400 text-base">
              <AlertCircle className="h-6 w-6 mr-3" />
              <span>System health check failed</span>
            </div>
          )}
          {healthData && (
            <div className="mt-6 space-y-4 text-base">
              <div className="flex justify-between">
                <span className="text-text-secondary">Database:</span>
                <span className="font-medium text-text-primary">{healthData.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Projects:</span>
                <span className="font-medium text-text-primary">{projectsData?.projects?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active SBOMs:</span>
                <span className="font-medium text-text-primary">{sbomsData?.sboms?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Components Tracked:</span>
                <span className="font-medium text-text-primary">{licenseSummary?.totalComponents || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-bg-card rounded-xl border border-border p-8 shadow-lg">
          <h3 className="text-2xl font-medium text-text-primary mb-6">Recent Projects</h3>
          {projectsLoading ? (
            <p className="text-text-secondary text-base">Loading projects...</p>
          ) : projectsData?.projects?.length > 0 ? (
            <div className="space-y-3">
              {projectsData.projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex justify-between items-center p-4 hover:bg-bg-tertiary rounded-xl transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary text-base">{project.name}</p>
                    <p className="text-sm text-text-secondary">{project.description || 'No description'}</p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary text-base">No projects yet.</p>
              <Link
                to="/projects"
                className="mt-4 inline-block px-6 py-3 bg-accent-blue text-white text-base font-medium rounded-lg hover:bg-accent-blue-hover transition-colors"
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
