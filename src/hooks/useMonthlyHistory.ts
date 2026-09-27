import { useCallback, useEffect, useState } from 'react';

import { listMonthlySummaries } from '@/dao/monthlySummariesDao';
import type { MonthlySummary } from '@/models';

export function useMonthlyHistory() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSummaries(await listMonthlySummaries());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summaries, loading, refresh };
}
