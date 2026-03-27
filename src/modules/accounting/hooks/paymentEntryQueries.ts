import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';

const keys = {
  list: (company: string, search: string, status: string, type: string, partyType: string) => 
    ['paymentEntries', company, search, status, type, partyType],
  filters: () => ['paymentEntryFilters'],
  accounts: (company: string, search: string) => ['accounts', company, search],
  modes: (search: string) => ['modes', search],
  parties: (type: string, search: string) => ['parties', type, search],
  contacts: (type: string, party: string) => ['contacts', type, party],
  contactDetail: (name: string) => ['contactDetail', name],
};

export const usePaymentEntries = ({ company, search, status, paymentType, partyType }: any) => {
  return useQuery({
    queryKey: keys.list(company, search, status, paymentType, partyType),
    queryFn: () => accountingApi.getPaymentEntries(company, search, status, paymentType, partyType),
    enabled: !!company,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

export const usePaymentEntryFilters = () => {
  return useQuery({
    queryKey: keys.filters(),
    queryFn: () => accountingApi.getPaymentEntryFilters(),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });
};

export const usePaymentEntryQueries = ({
  company,
  partyType,
  party,
  contactPerson,
  search
}: any) => {

  const accountsQuery = useQuery({
    queryKey: keys.accounts(company, search.account),
    queryFn: () =>
      accountingApi.getAccounts(company, search.account).then(r => r.data || []),
    enabled: !!company,
    staleTime: 5 * 60 * 1000,
  });

  const modesQuery = useQuery({
    queryKey: keys.modes(search.mode),
    queryFn: () =>
      accountingApi.getModesOfPayment(search.mode).then(r => r.data || []),
    staleTime: 10 * 60 * 1000,
  });

  const partiesQuery = useQuery({
    queryKey: keys.parties(partyType, search.party),
    queryFn: () =>
      accountingApi.getParties(partyType, search.party).then(r => r.data || []),
    enabled: !!partyType,
  });

  const contactsQuery = useQuery({
    queryKey: keys.contacts(partyType, party),
    queryFn: () =>
      accountingApi.getContactsForParty(partyType, party).then(r => r.data || []),
    enabled: !!party && !!partyType,
  });

  const contactDetailQuery = useQuery({
    queryKey: keys.contactDetail(contactPerson),
    queryFn: () => accountingApi.getContactDetails(contactPerson),
    enabled: !!contactPerson,
  });

  return {
    accounts: accountsQuery.data || [],
    modes: modesQuery.data || [],
    parties: partiesQuery.data || [],
    contacts: contactsQuery.data || [],
    contactDetail: contactDetailQuery.data,

    loadingOptions:
      accountsQuery.isLoading ||
      modesQuery.isLoading ||
      partiesQuery.isLoading ||
      contactsQuery.isLoading,
  };
};
