import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/projects', data),
  update: (id: string, data: { name: string; description?: string }) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// SBOMs API
export const sbomsApi = {
  getAll: () => api.get('/sboms'),
  getByProjectId: (projectId: string) => api.get(`/sboms/project/${projectId}`),
  getById: (id: string) => api.get(`/sboms/${id}`),
  create: (data: any) => api.post('/sboms', data),
  delete: (id: string) => api.delete(`/sboms/${id}`),
};

// Components API
export const componentsApi = {
  getBySbomId: (sbomId: string) => api.get(`/components/sbom/${sbomId}`),
  getById: (id: string) => api.get(`/components/${id}`),
  create: (data: any) => api.post('/components', data),
  createBulk: (components: any[]) => api.post('/components/bulk', { components }),
};

// Vulnerabilities API
export const vulnerabilitiesApi = {
  getAll: () => api.get('/vulnerabilities'),
  getById: (id: string) => api.get(`/vulnerabilities/${id}`),
  getByCveId: (cveId: string) => api.get(`/vulnerabilities/cve/${cveId}`),
  getByComponentId: (componentId: string) => api.get(`/vulnerabilities/component/${componentId}`),
  create: (data: any) => api.post('/vulnerabilities', data),
  link: (data: { componentId: string; vulnerabilityId: string; status?: string }) => 
    api.post('/vulnerabilities/link', data),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};

// Scanner API
export const scannerApi = {
  scanDirectory: (data: { projectId: string; projectName: string; projectVersion?: string; author?: string; directoryPath: string }) => 
    api.post('/scanner/scan/directory', data),
  scanUpload: (formData: FormData) => 
    api.post('/scanner/scan/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  detect: (fileNames: string[]) => 
    api.post('/scanner/detect', { fileNames }),
};

// Analysis API
export const analysisApi = {
  // Vulnerabilities
  scanVulnerabilities: (sbomId: string) => 
    api.post(`/analysis/vulnerabilities/scan/${sbomId}`),
  getVulnerabilitySummary: (sbomId: string) => 
    api.get(`/analysis/vulnerabilities/summary/${sbomId}`),
  getComponentVulnerabilities: (componentId: string) => 
    api.get(`/analysis/vulnerabilities/component/${componentId}`),
  
  // Licenses
  getLicenseSummary: (sbomId: string, policy: string = 'commercial') => 
    api.get(`/analysis/licenses/summary/${sbomId}?policy=${policy}`),
  analyzeComponentLicense: (componentId: string, policy: string = 'commercial') => 
    api.get(`/analysis/licenses/component/${componentId}?policy=${policy}`),
  getLicensePolicies: () => 
    api.get('/analysis/licenses/policies'),
};

// Convenience exports
export default {
  getProjects: () => projectsApi.getAll().then(res => res.data),
};
