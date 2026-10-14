import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { branchParam, bump, notify, report } from '../api';
import { Icon } from '../components/Icon';
import { Empty, Kip, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, fileUrl, type Job } from '../lib/api';
import { colorHex, formatLaoDateTime, formatPhone, isLightColor, money, vehicleText } from '../utils/format';

function CarThumb({ job }: { job: Job }) {
  const photo = job.photos?.[0];
  if (photo) return <img className="thumb" src={fileUrl(photo.url)} alt={job.vehicle?.plateNo ?? ''} />;
  const hex = colorHex(job.vehicle?.color || '');
  return (
    <span className="thumb car" style={{ background: hex, color: isLightColor(hex) ? '#16161a' : '#fff' }}>
      <Icon name="car" size={26} />
    </span>
  );
}

export function CancelDialog({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone?: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const quick = ['ລູກຄ້າຍົກເລີກ', 'ບັນທຶກຜິດ', 'ລູກຄ້າບໍ່ລໍຖ້າ'];

  async function confirm() {
    if (!reason.trim()) {
      setError('ກະລຸນາໃສ່ເຫດຜົນ');
      return;
    }
    setBusy(true);
    try {
      await api.jobs.cancel(job.id, reason.trim());
      bump();
      notify(`ຍົກເລີກແລ້ວ ${job.code}`);
      onDone?.();
      onClose();
    } catch (reason) {
      setError(report(reason, 'ຍົກເລີກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`ຍົກເລີກ ${job.vehicle?.plateNo ?? job.code}`} onClose={onClose}>
      <label className="card-label" htmlFor="cancel-reason">ເຫດຜົນ</label>
      <label className="field">
        <input id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="ລູກຄ້າຍົກເລີກ" autoFocus />
      </label>
      <div className="quick mt">
        {quick.map((text) => (
          <button key={text} type="button" onClick={() => setReason(text)}>{text}</button>
        ))}
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="pair flush">
        <button type="button" className="btn ghost" onClick={onClose}>ກັບຄືນ</button>
        <button type="button" className="btn red" disabled={busy || !reason.trim()} onClick={() => void confirm()}>{busy ? '...' : 'ຢືນຢັນຍົກເລີກ'}</button>
      </div>
    </Sheet>
  );
}

export function UnpaidPage() {
  const { branchId } = useStore();
  const navigate = useNavigate();
  const [cancel, setCancel] = useState<Job | null>(null);
  const { data, loading } = useApi(() => api.jobs.unpaid(branchParam()), [branchId], { live: true });
  const jobs = [...(data ?? [])].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
  const total = jobs.reduce((sum, job) => sum + job.total, 0);

  return (
    <div className="page">
      <PageHeader title="ລໍຖ້າຊຳລະ" />
      <div className="sales-top pad">
        <div>
          <span className="muted">ລໍຖ້າຊຳລະ</span>
          <b className="block">{jobs.length} ຄັນ</b>
        </div>
        <div className="car-count">
          <span>ຍອດລວມ</span>
          <b><Kip value={total} /></b>
        </div>
      </div>
      {loading && !data && <Skeleton rows={4} />}
      {!loading && jobs.length === 0 && <Empty text="ບໍ່ມີລົດລໍຖ້າຊຳລະ" />}
      <div className="queue-list">
        {jobs.map((job) => (
          <article key={job.id} className="job">
            <CarThumb job={job} />
            <div className="job-body">
              <div className="job-top">
                <Link to={`/jobs/${job.id}`}><b>{job.vehicle?.plateNo ?? job.code}</b></Link>
                <time>{formatLaoDateTime(job.receivedAt)}</time>
              </div>
              <div className="muted">{vehicleText(job.vehicle) || job.code}</div>
              <div className="muted">{job.customer ? `${job.customer.name} · ${formatPhone(job.customer.phone)}` : 'ບໍ່ລະບຸລູກຄ້າ'}</div>
              <div className="muted">{job.items.map((item) => ((item.qty ?? 1) > 1 ? `${item.serviceName} ×${item.qty}` : item.serviceName)).join(' · ')}</div>
              <div className="job-foot">
                <b className="money">{money(job.total)} ກີບ</b>
                <div className="row-actions">
                  <button type="button" className="mini" onClick={() => setCancel(job)}>ຍົກເລີກ</button>
                  <button type="button" className="status-btn ready" onClick={() => navigate(`/jobs/${job.id}/pay`)}>ຊຳລະເງິນ</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {cancel && <CancelDialog job={cancel} onClose={() => setCancel(null)} />}
    </div>
  );
}
