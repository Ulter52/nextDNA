import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';

export const poKeys = {
  all: ['purchaseOrders'] as const,
  list: (params: any) => [...poKeys.all, 'list', params] as const,
  detail: (id: string) => [...poKeys.all, 'detail', id] as const,
  metadata: (type: string, search?: string) => [...poKeys.all, 'metadata', type, { search }] as const,
};

export const usePurchaseOrders = (params: { search?: string; status?: string }) => {
  return useInfiniteQuery({
    queryKey: poKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await buyingApi.getPurchaseOrders(params.search, params.status, pageParam as number);
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

export const usePurchaseOrderDetail = (id: string) => {
  return useQuery({
    queryKey: poKeys.detail(id),
    queryFn: () => buyingApi.getPurchaseOrderDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePOSuppliers = (search?: string) => {
  return useInfiniteQuery({
    queryKey: poKeys.metadata('suppliers', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getSuppliers(search);
        return Array.isArray(res?.data) ? res.data : [];
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
    staleTime: 5 * 60 * 1000,
  });
};

export const usePOItems = (search?: string) => {
  return useInfiniteQuery({
    queryKey: poKeys.metadata('items', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getItems(search);
        return Array.isArray(res?.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentLastPage = Array.isArray(lastPage) ? lastPage : [];
      if (currentLastPage.length < 50) return undefined; // metadataService.getItems limit is 50
      return (allPages?.length || 0) * 50;
    },
    initialPageParam: 0,
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
