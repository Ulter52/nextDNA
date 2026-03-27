import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../services/stockApi';

const keys = {
  stats: () => ['stockStats'],
};

export const useStockStats = (forceRefresh = false) => {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => stockApi.getStockDashboardStats(forceRefresh),
    staleTime: 5 * 60 * 1000,
  });
};
