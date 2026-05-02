import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';

export const piKeys = {
  all: ['purchaseInvoices'] as const,
  list: (params: any) => [...piKeys.all, 'list', params] as const,
  detail: (id: string) => [...piKeys.all, 'detail', id] as const,
  metadata: (type: string, search?: string) => [...piKeys.all, 'metadata', type, { search }] as const,
};

export const usePurchaseInvoices = (params: { search?: string; status?: string }) => {
  return useInfiniteQuery({
    queryKey: piKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await buyingApi.getPurchaseInvoices(params.search, params.status, pageParam as number);
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

export const usePurchaseInvoiceDetail = (id: string) => {
  return useQuery({
    queryKey: piKeys.detail(id),
    queryFn: () => buyingApi.getPurchaseInvoiceDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePISuppliers = (search?: string) => {
  return useInfiniteQuery({
    queryKey: piKeys.metadata('suppliers', search),
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

export const usePIItems = (search?: string) => {
  return useInfiniteQuery({
    queryKey: piKeys.metadata('items', search),
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
      if (currentLastPage.length < 50) return undefined;
      return (allPages?.length || 0) * 50;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return buyingApi.updatePurchaseInvoice(id, data);
      }
      return buyingApi.createPurchaseInvoice(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: piKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: piKeys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitPurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buyingApi.submitPurchaseInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: piKeys.all });
      queryClient.invalidateQueries({ queryKey: piKeys.detail(id) });
    },
  });
};
