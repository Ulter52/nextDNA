import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';
import { fetchResource, updateResource, createResource } from '@core/api/frappeApiHelpers';

const keys = {
  all: ['materialRequests'] as const,
  list: (company: string, params: any) => [...keys.all, 'list', company, params] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
  meta: () => [...keys.all, 'metadata'] as const,
};

export const useMaterialRequests = (params: {
  company: string;
  search: string;
  status: string;
  type: string;
}) => {
  return useInfiniteQuery({
    queryKey: keys.list(params.company, { search: params.search, status: params.status, type: params.type }),
    queryFn: async ({ pageParam = 0 }) => {
      if (!params.company) return [];
      try {
        const data = await stockApi.getMaterialRequests(
          params.company,
          params.search,
          params.status,
          params.type,
          pageParam as number,
          20
        );
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
    enabled: !!params.company,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMaterialRequestDetail = (id: string) => {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => fetchResource(`Material Request/${id}`).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveMaterialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return updateResource('Material Request', id, data);
      }
      return createResource('Material Request', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      }
    },
  });
};
