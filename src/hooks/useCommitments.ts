import { useCallback, useEffect, useState } from 'react';

import {
  createCommitment,
  deactivateCommitment,
  listActiveCommitmentsResolved,
  markPeriodReserved,
  resetCommitmentCycle,
  type NewCommitment,
} from '@/dao/commitmentsDao';

export function useCommitments() {
  const [commitments, setCommitments] = useState<Awaited<ReturnType<typeof listActiveCommitmentsResolved>>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCommitments(await listActiveCommitmentsResolved());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    commitments,
    loading,
    refresh,
    create: async (input: NewCommitment) => {
      await createCommitment(input);
      await refresh();
    },
    deactivate: async (id: number) => {
      await deactivateCommitment(id);
      await refresh();
    },
    markPeriodReserved: async (id: number) => {
      await markPeriodReserved(id);
      await refresh();
    },
    resetCycle: async (id: number) => {
      await resetCommitmentCycle(id);
      await refresh();
    },
  };
}
