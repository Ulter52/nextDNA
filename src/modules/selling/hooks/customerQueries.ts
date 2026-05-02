import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { metadataService } from '../../../core/services/metadataService';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: any) => [...customerKeys.lists(), { filters }] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  metadata: (type: string, search?: string) => [...customerKeys.all, 'metadata', type, { search }] as const,
};

export const useCustomers = (search?: string, filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: customerKeys.list({ search, ...filters }),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const data = await customerService.getCustomers(search, pageParam as number, 20, filters);
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

export const useCustomerGroups = (search?: string) => {
  return useInfiniteQuery({
    queryKey: customerKeys.metadata('groups', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getCustomerGroups(search);
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
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTerritories = (search?: string) => {
  return useInfiniteQuery({
    queryKey: customerKeys.metadata('territories', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getTerritories(search);
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
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCustomerDetail = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const customer = await customerService.getCustomerDetails(id);
      if (!customer) return null;

      const [addressRes, contactRes] = await Promise.all([
        customer.customer_primary_address ? customerService.getAddressDetail(customer.customer_primary_address).catch(() => null) : null,
        customer.customer_primary_contact ? customerService.getContactDetail(customer.customer_primary_contact).catch(() => null) : null,
      ]);

      return {
        ...customer,
        address_data: addressRes?.data,
        contact_data: contactRes?.data
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      }
    },
  });
};
