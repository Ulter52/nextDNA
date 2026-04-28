import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { sellingService } from '../services/salesOrderService';
import { companyService } from '../../../core/services/companyService';
import { metadataService } from '../../../core/services/metadataService';

export const sellingKeys = {
  all: ['selling'] as const,
  orders: (filters: any) => [...sellingKeys.all, 'orders', { filters }] as const,
  orderDetail: (id: string) => [...sellingKeys.all, 'orders', 'detail', id] as const,
  stats: (company?: string, fy?: string) => [...sellingKeys.all, 'stats', company, fy] as const,
  metadata: (type: string, search?: string) => [...sellingKeys.all, 'metadata', type, { search }] as const,
};

export const useSalesOrders = (search?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: sellingKeys.orders({ search, status }),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await sellingService.getSalesOrders(search, status, pageParam as number);
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

export const useSalesOrderDetail = (id: string) => {
  return useQuery({
    queryKey: sellingKeys.orderDetail(id),
    queryFn: () => sellingService.getSalesOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: sellingKeys.metadata('companies'),
    queryFn: () => sellingService.getCompanies(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useSellingItems = (search?: string) => {
  return useInfiniteQuery({
    queryKey: sellingKeys.metadata('items', search),
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

export const useWarehouses = () => {
  return useQuery({
    queryKey: sellingKeys.metadata('warehouses'),
    queryFn: () => sellingService.getWarehouses(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTaxCategories = () => {
  return useQuery({
    queryKey: sellingKeys.metadata('tax-categories'),
    queryFn: () => sellingService.getTaxCategories(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTaxTemplates = (company?: string) => {
  return useQuery({
    queryKey: sellingKeys.metadata(`tax-templates-${company || ''}`),
    queryFn: () => sellingService.getSalesTaxesTemplates(company),
    enabled: !!company,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useProjects = (search?: string) => {
  return useInfiniteQuery({
    queryKey: sellingKeys.metadata('projects', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getProjects(search);
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

export const useCostCenters = (search?: string) => {
  return useInfiniteQuery({
    queryKey: sellingKeys.metadata('cost-centers', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getCostCenters(search);
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
