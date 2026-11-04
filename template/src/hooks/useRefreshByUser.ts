import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh helper: only shows the refresh spinner for refreshes the
 * user started (not for background refetches).
 */
export function useRefreshByUser(refetch: () => unknown) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return { isRefreshing, refresh };
}
