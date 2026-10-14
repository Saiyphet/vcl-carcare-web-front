import type { JobStatus } from '../lib/api';
import { STATUS_LABEL, cls, isUnpaid } from '../utils/format';

export function StatusChip({ status }: { status: JobStatus }) {
  const tone = isUnpaid(status) ? 'ready' : status === 'DONE' ? 'done' : 'cancelled';
  return <span className={cls('status-chip', tone)}>{STATUS_LABEL[status]}</span>;
}
