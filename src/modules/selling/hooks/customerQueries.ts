import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { metadataService } from '../../../core/services/metadataService';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: any) => [...customerKeys.lists(), { filters }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  metadata: (type: string) => [...customerKeys.all, 'metadata', type] as const,
};

export const useCustomers = (search?: string, filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: customerKeys.list({ search, ...filters }),
    queryFn: async ({ pageParam = 0 }) => {
      const data = await customerService.getCustomers(search, pageParam as number, 20, filters);
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage && lastPage.length === 20 ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerGroups = () => {
  return useQuery({
    queryKey: customerKeys.metadata('groups'),
    queryFn: () => metadataService.getSupplierGroups().then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useSaveCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return customerService.updateCustomer(id, data);
      }
      return customerService.createCustomer(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};
