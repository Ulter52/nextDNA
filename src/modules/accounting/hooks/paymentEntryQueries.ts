import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';

const keys = {
  all: ['accounting'] as const,
  payment: () => [...keys.all, 'paymentEntries'] as const,
  list: (company: string, search: string, status: string, type: string, partyType: string) => 
    [...keys.payment(), 'list', company, search, status, type, partyType] as const,
  detail: (id: string) => [...keys.payment(), 'detail', id] as const,
  filters: () => [...keys.all, 'paymentEntryFilters'] as const,
  metadata: (type: string, search?: string) => [...keys.all, 'metadata', type, { search }] as const,
};

export const usePaymentEntries = ({ company, search, status, paymentType, partyType }: any) => {
  return useInfiniteQuery({
    queryKey: keys.list(company, search, status, paymentType, partyType),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getPaymentEntries(company, search, status, paymentType, partyType, pageParam as number);
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

export const usePaymentEntryDetail = (id: string) => {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => accountingApi.getPaymentEntryDetail(id).then(r => r.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaymentEntryFilters = () => {
  return useQuery({
    queryKey: keys.filters(),
    queryFn: () => accountingApi.getPaymentEntryFilters(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const usePaymentEntryQueries = ({
  company,
  partyType,
  party,
  contactPerson,
  search
}: any) => {
  // Keeping this structure compatible with the old usage but using infinite queries under the hood where needed
  // Note: For simple selectors, we often just use the data. 
  // If the user scrolls, they'd trigger fetchNextPage in the Selector component.
  
  const accountsQuery = useInfiniteQuery({
    queryKey: keys.metadata('accounts', `${company}-${search.account}`),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getAccounts(company, search.account, pageParam as number);
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
  });

  const modesQuery = useInfiniteQuery({
    queryKey: keys.metadata('modes', search.mode),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getModesOfPayment(search.mode, pageParam as number);
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
  });

  const partiesQuery = useInfiniteQuery({
    queryKey: keys.metadata('parties', `${partyType}-${search.party}`),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const res = await accountingApi.getParties(partyType, search.party, pageParam as number);
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
  });

  const contactsQuery = useQuery({
    queryKey: keys.metadata('contacts', `${partyType}-${party}`),
    queryFn: () => accountingApi.getContactsForParty(partyType, party).then(r => r.data || []),
    enabled: !!party && !!partyType,
  });

  const contactDetailQuery = useQuery({
    queryKey: keys.metadata('contactDetail', contactPerson),
    queryFn: () => accountingApi.getContactDetails(contactPerson),
    enabled: !!contactPerson,
  });

  return {
    accountsRes: accountsQuery.data,
    fetchNextAccounts: accountsQuery.fetchNextPage,
    hasNextAccounts: accountsQuery.hasNextPage,
    isFetchingAccounts: accountsQuery.isFetchingNextPage,

    modesRes: modesQuery.data,
    fetchNextModes: modesQuery.fetchNextPage,
    hasNextModes: modesQuery.hasNextPage,
    isFetchingModes: modesQuery.isFetchingNextPage,

    partiesRes: partiesQuery.data,
    fetchNextParties: partiesQuery.fetchNextPage,
    hasNextParties: partiesQuery.hasNextPage,
    isFetchingParties: partiesQuery.isFetchingNextPage,

    contacts: contactsQuery.data || [],
    contactDetail: contactDetailQuery.data,

    loadingOptions:
      accountsQuery.isLoading ||
      modesQuery.isLoading ||
      partiesQuery.isLoading ||
      contactsQuery.isLoading,
  };
};

export const useSavePaymentEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, id }: { data: any; id?: string }) => {
      return accountingApi.savePaymentEntry(data, id);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.payment() });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
      }
    },
  });
};

export const useSubmitPaymentEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingApi.submitPaymentEntry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.payment() });
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
    },
  });
};
