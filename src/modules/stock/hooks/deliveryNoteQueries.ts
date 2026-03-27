import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchResource, createResource, updateResource } from '@core/api/frappeApiHelpers';
import { companyService } from '@core/services/companyService';

const keys = {
  all: ['deliveryNotes'] as const,
  list: (params: any) => [...keys.all, 'list', params] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
};

export const useDeliveryNotes = (params: {
  search: string;
  status: string;
}) => {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const company = await companyService.getSelectedCompany();
      const filters: any[] = [["company", "=", company?.name || '']];
      if (params.search) filters.push(["name", "like", `%${params.search}%`]);
      if (params.status && params.status !== 'All') filters.push(["status", "=", params.status]);

      return fetchResource('Delivery Note', {
        fields: '["name", "customer", "posting_date", "status", "grand_total", "currency"]',
        filters: JSON.stringify(filters),
        limit_page_length: 20,
        order_by: 'posting_date desc'
      }).then(r => r?.data || []);
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useDeliveryNoteDetail = (id: string) => {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => fetchResource(`Delivery Note/${id}`).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveDeliveryNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return updateResource('Delivery Note', id, data);
      }
      return createResource('Delivery Note', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitDeliveryNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateResource('Delivery Note', id, { docstatus: 1 }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
};
