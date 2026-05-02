import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { quotationService } from '../services/quotationService';
import { sellingService } from '../services/salesOrderService';

export const quotationKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  list: (filters: any) => [...quotationKeys.lists(), { filters }] as const,
  details: () => [...quotationKeys.all, 'detail'] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
  metadata: (type: string, search?: string) => [...quotationKeys.all, 'metadata', type, { search }] as const,
};

export const useQuotations = (search?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: quotationKeys.list({ search, status }),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await quotationService.getQuotations(search, status, pageParam as number);
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useQuotationDetail = (id: string) => {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => quotationService.getQuotation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: quotationKeys.metadata('companies'),
    queryFn: () => sellingService.getCompanies(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useSellingItems = (search?: string) => {
  return useInfiniteQuery({
    queryKey: quotationKeys.metadata('items', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await sellingService.getItems(search, pageParam as number);
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useTaxTemplates = (company?: string) => {
  return useQuery({
    queryKey: quotationKeys.metadata(`tax-templates-${company || ''}`),
    queryFn: () => sellingService.getSalesTaxesTemplates(company),
    enabled: !!company,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useSaveQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return quotationService.updateQuotation(id, data);
      }
      return quotationService.createQuotation(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
      }
    },
  });
};
