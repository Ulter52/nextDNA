import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { sellingService } from '../services/salesOrderService';
import { companyService } from '../../../core/services/companyService';

export const sellingKeys = {
  all: ['selling'] as const,
  orders: (filters: any) => [...sellingKeys.all, 'orders', { filters }] as const,
  orderDetail: (id: string) => [...sellingKeys.all, 'orders', 'detail', id] as const,
  stats: (company?: string, fy?: string) => [...sellingKeys.all, 'stats', company, fy] as const,
};

export const useSalesOrders = (search?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: sellingKeys.orders({ search, status }),
    queryFn: ({ pageParam = 0 }) => 
      sellingService.getSalesOrders(search, status, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesOrderDetail = (id: string) => {
  return useQuery({
    queryKey: sellingKeys.orderDetail(id),
    queryFn: () => sellingService.getSalesOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesStats = () => {
  return useQuery({
    queryKey: sellingKeys.stats(),
    queryFn: async () => {
      try {
        const [company, fy] = await Promise.all([
          companyService.ensureCompanySelected(),
          companyService.getFiscalYear()
        ]);

        if (!company || !fy) return null;

        const res = await sellingService.getSalesAnalytics(
          company.name, 
          fy.year_start_date, 
          fy.year_end_date
        );
        
        return res?.result || [];
      } catch (error) {
        console.error("Error in useSalesStats queryFn:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useSaveSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return sellingService.updateSalesOrder(id, data);
      }
      return sellingService.createSalesOrder(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: sellingKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: sellingKeys.orderDetail(variables.id) });
      }
    },
  });
};
