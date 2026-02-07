import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';

export default function Projects() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your SBOM projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading projects...</div>
        ) : projectsData?.projects?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {projectsData.projects.map((project: any) => (
              <li key={project.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <Link to={`/projects/${project.id}`} className="flex items-center flex-1">
                    <FolderOpen className="h-10 w-10 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-lg font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete project"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No projects yet. Click "New Project" to create one!
          </div>
        )}
      </div>
    </div>
  );
}
