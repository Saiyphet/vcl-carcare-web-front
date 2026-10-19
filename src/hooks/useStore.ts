import { useEffect, useState, useSyncExternalStore } from 'react';
import { errorMessage, getBase, getSelectedBranchId, getSession, getToast, getVersion, report, subscribe } from '../api';
import { ApiError, isAdmin, isSuperAdmin } from '../lib/api';

export function useStore() {
  const base = useSyncExternalStore(subscribe, getBase, getBase);
  const session = useSyncExternalStore(subscribe, getSession, getSession);
  const branchId = useSyncExternalStore(subscribe, getSelectedBranchId, getSelectedBranchId);
  const admin = isAdmin(session);
  const superAdmin = isSuperAdmin(session);
  return { base, session, branchId, admin, superAdmin };
}

export function useToast() {
  return useSyncExternalStore(subscribe, getToast, getToast);
}

/**
 * Load data for one screen. Refetches when `deps` change, and — with `live` — whenever
 * the job stream or a save bumps the store version.
 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[], options: { live?: boolean; enabled?: boolean } = {}) {
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps);

  // a different filter must not show the previous filter's rows while loading
  useEffect(() => {
    setData(undefined);
  }, [key]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let off = false;
    setLoading(true);
    load()
      .then((next) => {
        if (off) return;
        setData(next);
        setError('');
      })
      .catch((reason: unknown) => {
        if (off) return;
        setError(errorMessage(reason, 'ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ'));
        if (!(reason instanceof ApiError) || reason.status !== 401) report(reason, 'ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ');
      })
      .finally(() => {
        if (!off) setLoading(false);
      });
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, options.live ? version : 0, tick]);

  return { data, error, loading, setData, reload: () => setTick((value) => value + 1) };
}
