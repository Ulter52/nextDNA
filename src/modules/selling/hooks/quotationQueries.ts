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
    queryFn: ({ pageParam = 0 }) => 
      quotationService.getQuotations(search, status, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
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
  return useQuery({
    queryKey: quotationKeys.metadata('items', search),
    queryFn: () => sellingService.getItems(search),
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
        return quotationService.createQuotation(data); 
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
