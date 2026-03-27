import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';
import { metadataService } from '../../../core/services/metadataService';
import { companyService } from '../../../core/services/companyService';

const keys = {
  list: (search: string, filters: any) => ['itemList', search, filters],
  detail: (itemCode: string) => ['itemDetail', itemCode],
  itemGroups: (search?: string) => ['itemGroups', search],
  brands: (search?: string) => ['brands', search],
  uoms: (search?: string) => ['uoms', search],
  taxTemplates: (search?: string) => ['taxTemplates', search],
  hsnCodes: (search?: string) => ['hsnCodes', search],
  warehouses: (company: string, search?: string) => ['warehouses', company, search],
};

export const useItems = (search: string, filters: any = {}) => {
  return useQuery({
    queryKey: keys.list(search, filters),
    queryFn: async () => {
      const company = await companyService.getSelectedCompany();
      return stockApi.getItems(100, search, filters);
    },
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
  return useQuery({
    queryKey: keys.itemGroups(search),
    queryFn: () => metadataService.getItemGroups(search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useBrands = (search?: string) => {
  return useQuery({
    queryKey: keys.brands(search),
    queryFn: () => metadataService.getBrands(search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useUOMs = (search?: string) => {
  return useQuery({
    queryKey: keys.uoms(search),
    queryFn: () => metadataService.getUOMs(search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useTaxTemplates = (search?: string) => {
  return useQuery({
    queryKey: keys.taxTemplates(search),
    queryFn: () => metadataService.getItemTaxTemplates(search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useHSNCodes = (search?: string) => {
  return useQuery({
    queryKey: keys.hsnCodes(search),
    queryFn: () => metadataService.getHSNCodes(search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useWarehouses = (company: string, search?: string) => {
  return useQuery({
    queryKey: keys.warehouses(company, search),
    queryFn: () => metadataService.getWarehouses(company, search).then(r => r.data || []),
    staleTime: 24 * 60 * 60 * 1000,
  });
};
