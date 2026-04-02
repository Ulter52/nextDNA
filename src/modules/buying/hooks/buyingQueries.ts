import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingApi } from '../services/buyingApi';
import { metadataService } from '../../../core/services/metadataService';
import { frappeApi } from '../../../core/api/frappeApiHelpers';
import { getDateRanges } from '../../../core/utils/dateHelpers';

export const buyingKeys = {
  all: ['buying'] as const,
  suppliers: (search?: string) => [...buyingKeys.all, 'suppliers', search] as const,
  supplierDetail: (id: string) => [...buyingKeys.all, 'suppliers', 'detail', id] as const,
  supplierGroups: (search?: string) => [...buyingKeys.all, 'metadata', 'supplierGroups', search] as const,
  countries: (search?: string) => [...buyingKeys.all, 'metadata', 'countries', search] as const,
  states: (country?: string, search?: string) => [...buyingKeys.all, 'metadata', 'states', country, search] as const,
  currencies: (search?: string) => [...buyingKeys.all, 'metadata', 'currencies', search] as const,
  paymentTerms: (search?: string) => [...buyingKeys.all, 'metadata', 'paymentTerms', search] as const,
  taxCategories: (search?: string) => [...buyingKeys.all, 'metadata', 'taxCategories', search] as const,
  gstCategories: () => [...buyingKeys.all, 'metadata', 'gstCategories'] as const,
  priceLists: (search?: string) => [...buyingKeys.all, 'metadata', 'priceLists', search] as const,
  purchaseOrders: (params: any) => [...buyingKeys.all, 'purchaseOrders', params] as const,
  purchaseOrderDetail: (id: string) => [...buyingKeys.all, 'purchaseOrderDetail', id] as const,
  purchaseInvoices: (params: any) => [...buyingKeys.all, 'purchaseInvoices', params] as const,
  purchaseInvoiceDetail: (id: string) => [...buyingKeys.all, 'purchaseInvoiceDetail', id] as const,
  costCenters: (search?: string) => ['metadata', 'costCenters', search] as const,
  items: (search?: string) => ['metadata', 'items', search] as const,
  stats: () => [...buyingKeys.all, 'stats'] as const,
};

export const useSuppliers = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.suppliers(search),
    queryFn: () => buyingApi.getSuppliers(search).then(r => r?.data || []),
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
  return useQuery({
    queryKey: buyingKeys.supplierGroups(search),
    queryFn: () => metadataService.getSupplierGroups(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCountries = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.countries(search),
    queryFn: () => metadataService.getCountries(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useStates = (country?: string, search?: string) => {
  return useQuery({
    queryKey: buyingKeys.states(country, search),
    queryFn: () => metadataService.getStates(country, search).then(r => r?.data || []),
    enabled: !!country,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useCurrencies = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.currencies(search),
    queryFn: () => metadataService.getCurrencies(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePaymentTerms = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.paymentTerms(search),
    queryFn: () => metadataService.getPaymentTerms(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTaxCategories = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.taxCategories(search),
    queryFn: () => metadataService.getTaxCategories(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useGSTCategories = () => {
  return useQuery({
    queryKey: buyingKeys.gstCategories(),
    queryFn: () => metadataService.getGSTCategories().then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePriceLists = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.priceLists(search),
    queryFn: () => metadataService.getPriceLists(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePurchaseStats = () => {
  return useQuery({
    queryKey: buyingKeys.stats(),
    queryFn: async () => {
      // 1. Resolve Company
      const companyRes = await frappeApi.getCompanies();
      const company = companyRes?.data?.[0]?.name;
      if (!company) return null;
      
      // 2. Resolve Date Ranges (April to March)
      const ranges = getDateRanges();
      const { financialYear, prevFinancialYear } = ranges;
      
      // We need data from the START of the PREVIOUS FY to the END of the CURRENT FY
      const fromDate = prevFinancialYear.from_date; // e.g., 2024-04-01
      const toDate = financialYear.to_date;         // e.g., 2026-03-31
      
      const res = await buyingApi.getPurchaseStats(company, fromDate, toDate);
      return {
        result: res?.result || [],
        columns: res?.columns || []
      };
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

export const useBuyingItems = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.items(search),
    queryFn: () => metadataService.getItems(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCostCenters = (search?: string) => {
  return useQuery({
    queryKey: buyingKeys.costCenters(search),
    queryFn: () => metadataService.getCostCenters(search).then(r => r?.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePurchaseOrders = (params: { search?: string; status?: string }) => {
  return useQuery({
    queryKey: buyingKeys.purchaseOrders(params),
    queryFn: () => buyingApi.getPurchaseOrders(params.search, params.status),
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
  return useQuery({
    queryKey: buyingKeys.purchaseInvoices(params),
    queryFn: () => buyingApi.getPurchaseInvoices(params.search, params.status),
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
