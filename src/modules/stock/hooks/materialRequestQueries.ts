import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';
import { companyService } from '@core/services/companyService';
import { fetchResource } from '@core/api/frappeApiHelpers';

const keys = {
  list: (params: any) => ['materialRequests', params],
  detail: (id: string) => ['materialRequestDetail', id],
  meta: () => ['materialRequestMeta'],
};

export const useMaterialRequests = (params: {
  search: string;
  status: string;
  type: string;
}) => {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const company = await companyService.getSelectedCompany();
      return stockApi.getMaterialRequests(
        company?.name || '',
        params.search,
        params.status,
        params.type
      );
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useMaterialRequestMeta = () => {
  return useQuery({
    queryKey: keys.meta(),
    queryFn: async () => {
      try {
        const meta = await stockApi.getMaterialRequestMeta();
        return meta || {};
      } catch (e) {
        return {};
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
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
        return stockApi.updateResource('Material Request', id, data);
      }
      return stockApi.createMaterialRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialRequests'] });
    },
  });
};
