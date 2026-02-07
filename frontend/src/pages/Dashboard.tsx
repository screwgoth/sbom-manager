import { useQuery } from '@tanstack/react-query';
import { projectsApi, healthApi } from '../lib/api';
import { AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';

export default function Dashboard() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your SBOM projects and system status
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
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active SBOMs</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vulnerabilities</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h3>
        {projectsLoading ? (
          <p className="text-gray-500">Loading projects...</p>
        ) : projectsData?.projects?.length > 0 ? (
          <div className="space-y-3">
            {projectsData.projects.slice(0, 5).map((project: any) => (
              <div
                key={project.id}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No projects yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}
