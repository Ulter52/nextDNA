import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { ReportStats } from '../types';

export const reportKeys = {
  all: ['reports'] as const,
  overview: (company: string) => [...reportKeys.all, 'overview', company] as const,
  run: (name: string, filters: any) => [...reportKeys.all, 'run', name, filters] as const,
};

export const useReportOverview = (company: string) => {
  return useQuery<ReportStats>({
    queryKey: reportKeys.overview(company),
    queryFn: () => reportService.getReportOverview(company),
    enabled: !!company,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRunReport = (name: string, filters: any) => {
  return useQuery({
    queryKey: reportKeys.run(name, filters),
    queryFn: () => reportService.runReport(name, filters),
    enabled: !!name && !!filters.company,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
