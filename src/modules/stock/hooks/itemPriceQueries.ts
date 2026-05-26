import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchResource, createResource, updateResource } from '@core/api/frappeApiHelpers';

export const itemPriceKeys = {
  all: ['itemPrices'] as const,
  list: (params: any) => [...itemPriceKeys.all, 'list', params] as const,
  detail: (id: string) => [...itemPriceKeys.all, 'detail', id] as const,
  metadata: (type: string, search?: string) => [...itemPriceKeys.all, 'metadata', type, { search }] as const,
};

export const useItemPrices = (params: { search?: string; priceList?: string }) => {
  return useInfiniteQuery({
    queryKey: itemPriceKeys.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const filters: any[] = [];
        if (params.search) {
          filters.push(["item_code", "like", `%${params.search}%`]);
        }
        if (params.priceList) {
          filters.push(["price_list", "=", params.priceList]);
        }

        const res = await fetchResource('Item Price', {
          fields: '["name", "item_code", "item_name", "price_list", "price_list_rate", "currency"]',
          filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
          order_by: 'modified desc',
          limit_start: pageParam as number,
          limit_page_length: 20
        });
        return Array.isArray(res?.data) ? res.data : [];
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

export const useItemPriceDetail = (id: string) => {
  return useQuery({
    queryKey: itemPriceKeys.detail(id),
    queryFn: () => fetchResource(`Item Price/${id}`).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePriceLists = (search?: string) => {
  return useInfiniteQuery({
    queryKey: itemPriceKeys.metadata('priceLists', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
        const res = await fetchResource('Price List', { 
          fields: '["name"]',
          filters,
          limit_start: pageParam as number,
          limit_page_length: 100,
          order_by: 'name asc'
        });
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

export const useSaveItemPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return updateResource('Item Price', id, data);
      }
      return createResource('Item Price', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itemPriceKeys.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: itemPriceKeys.detail(variables.id) });
      }
    },
  });
};
