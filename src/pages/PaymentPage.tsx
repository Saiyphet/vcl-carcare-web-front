import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bump, errorCode, notify, report } from '../api';
import { PaymentSheet, type PayLine } from '../components/PaymentSheet';
import { StatusChip } from '../components/StatusChip';
import { Empty, PageHeader, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api, type Job, type PaymentInput } from '../lib/api';
import { formatPhone, isUnpaid, vehicleText } from '../utils/format';

export function isProductItem(item: Job['items'][number]) {
  return item.kind === 'PRODUCT' || Boolean(item.productId);
}

export function payLines(job: Job): PayLine[] {
  return job.items.map((item) => ({
    key: item.id,
    name: item.serviceName,
    price: item.price,
    qty: item.qty,
    unitPrice: item.unitPrice,
    product: isProductItem(item),
  }));
}

export function PaymentPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: job, loading, reload } = useApi(() => api.jobs.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stockProblem, setStockProblem] = useState(false);

  async function pay(payment: PaymentInput) {
    setBusy(true);
    setError('');
    setStockProblem(false);
    try {
      const paid = await api.jobs.pay(id, payment);
      bump();
      notify(`ຊຳລະແລ້ວ ${paid.code}`);
      navigate(`/jobs/${id}/receipt`, { replace: true });
    } catch (reason) {
      setError(report(reason, 'ຊຳລະບໍ່ສຳເລັດ'));
      const code = errorCode(reason);
      if (code === 'INSUFFICIENT_STOCK') setStockProblem(true);
      if (code === 'ALREADY_PAID') reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ຊຳລະເງິນ" />
      {loading && !job && <Skeleton rows={5} />}
      {!loading && !job && <Empty text="ບໍ່ພົບບິນນີ້" />}
      {job && (
        <>
          <div className="card">
            <div className="job-top">
              <b>{job.vehicle?.plateNo ?? job.code}</b>
              <StatusChip status={job.status} />
            </div>
            <div className="muted">{job.code}{job.vehicle ? ` · ${vehicleText(job.vehicle)}` : ''}</div>
            {job.customer && <div>{job.customer.name} · {formatPhone(job.customer.phone)}</div>}
          </div>
          {isUnpaid(job.status) ? (
            <>
              <PaymentSheet lines={payLines(job)} subtotal={job.subtotal} busy={busy} error={error} onConfirm={(payment) => void pay(payment)} />
              {stockProblem && (
                <div className="pad">
                  <Link className="btn ghost wide" to={`/jobs/${job.id}`}>ແກ້ໄຂບິນ</Link>
                </div>
              )}
            </>
          ) : (
            <div className="pad stack">
              <p className={job.status === 'DONE' ? 'paid-banner flush' : 'warn flush'}>
                {job.status === 'DONE' ? 'ບິນນີ້ຊຳລະແລ້ວ' : 'ບິນນີ້ຖືກຍົກເລີກ'}
              </p>
              {job.status === 'DONE' && <Link className="btn red wide" to={`/jobs/${job.id}/receipt`}>ເບິ່ງໃບບິນ</Link>}
              <Link className="btn ghost wide" to="/">ກັບໜ້າຫຼັກ</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
