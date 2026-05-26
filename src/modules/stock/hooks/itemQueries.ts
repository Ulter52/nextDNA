import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';
import { metadataService } from '../../../core/services/metadataService';
import { companyService } from '../../../core/services/companyService';

const keys = {
  list: (search: string, filters: any) => ['itemList', search, filters],
  detail: (itemCode: string) => ['itemDetail', itemCode],
  metadata: (type: string, search?: string) => ['metadata', type, { search }],
};

export const useItems = (search: string, filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: keys.list(search, filters),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await stockApi.getItems(50, search, filters, pageParam as number);
        return Array.isArray(res?.data) ? res.data : [];
      } catch (e) {
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentLastPage = Array.isArray(lastPage) ? lastPage : [];
      if (currentLastPage.length < 50) return undefined;
      return (allPages?.length || 0) * 50;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });
};

export const useItemDetail = (itemCode: string) => {
  return useQuery({
    queryKey: keys.detail(itemCode),
    queryFn: () => stockApi.getItemDetails(itemCode).then(r => r.data),
    enabled: !!itemCode,
    staleTime: 5 * 60 * 1000,
  });
};

export const useItemGroups = (search?: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('itemGroups', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getItemGroups(search);
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

export const useBrands = (search?: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('brands', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getBrands(search);
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

export const useUOMs = (search?: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('uoms', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getUOMs(search);
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

export const useTaxTemplates = (search?: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('taxTemplates', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getItemTaxTemplates(search);
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

export const useHSNCodes = (search?: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('hsnCodes', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getHSNCodes(search);
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

export const useWarehouses = (company: string, search?: string) => {
  return useQuery({
    queryKey: keys.metadata('warehouses', `${company}-${search}`),
    queryFn: () => metadataService.getWarehouses(company, search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
