import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchResource, createResource, updateResource } from '@core/api/frappeApiHelpers';

export const itemPriceKeys = {
  all: ['itemPrices'] as const,
  list: (params: any) => [...itemPriceKeys.all, 'list', params] as const,
  detail: (id: string) => [...itemPriceKeys.all, 'detail', id] as const,
  priceLists: () => ['priceLists'] as const,
};

export const useItemPrices = (params: { search?: string; priceList?: string }) => {
  return useQuery({
    queryKey: itemPriceKeys.list(params),
    queryFn: async () => {
      const filters: any[] = [];
      if (params.search) {
        filters.push(["item_code", "like", `%${params.search}%`]);
      }
      if (params.priceList) {
        filters.push(["price_list", "=", params.priceList]);
      }

      return fetchResource('Item Price', {
        fields: '["name", "item_code", "item_name", "price_list", "price_list_rate", "currency"]',
        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
        order_by: 'modified desc',
        limit_page_length: 50
      }).then(r => r?.data || []);
    },
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

export const usePriceLists = () => {
  return useQuery({
    queryKey: itemPriceKeys.priceLists(),
    queryFn: () => fetchResource('Price List', { fields: '["name"]' }).then(r => r?.data || []),
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
