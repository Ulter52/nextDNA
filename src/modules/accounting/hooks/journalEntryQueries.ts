import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';

const keys = {
  all: ['accounting'] as const,
  journal: () => [...keys.all, 'journalEntries'] as const,
  list: (company: string, search: string, status: string, vType: string) => 
    [...keys.journal(), 'list', company, search, status, vType] as const,
  detail: (id: string) => [...keys.journal(), 'detail', id] as const,
  metadata: (type: string, ...args: any[]) => [...keys.all, 'metadata', type, ...args] as const,
};

export const useJournalEntries = ({ company, search, status, voucherType }: any) => {
  return useInfiniteQuery({
    queryKey: keys.list(company, search, status, voucherType),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getJournalEntries(company, search, status, voucherType, pageParam as number);
        // Ensure we return the data array
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
    enabled: !!company,
    staleTime: 2 * 60 * 1000,
  });
};

export const useJournalEntryFilters = () => {
  return useQuery({
    queryKey: keys.metadata('journal-filters'),
    queryFn: () => accountingApi.getJournalEntryFilters(),
    staleTime: 24 * 60 * 60 * 1000,
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

export const useJournalAccountOptions = (company: string, search: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('accounts', `${company}-${search}`),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getAccounts(company, search, pageParam as number);
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
    enabled: !!company,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJournalPartyOptions = (partyType: string, search: string) => {
  return useInfiniteQuery({
    queryKey: keys.metadata('parties', `${partyType}-${search}`),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getParties(partyType, search, pageParam as number);
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
    enabled: !!partyType,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      return accountingApi.saveJournalEntry(data, id);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.journal() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingApi.submitJournalEntry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.journal() });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
};
