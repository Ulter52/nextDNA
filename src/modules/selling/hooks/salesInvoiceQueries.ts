import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { salesInvoiceService } from '../services/salesInvoiceService';

export const salesInvoiceKeys = {
  all: ['salesInvoices'] as const,
  lists: () => [...salesInvoiceKeys.all, 'list'] as const,
  list: (filters: any) => [...salesInvoiceKeys.lists(), { filters }] as const,
  details: () => [...salesInvoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...salesInvoiceKeys.details(), id] as const,
};

export const useSalesInvoices = (search?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: salesInvoiceKeys.list({ search, status }),
    queryFn: ({ pageParam = 0 }) => 
      salesInvoiceService.getSalesInvoices(search, status, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesInvoiceDetail = (id: string) => {
  return useQuery({
    queryKey: salesInvoiceKeys.detail(id),
    queryFn: () => salesInvoiceService.getSalesInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveSalesInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        // Implementation for update if service supports it
        return salesInvoiceService.createSalesInvoice(data);
      }
      return salesInvoiceService.createSalesInvoice(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.detail(variables.id) });
      }
    },
  });
};
