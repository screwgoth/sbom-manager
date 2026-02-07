import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, sbomsApi, componentsApi } from '../lib/api';
import { ArrowLeft, FileText, Package } from 'lucide-react';
import { useState } from 'react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSbomId, setSelectedSbomId] = useState<string | null>(null);

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
            <dd className="mt-1 text-sm text-gray-900">{project.id}</dd>
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
            Generate SBOM
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
                  <button
                    onClick={() => setSelectedSbomId(selectedSbomId === sbom.id ? null : sbom.id)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    {selectedSbomId === sbom.id ? 'Hide Components' : 'View Components'}
                  </button>
                </div>
                
                {/* Components List */}
                {selectedSbomId === sbom.id && (
                  <div className="mt-4 pl-12">
                    {componentsLoading ? (
                      <p className="text-sm text-gray-500">Loading components...</p>
                    ) : componentsData?.components?.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Components ({componentsData.components.length})
                        </h4>
                        <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-2 font-medium text-gray-700">Name</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-700">Version</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-700">License</th>
                                <th className="text-left py-2 px-2 font-medium text-gray-700">Supplier</th>
                              </tr>
                            </thead>
                            <tbody>
                              {componentsData.components.map((comp: any) => (
                                <tr key={comp.id} className="border-b border-gray-100">
                                  <td className="py-2 px-2 font-mono text-xs">{comp.name}</td>
                                  <td className="py-2 px-2 font-mono text-xs">{comp.version}</td>
                                  <td className="py-2 px-2 text-xs">{comp.license || 'N/A'}</td>
                                  <td className="py-2 px-2 text-xs">{comp.supplier || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
          <p className="text-gray-500">
            No SBOMs yet. Generate one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
