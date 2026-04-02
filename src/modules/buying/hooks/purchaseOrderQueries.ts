import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';

export const poKeys = {
  all: ['purchaseOrders'] as const,
  list: (params: any) => [...poKeys.all, 'list', params] as const,
  detail: (id: string) => [...poKeys.all, 'detail', id] as const,
  suppliers: (search?: string) => ['metadata', 'suppliers', search] as const,
  items: (search?: string) => ['metadata', 'items', search] as const,
};

export const usePurchaseOrders = (params: { search?: string; status?: string }) => {
  return useQuery({
    queryKey: poKeys.list(params),
    queryFn: () => buyingApi.getPurchaseOrders(params.search, params.status),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePurchaseOrderDetail = (id: string) => {
  return useQuery({
    queryKey: poKeys.detail(id),
    queryFn: () => buyingApi.getPurchaseOrderDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePOSuppliers = (search?: string) => {
  return useQuery({
    queryKey: poKeys.suppliers(search),
    queryFn: () => metadataService.getSuppliers(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePOItems = (search?: string) => {
  return useQuery({
    queryKey: poKeys.items(search),
    queryFn: () => metadataService.getItems(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return buyingApi.updatePurchaseOrder(id, data);
      }
      return buyingApi.createPurchaseOrder(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: poKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: poKeys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitPurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buyingApi.submitPurchaseOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: poKeys.all });
      queryClient.invalidateQueries({ queryKey: poKeys.detail(id) });
    },
  });
};
