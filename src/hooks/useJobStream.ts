/**
 * Live queue: re-run `onEvent` whenever any device creates / moves / pays a job.
 *
 *   const refresh = useCallback(() => api.jobs.summary().then(setSummary), []);
 *   useJobStream(refresh);
 */
import { useEffect, useRef } from 'react';
import { API_URL, tokenStore } from '../lib/api';

export type JobEvent = {
  type: 'job.created' | 'job.updated' | 'job.status' | 'job.paid';
  jobId: string; code: string; status: string; jobType: 'SERVICE' | 'RETAIL'; branchId: string; plateNo: string | null; at: string;
};

/** USER / ADMIN: own branch (omit branchId). SUPER_ADMIN: all branches, or one with `branchId`. */
export function useJobStream(onEvent: (e: JobEvent) => void, branchId?: string, type: 'SERVICE' | 'RETAIL' | 'ALL' = 'SERVICE') {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    // EventSource cannot send headers, so the JWT goes in the query string
    const q = new URLSearchParams({ token, type, ...(branchId ? { branchId } : {}) });
    const es = new EventSource(`${API_URL}/api/v1/jobs/stream?${q}`);
    const handler = (m: MessageEvent) => cb.current(JSON.parse(m.data));
    const types = ['job.created', 'job.updated', 'job.status', 'job.paid'];
    types.forEach((t) => es.addEventListener(t, handler as EventListener));
    // EventSource reconnects by itself on network errors
    return () => es.close();
  }, [branchId, type]);
}
