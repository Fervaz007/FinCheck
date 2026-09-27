import { useCallback, useEffect, useState } from 'react';

import {
  createAccount,
  deactivateAccount,
  listAccountsWithBalances,
  updateAccount,
} from '@/dao/accountsDao';
import type { NewAccount } from '@/models';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof listAccountsWithBalances>>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await listAccountsWithBalances());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    accounts,
    loading,
    refresh,
    create: async (input: NewAccount) => {
      await createAccount(input);
      await refresh();
    },
    update: async (id: number, input: Partial<NewAccount>) => {
      await updateAccount(id, input);
      await refresh();
    },
    deactivate: async (id: number) => {
      await deactivateAccount(id);
      await refresh();
    },
  };
}
