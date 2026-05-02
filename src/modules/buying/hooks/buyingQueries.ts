import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';
import { frappeApi } from '../../../core/api/frappeApiHelpers';
import { getDateRanges } from '../../../core/utils/dateHelpers';

export const buyingKeys = {
  all: ['buying'] as const,
  suppliers: (search?: string) => [...buyingKeys.all, 'suppliers', search] as const,
  supplierDetail: (id: string) => [...buyingKeys.all, 'suppliers', 'detail', id] as const,
  metadata: (type: string, search?: string) => [...buyingKeys.all, 'metadata', type, { search }] as const,
  purchaseOrders: (params: any) => [...buyingKeys.all, 'purchaseOrders', params] as const,
  purchaseOrderDetail: (id: string) => [...buyingKeys.all, 'purchaseOrderDetail', id] as const,
  purchaseInvoices: (params: any) => [...buyingKeys.all, 'purchaseInvoices', params] as const,
  purchaseInvoiceDetail: (id: string) => [...buyingKeys.all, 'purchaseInvoiceDetail', id] as const,
  stats: () => [...buyingKeys.all, 'stats'] as const,
};

export const useSuppliers = (search?: string) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.suppliers(search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await buyingApi.getSuppliers(search, pageParam as number);
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierDetail = (id: string) => {
  return useQuery({
    queryKey: buyingKeys.supplierDetail(id),
    queryFn: async () => {
      const res = await buyingApi.getSupplierDetail(id);
      const supplier = res?.data;
      if (!supplier) return null;

      const [contactRes, addressRes] = await Promise.all([
        supplier.supplier_primary_contact ? buyingApi.getContactDetail(supplier.supplier_primary_contact).catch(() => null) : null,
        supplier.supplier_primary_address ? buyingApi.getAddressDetail(supplier.supplier_primary_address).catch(() => null) : null
      ]);

      return {
        ...supplier,
        contact_data: contactRes?.data,
        address_data: addressRes?.data
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSupplierGroups = (search?: string) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.metadata('supplierGroups', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getSupplierGroups(search);
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

export const useCountries = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('countries', search),
    queryFn: () => metadataService.getCountries(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useStates = (country?: string, search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('states', `${country}-${search}`),
    queryFn: () => metadataService.getStates(country, search).then(r => r?.data || []),
    enabled: !!country,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCurrencies = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('currencies', search),
    queryFn: () => metadataService.getCurrencies(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePaymentTerms = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('paymentTerms', search),
    queryFn: () => metadataService.getPaymentTerms(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTaxCategories = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('taxCategories', search),
    queryFn: () => metadataService.getTaxCategories(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useGSTCategories = () => {
  return useQuery({
    queryKey: buyingKeys.metadata('gstCategories'),
    queryFn: () => metadataService.getGSTCategories().then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePriceLists = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('priceLists', search),
    queryFn: () => metadataService.getPriceLists(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useBuyingItems = (search?: string) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.metadata('items', search),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await metadataService.getItems(search);
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
    staleTime: 5 * 60 * 1000,
  });
};

export const useCostCenters = (search?: string) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.metadata('costCenters', search),
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
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useWarehouses = (company?: string, search?: string) => {
  return useQuery({
    queryKey: buyingKeys.metadata('warehouses', `${company}-${search}`),
    queryFn: () => metadataService.getWarehouses(company, search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePurchaseStats = () => {
  return useQuery({
    queryKey: buyingKeys.stats(),
    queryFn: async () => {
      const companyRes = await frappeApi.getCompanies();
      const company = companyRes?.data?.[0]?.name;
      if (!company) return null;
      const ranges = getDateRanges();
      const { financialYear, prevFinancialYear } = ranges;
      const fromDate = prevFinancialYear.from_date;
      const toDate = financialYear.to_date;
      const res = await buyingApi.getPurchaseStats(company, fromDate, toDate);
      return { result: res?.result || [], columns: res?.columns || [] };
    },
    staleTime: 30 * 60 * 1000,
  });
};

export const useSaveSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return buyingApi.updateSupplier(id, data);
      }
      return buyingApi.createSupplier(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buyingKeys.suppliers() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: buyingKeys.supplierDetail(variables.id) });
      }
    },
  });
};

export const usePurchaseOrders = (params: { search?: string; status?: string }) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.purchaseOrders(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await buyingApi.getPurchaseOrders(params.search, params.status, pageParam as number);
        return Array.isArray(res) ? res : [];
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

export const usePurchaseOrderDetail = (id: string) => {
  return useQuery({
    queryKey: buyingKeys.purchaseOrderDetail(id),
    queryFn: () => buyingApi.getPurchaseOrderDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return buyingApi.updatePurchaseOrder(id, data);
      }
      return buyingApi.createPurchaseOrder(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buying', 'purchaseOrders'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: buyingKeys.purchaseOrderDetail(variables.id) });
      }
    },
  });
};

export const usePurchaseInvoices = (params: { search?: string; status?: string }) => {
  return useInfiniteQuery({
    queryKey: buyingKeys.purchaseInvoices(params),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await buyingApi.getPurchaseInvoices(params.search, params.status, pageParam as number);
        return Array.isArray(res) ? res : [];
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

export const usePurchaseInvoiceDetail = (id: string) => {
  return useQuery({
    queryKey: buyingKeys.purchaseInvoiceDetail(id),
    queryFn: () => buyingApi.getPurchaseInvoiceDetail(id).then(r => r?.data || null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSavePurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      if (id) {
        return buyingApi.updatePurchaseInvoice(id, data);
      }
      return buyingApi.createPurchaseInvoice(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buying', 'purchaseInvoices'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: buyingKeys.purchaseInvoiceDetail(variables.id) });
      }
    },
  });
};
