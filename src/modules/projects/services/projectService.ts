import { fetchResource, createResource, updateResource } from '../../../core/api/frappeApiHelpers';

export const projectService = {
  getProjects: (search?: string, status?: string, limit = 20) => {
    const filters: any[] = [];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);

    return fetchResource('Project', {
      fields: '["name", "project_name", "status", "percent_complete", "expected_end_date", "project_type"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_page_length: limit,
      order_by: 'modified desc'
    }).then(r => r?.data || []);
  },

  getProjectDetail: (projectName: string) => fetchResource(`Project/${projectName}`),

  createProject: (data: any) => createResource('Project', data),

  updateProject: (projectName: string, data: any) => updateResource('Project', projectName, data),

  getTasks: (projectName: string) => {
    const filters = [["project", "=", projectName]];
    return fetchResource('Task', {
      fields: '["name", "subject", "status", "exp_end_date", "progress"]',
      filters: JSON.stringify(filters),
      order_by: 'exp_end_date asc'
    }).then(r => r?.data || []);
  },

  getProjectTypes: () => {
    return fetchResource('Project Type', {
      fields: '["name"]',
      limit_page_length: 100,
      order_by: 'name asc'
    }).then(r => r?.data || []);
  }
};
