import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../services/accountingApi';

const keys = {
  stats: (forceRefresh: boolean) => ['accountingStats', forceRefresh],
  trialBalance: (forceRefresh: boolean) => ['trialBalance', forceRefresh],
};

export const useAccountingStats = (forceRefresh = false) => {
  return useQuery({
    queryKey: keys.stats(forceRefresh),
    queryFn: () => accountingApi.getAccountingStats(forceRefresh),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
