import AsyncStorage from '@react-native-async-storage/async-storage';
import { frappeApi, fetchResource } from '../api/frappeApiHelpers';

const SELECTED_COMPANY_KEY = 'selected_erp_company_v2';
const COMPANIES_CACHE_KEY = 'erp_companies_cache';
const FISCAL_YEAR_CACHE_KEY = 'erp_fiscal_year_v2';
const ALL_FISCAL_YEARS_CACHE_KEY = 'erp_all_fiscal_years';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface Company {
  name: string;
  company_name: string;
  abbr: string;
}

export interface FiscalYear {
  name: string;
  year_start_date: string;
  year_end_date: string;
}

export const companyService = {
  async getSelectedCompany(): Promise<Company | null> {
    const data = await AsyncStorage.getItem(SELECTED_COMPANY_KEY);
    return data ? JSON.parse(data) : null;
  },

  async setSelectedCompany(company: Company): Promise<void> {
    await AsyncStorage.setItem(SELECTED_COMPANY_KEY, JSON.stringify(company));
  },

  async getAvailableCompanies(): Promise<Company[]> {
    // Try to get from cache first
    const cachedData = await AsyncStorage.getItem(COMPANIES_CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }

    // Fetch from API
    const res = await frappeApi.getCompanies();
    const companies = res?.data || [];
    
    // Save to cache
    if (companies.length > 0) {
      await AsyncStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify({
        data: companies,
        timestamp: Date.now()
      }));
    }
    
    return companies;
  },

  async ensureCompanySelected(): Promise<Company | null> {
    let selected = await this.getSelectedCompany();
    if (!selected) {
      const companies = await this.getAvailableCompanies();
      if (companies.length > 0) {
        selected = companies[0];
        await this.setSelectedCompany(selected);
      }
    }
    return selected;
  },

  async getFiscalYear(): Promise<FiscalYear> {
    // Check cache first
    const cached = await AsyncStorage.getItem(FISCAL_YEAR_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }

    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetchResource('Fiscal Year', {
        filters: JSON.stringify([
          ["year_start_date", "<=", today],
          ["year_end_date", ">=", today]
        ]),
        fields: '["name", "year_start_date", "year_end_date"]',
        limit_page_length: 1
      });
      
      const fy = res?.data?.[0];
      if (fy) {
        await AsyncStorage.setItem(FISCAL_YEAR_CACHE_KEY, JSON.stringify({
          data: fy,
          timestamp: Date.now()
        }));
        return fy;
      }
    } catch (err) {
      console.error("Fiscal Year fetch error:", err);
    }

    // Fallback
    return {
      name: '2025-26',
      year_start_date: '2025-04-01',
      year_end_date: '2026-03-31'
    };
  },

  async getAvailableFiscalYears(): Promise<FiscalYear[]> {
    const cached = await AsyncStorage.getItem(ALL_FISCAL_YEARS_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }

    try {
      const res = await fetchResource('Fiscal Year', {
        fields: '["name", "year_start_date", "year_end_date"]',
        order_by: 'year_start_date desc',
        limit_page_length: 20
      });
      
      const years = res?.data || [];
      if (years.length > 0) {
        await AsyncStorage.setItem(ALL_FISCAL_YEARS_CACHE_KEY, JSON.stringify({
          data: years,
          timestamp: Date.now()
        }));
      }
      return years;
    } catch (err) {
      console.error("Error fetching all fiscal years:", err);
      return [];
    }
  },

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(COMPANIES_CACHE_KEY);
    await AsyncStorage.removeItem(FISCAL_YEAR_CACHE_KEY);
    await AsyncStorage.removeItem(ALL_FISCAL_YEARS_CACHE_KEY);
  }
};
