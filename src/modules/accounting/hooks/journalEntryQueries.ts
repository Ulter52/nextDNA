import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';

const keys = {
  list: (company: string, search: string, status: string, vType: string) => 
    ['journalEntries', company, search, status, vType],
  detail: (id: string) => ['journalEntry', id],
  filters: () => ['journalEntryFilters'],
  accounts: (company: string, search: string) => ['accounts', company, search],
  parties: (type: string, search: string) => ['parties', type, search],
};

export const useJournalEntries = ({ company, search, status, voucherType }: any) => {
  return useQuery({
    queryKey: keys.list(company, search, status, voucherType),
    queryFn: () => accountingApi.getJournalEntries(company, search, status, voucherType),
    enabled: !!company,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useJournalEntryDetail = (id: string) => {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => accountingApi.getJournalEntryDetail(id).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJournalEntryFilters = () => {
  return useQuery({
    queryKey: keys.filters(),
    queryFn: () => accountingApi.getJournalEntryFilters(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useJournalAccountOptions = (company: string, search: string) => {
  return useQuery({
    queryKey: keys.accounts(company, search),
    queryFn: () => accountingApi.getAccounts(company, search).then(r => r.data || []),
    enabled: !!company,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJournalPartyOptions = (partyType: string, search: string) => {
  return useQuery({
    queryKey: keys.parties(partyType, search),
    queryFn: () => accountingApi.getParties(partyType, search).then(r => r.data || []),
    enabled: !!partyType,
    staleTime: 5 * 60 * 1000,
  });
};
