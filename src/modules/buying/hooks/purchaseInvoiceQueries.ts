import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';

export const piKeys = {
  all: ['purchaseInvoices'] as const,
  list: (params: any) => [...piKeys.all, 'list', params] as const,
  detail: (id: string) => [...piKeys.all, 'detail', id] as const,
  suppliers: (search?: string) => ['metadata', 'suppliers', search] as const,
  items: (search?: string) => ['metadata', 'items', search] as const,
  costCenters: (search?: string) => ['metadata', 'costCenters', search] as const,
};

export const usePurchaseInvoices = (params: { search?: string; status?: string }) => {
  return useQuery({
    queryKey: piKeys.list(params),
    queryFn: () => buyingApi.getPurchaseInvoices(params.search, params.status),
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
  return useQuery({
    queryKey: piKeys.suppliers(search),
    queryFn: () => metadataService.getSuppliers(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePIItems = (search?: string) => {
  return useQuery({
    queryKey: piKeys.items(search),
    queryFn: () => metadataService.getItems(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePICostCenters = (search?: string) => {
  return useQuery({
    queryKey: piKeys.costCenters(search),
    queryFn: () => metadataService.getCostCenters(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
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
