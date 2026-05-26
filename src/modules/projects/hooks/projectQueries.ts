import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

export const projectKeys = {
  all: ['projects'] as const,
  list: (params: any) => [...projectKeys.all, 'list', params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  tasks: (id: string) => [...projectKeys.all, 'tasks', id] as const,
  metadata: (type: string, search?: string) => [...projectKeys.all, 'metadata', type, { search }] as const,
};

export const useProjects = (params: { search?: string; status?: string }) => {
  return useInfiniteQuery({
    queryKey: projectKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await projectService.getProjects(params.search, params.status, pageParam as number);
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentLastPage = Array.isArray(lastPage) ? lastPage : [];
      if (currentLastPage.length < 20) return undefined;
      return (allPages?.length || 0) * 20;
    },
    initialPageParam: 0,
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

export const useProjectTypes = (search?: string) => {
  return useInfiniteQuery({
    queryKey: projectKeys.metadata('types', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await projectService.getProjectTypes(search);
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentLastPage = Array.isArray(lastPage) ? lastPage : [];
      if (currentLastPage.length < 100) return undefined;
      return (allPages?.length || 0) * 100;
    },
    initialPageParam: 0,
    staleTime: 24 * 60 * 60 * 1000,
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
