import { useQuery } from '@tanstack/react-query';
import { metadataService } from '@core/services/metadataService';
import { runReport } from '@core/api/frappeApiHelpers';
import { getDateRanges } from '@core/utils/dateHelpers';

const keys = {
  all: ['serialNoLedger'] as const,
  items: (search?: string) => [...keys.all, 'items', { search }] as const,
  serialNos: (itemCode: string, search?: string) => [...keys.all, 'serialNos', { itemCode, search }] as const,
  ledger: (itemCode: string, serialNo: string) => [...keys.all, 'ledger', { itemCode, serialNo }] as const,
};

export const useItemsForLedger = (search?: string) => {
  return useQuery({
    queryKey: keys.items(search),
    queryFn: () => metadataService.getItems(search).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSerialNosForLedger = (itemCode: string, search?: string) => {
  return useQuery({
    queryKey: keys.serialNos(itemCode, search),
    queryFn: () => metadataService.getSerialNos(itemCode, search).then(r => r?.data || []),
    enabled: !!itemCode,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSerialNoLedger = (itemCode: string, serialNo: string) => {
  return useQuery({
    queryKey: keys.ledger(itemCode, serialNo),
    queryFn: () => {
      const { today } = getDateRanges();
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      return runReport('Serial No Ledger', {
        item_code: itemCode,
        serial_no: serialNo,
        posting_date: today,
        posting_time: currentTime
      }).then(r => r?.result || []);
    },
    enabled: !!itemCode && !!serialNo,
    staleTime: 1 * 60 * 1000,
  });
};
