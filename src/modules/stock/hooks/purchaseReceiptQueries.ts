import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';
import { companyService } from '@core/services/companyService';
import { fetchResource, createResource, updateResource, callMethod } from '@core/api/frappeApiHelpers';

const keys = {
  list: (params: any) => ['purchaseReceipts', params],
  detail: (id: string) => ['purchaseReceiptDetail', id],
};

export const usePurchaseReceipts = (params: {
  search: string;
  status: string;
}) => {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const company = await companyService.getSelectedCompany();
      return stockApi.getPurchaseReceipts(
        company?.name || '',
        params.search,
        params.status
      );
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const usePurchaseReceiptDetail = (id: string) => {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => fetchResource(`Purchase Receipt/${id}`).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePurchaseReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return updateResource('Purchase Receipt', id, data);
      }
      return createResource('Purchase Receipt', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseReceipts'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitPurchaseReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // In Frappe, submission is usually docstatus: 1
      return updateResource('Purchase Receipt', id, { docstatus: 1 });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseReceipts'] });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
};
