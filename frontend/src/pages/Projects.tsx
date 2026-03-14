import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { Plus, FolderOpen, Trash2, LayoutGrid, LayoutList } from 'lucide-react';
import PageShell from '../components/PageShell';

type ViewMode = 'list' | 'cards';

export default function Projects() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view
  const queryClient = useQueryClient();

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('projectsViewMode') as ViewMode;
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('projectsViewMode', mode);
  };

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateForm(false);
      setNewProject({ name: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.name.trim()) {
      createMutation.mutate(newProject);
    }
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PageShell
      title="Projects"
      description="Manage your SBOM projects"
      actions={
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('cards')}
              className={`p-2 rounded ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>
      }
      sidebar={
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-white">Tips</h3>
          <p className="mt-2 text-sm text-gray-400">
            Create a separate project for each application you want to scan. Each project can contain multiple SBOMs.
          </p>
        </div>
      }
    >

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List or Cards */}
      {isLoading ? (
        <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 p-6 text-center text-gray-400">
          Loading projects...
        </div>
      ) : projectsData?.projects?.length > 0 ? (
        viewMode === 'list' ? (
          /* List View */
          <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Scan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Components
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Vulnerabilities
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {projectsData.projects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/projects/${project.id}`} className="flex items-center">
                        <FolderOpen className="h-5 w-5 text-blue-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-white">{project.name}</p>
                          <p className="text-xs text-gray-400">
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {/* Placeholder - would need actual component count */}
                      -
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {/* Placeholder - would need actual vulnerability count */}
                      -
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View
                        </Link>
                        <Link
                          to="/scanner"
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Scan
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                          title="Delete project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsData.projects.map((project: any) => (
              <div
                key={project.id}
                className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <FolderOpen className="h-10 w-10 text-blue-400" />
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                    title="Delete project"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <Link to={`/projects/${project.id}`}>
                  <h3 className="text-lg font-medium text-white mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {project.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 p-6 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-4">
            No projects yet. Click "New Project" to create one!
          </p>
        </div>
      )}
    </PageShell>
  );
}
