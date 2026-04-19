import { useQuery } from '@tanstack/react-query';
import { sellingService } from '../services/salesOrderService';
import { companyService } from '../../../core/services/companyService';

export const sellingKeys = {
  all: ['selling'] as const,
  stats: (company?: string, fy?: string) => [...sellingKeys.all, 'stats', company, fy] as const,
};

export const useSalesStats = () => {
  return useQuery({
    queryKey: sellingKeys.stats(),
    queryFn: async () => {
      try {
        const [company, fy] = await Promise.all([
          companyService.ensureCompanySelected(),
          companyService.getFiscalYear()
        ]);

        if (!company || !fy) return null;

        const res = await sellingService.getSalesAnalytics(
          company.name, 
          fy.year_start_date, 
          fy.year_end_date
        );
        
        return res?.result || [];
      } catch (error) {
        console.error("Error in useSalesStats queryFn:", error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });
};
