import { accountingApi } from './accountingApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { companyService } from '../../../core/services/companyService';

const CACHE_KEY = 'accounting_stats_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const accountingService = {
  async getAccountingStats(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) return data;
      }
    }

    const [selectedCompany, fy] = await Promise.all([
      companyService.getSelectedCompany(),
      companyService.getFiscalYear()
    ]);
    
    const company = selectedCompany?.name || 'DNA Retail Enterprises';

    try {
      const [tbRes, recentRes] = await Promise.all([
        accountingApi.getAccountBalances(company, fy),
        accountingApi.getRecentTransactions(company, 10)
      ]);

      const tbRows = tbRes?.result || [];
      let bankBalance = 0;
      let cashBalance = 0;
      let foundBankGroup = false;
      let foundCashGroup = false;

      const processedTB = tbRows.map((row: any) => {
        if (typeof row !== 'object' || row === null) return row;
        const accName = (row.account_name || row.account || '').trim().toLowerCase();
        const dr = parseFloat(row.closing_debit || row.opening_debit || 0);
        const cr = parseFloat(row.closing_credit || row.opening_credit || 0);
        const netBalance = dr - cr;
        row.closing_balance = netBalance;

        if (accName === "bank accounts") {
          bankBalance = netBalance;
          foundBankGroup = true;
        } else if (accName === "cash in hand" || accName === "cash") {
          cashBalance = netBalance;
          foundCashGroup = true;
        }
        return row;
      });

      if (!foundBankGroup || !foundCashGroup) {
        processedTB.forEach((row: any) => {
           const accNameLower = (row.account_name || row.account || '').toLowerCase();
           if (row.is_group_account === 1 || row.is_group === 1 || row.is_group === true) {
             if (!foundBankGroup && accNameLower.includes("bank accounts")) { bankBalance = row.closing_balance; foundBankGroup = true; }
             if (!foundCashGroup && accNameLower.includes("cash in hand")) { cashBalance = row.closing_balance; foundCashGroup = true; }
           }
        });
      }

      const stats = {
        bank_balance: bankBalance,
        cash_balance: cashBalance,
        recent_transactions: recentRes?.data || [],
        trial_balance: processedTB,
        last_updated: new Date().toISOString(),
        company: company,
        fiscal_year: fy.name
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }));
      return stats;
    } catch (error) {
      console.error("Accounting Service Error:", error);
      throw error;
    }
  },

  async getPaymentEntries(search = '', status = '', paymentType = '', partyType = '') {
    const company = await companyService.getSelectedCompany();
    return accountingApi.getPaymentEntries(company?.name || '', search, status, paymentType, partyType);
  },

  async getJournalEntries(search = '', status = '', voucherType = '') {
    const company = await companyService.getSelectedCompany();
    return accountingApi.getJournalEntries(company?.name || '', search, status, voucherType);
  },

  async getPaymentEntryFilters() {
    try {
      const metaRes = await accountingApi.getPaymentEntryMeta();
      const fields = metaRes?.data?.fields || [];
      
      const paymentTypeField = fields.find((f: any) => f.fieldname === 'payment_type');
      const partyTypeField = fields.find((f: any) => f.fieldname === 'party_type');

      const parseOptions = (field: any) => {
        if (!field?.options) return [];
        return field.options.split('\n')
          .filter((opt: string) => opt.trim().length > 0)
          .map((opt: string) => ({
            name: opt.trim(),
            value: opt.trim()
          }));
      };

      return {
        paymentTypes: [{ name: 'All Types', value: 'All' }, ...parseOptions(paymentTypeField)],
        partyTypes: [{ name: 'All Parties', value: 'All' }, ...parseOptions(partyTypeField)]
      };
    } catch (err) {
      console.error("Failed to fetch Payment Entry filters", err);
      return { paymentTypes: [], partyTypes: [] };
    }
  },

  async getJournalEntryFilters() {
    try {
      const metaRes = await accountingApi.getJournalEntryMeta();
      const fields = metaRes?.data?.fields || [];
      
      const voucherTypeField = fields.find((f: any) => f.fieldname === 'voucher_type');

      const parseOptions = (field: any) => {
        if (!field?.options) return [];
        return field.options.split('\n')
          .filter((opt: string) => opt.trim().length > 0)
          .map((opt: string) => ({
            name: opt.trim(),
            value: opt.trim()
          }));
      };

      return {
        voucherTypes: [{ name: 'All Types', value: 'All' }, ...parseOptions(voucherTypeField)]
      };
    } catch (err) {
      console.error("Failed to fetch Journal Entry filters", err);
      return { voucherTypes: [] };
    }
  }
};
