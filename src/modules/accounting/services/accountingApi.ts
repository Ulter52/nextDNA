import { fetchResource, runReport, callMethod, createResource, updateResource } from '../../../core/api/frappeApiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { companyService } from '../../../core/services/companyService';

export interface FiscalYear {
  name: string;
  year_start_date: string;
  year_end_date: string;
  company?: string;
}

const STATS_CACHE_KEY = 'accounting_stats_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const accountingApi = {
  // --- Core Resource Methods (Stateless) ---
  
  getAccountBalances: (company: string, fy: FiscalYear) => {
    return runReport('Trial Balance', {
      company: company,
      fiscal_year: fy.name,
      from_date: fy.year_start_date,
      to_date: fy.year_end_date,
      with_period_closing_entry_for_opening: 1,
      with_period_closing_entry_for_current_period: 1,
      include_default_book_entries: 1,
      show_net_values: 1,
      show_group_accounts: 1,
      show_zero_values: 0
    });
  },

  getRecentTransactions: (company: string, limit = 10) => {
    return fetchResource('Payment Entry', {
      fields: '["name", "posting_date", "payment_type", "party_type", "party", "paid_amount", "status"]',
      filters: JSON.stringify([["company", "=", company]]),
      order_by: 'posting_date desc',
      limit_page_length: limit
    });
  },

  getPaymentEntries: (company: string, search = '', status = '', paymentType = '', partyType = '', start = 0, limit = 20) => {
    const filters: any[] = [["company", "=", company]];
    if (search) filters.push(["party", "like", `%${search}%`]);
    
    if (status && status !== 'All') {
      const docstatusMap: Record<string, number> = { 'Draft': 0, 'Submitted': 1, 'Cancelled': 2 };
      if (docstatusMap[status] !== undefined) filters.push(["docstatus", "=", docstatusMap[status]]);
    }

    if (paymentType && paymentType !== 'All') filters.push(["payment_type", "=", paymentType]);
    if (partyType && partyType !== 'All') filters.push(["party_type", "=", partyType]);

    return fetchResource('Payment Entry', {
      fields: '["name", "posting_date", "payment_type", "party_type", "party", "paid_amount", "status", "mode_of_payment", "docstatus"]',
      filters: JSON.stringify(filters),
      order_by: 'posting_date desc',
      limit_start: start,
      limit_page_length: limit
    });
  },

  getPaymentEntryDetail: (name: string) => fetchResource(`Payment Entry/${name}`),

  savePaymentEntry: (doc: any, name?: string) => {
    if (name) return updateResource('Payment Entry', name, doc);
    return createResource('Payment Entry', doc);
  },

  submitPaymentEntry: (name: string) => updateResource('Payment Entry', name, { docstatus: 1 }),

  getJournalEntries: (company: string, search = '', status = '', voucherType = '', start = 0, limit = 20) => {
    const filters: any[] = [["company", "=", company]];
    if (search) filters.push(["name", "like", `%${search}%`]);

    if (status && status !== 'All') {
      const docstatusMap: Record<string, number> = { 'Draft': 0, 'Submitted': 1, 'Cancelled': 2 };
      if (docstatusMap[status] !== undefined) filters.push(["docstatus", "=", docstatusMap[status]]);
    }

    if (voucherType && voucherType !== 'All') filters.push(["voucher_type", "=", voucherType]);

    return fetchResource('Journal Entry', {
      fields: '["name", "posting_date", "voucher_type", "total_debit", "total_credit", "docstatus"]',
      filters: JSON.stringify(filters),
      order_by: 'posting_date desc',
      limit_start: start,
      limit_page_length: limit
    });
  },

  getJournalEntryDetail: (name: string) => fetchResource(`Journal Entry/${name}`),

  saveJournalEntry: (doc: any, name?: string) => {
    if (name && typeof name === 'string') return updateResource('Journal Entry', name, doc);
    return createResource('Journal Entry', doc);
  },

  submitJournalEntry: (nameOrDoc: string | any) => {
    const name = typeof nameOrDoc === 'string' ? nameOrDoc : nameOrDoc?.name;
    if (!name) throw new Error('Invalid Journal Entry: missing name');
    return updateResource('Journal Entry', name, { docstatus: 1 });
  },

  getAccounts: (company: string, search = '', start = 0, limit = 50) => {
    const filters: any[] = [["company", "=", company], ["is_group", "=", 0]];
    if (search) filters.push(["account_name", "like", `%${search}%`]);
    
    return fetchResource('Account', { 
      fields: '["name", "account_name"]', 
      filters: JSON.stringify(filters),
      limit_start: start,
      limit_page_length: limit 
    });
  },

  getParties: (partyType: string, search = '', start = 0, limit = 50) => fetchResource(partyType, { 
    fields: '["name"]', 
    limit_start: start,
    limit_page_length: limit,
    filters: search ? JSON.stringify([["name", "like", `%${search}%`]]) : undefined
  }),

  getModesOfPayment: (search = '', start = 0, limit = 50) => fetchResource('Mode of Payment', { 
    fields: '["name"]', 
    limit_start: start,
    limit_page_length: limit,
    filters: search ? JSON.stringify([["name", "like", `%${search}%`]]) : undefined
  }),

  getDocDetail: (doctype: string, name: string) => callMethod('frappe.client.get', { doctype, name }),

  getPaymentEntryMeta: () => callMethod('frappe.desk.form.load.getdoctype', { doctype: 'Payment Entry' }),

  getJournalEntryMeta: () => callMethod('frappe.desk.form.load.getdoctype', { doctype: 'Journal Entry' }),

  getContactsForParty: (partyType: string, partyName: string) => {
    return fetchResource('Contact', {
      filters: JSON.stringify([
        ['Dynamic Link', 'link_doctype', '=', partyType],
        ['Dynamic Link', 'link_name', '=', partyName]
      ]),
      fields: '["name", "full_name"]',
      limit_page_length: 50
    });
  },

  getContactDetails: (contactName: string) => {
    return callMethod('frappe.contacts.doctype.contact.contact.get_contact_details', {
      contact: contactName
    });
  },

  // --- Higher Level Service Methods (Contextual & Cached) ---

  getAccountingStats: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(STATS_CACHE_KEY);
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

      await AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }));
      return stats;
    } catch (error) {
      console.error("Accounting Stats Error:", error);
      throw error;
    }
  },

  getPaymentEntryFilters: async () => {
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

  getJournalEntryFilters: async () => {
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
