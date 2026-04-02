import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

export const projectKeys = {
  all: ['projects'] as const,
  list: (params: any) => [...projectKeys.all, 'list', params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  tasks: (id: string) => [...projectKeys.all, 'tasks', id] as const,
  types: () => [...projectKeys.all, 'types'] as const,
};

export const useProjects = (params: { search?: string; status?: string }) => {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectService.getProjects(params.search, params.status),
    staleTime: 2 * 60 * 1000,
  });
};

export const useProjectDetail = (id: string) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProjectDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectTasks = (id: string) => {
  return useQuery({
    queryKey: projectKeys.tasks(id),
    queryFn: () => projectService.getTasks(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectTypes = () => {
  return useQuery({
    queryKey: projectKeys.types(),
    queryFn: () => projectService.getProjectTypes(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useSaveProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return projectService.updateProject(id, data);
      }
      return projectService.createProject(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
      }
    },
  });
};
