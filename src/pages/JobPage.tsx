import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bump, fieldErrors, notify, report } from '../api';
import { Icon } from '../components/Icon';
import { PayLines } from '../components/PaymentSheet';
import { cartTotal, ProductPicker, type CartLine } from '../components/ProductPicker';
import { StatusChip } from '../components/StatusChip';
import { Empty, FieldError, PageHeader, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, fileUrl, type Job, type Product, type Service } from '../lib/api';
import { readImage } from '../utils/image';
import { METHOD_LABEL, SIZE_LABEL, cls, formatLaoDateTime, formatPhone, isUnpaid, money, toAmount, vehicleText } from '../utils/format';
import { isProductItem, payLines } from './PaymentPage';
import { CancelDialog } from './UnpaidPage';

function Editor({ job, onSaved, onCancel }: { job: Job; onSaved: (job: Job) => void; onCancel: () => void }) {
  const { superAdmin, base } = useStore();
  const branchId = superAdmin ? job.branchId : undefined;
  const services = useApi(() => api.services.list(branchId), [branchId]);
  const products = useApi(() => api.products.list({ sellable: true, limit: 100, branchId }).then((result) => result.data), [branchId]);
  const size = job.vehicle?.size ?? 'SMALL';
  const serviceItems = job.items.filter((item) => !isProductItem(item) && item.serviceId);
  const [selected, setSelected] = useState<string[]>(serviceItems.map((item) => item.serviceId as string));
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(serviceItems.map((item) => [item.serviceId as string, String(item.price)])),
  );
  const [staffId, setStaffId] = useState(job.assignedStaff?.id ?? '');
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const staff = superAdmin ? base.staff.filter((user) => !user.branchId || user.branchId === job.branchId) : base.staff;

  // product rows start from the bill; stock limits come from the product list
  const productLines: CartLine[] =
    lines ??
    job.items
      .filter(isProductItem)
      .map((item) => {
        const product = products.data?.find((row) => row.id === item.productId);
        const fallback: Product = {
          id: item.productId as string, name: item.serviceName, category: 'CHEMICAL', unit: '', minQty: 0, price: item.unitPrice ?? item.price,
          sellable: true, barcode: null, commissionPercent: 0, active: true, qty: item.qty ?? 1, isLow: false, effectivePrice: item.unitPrice ?? item.price,
        };
        return { product: product ?? fallback, qty: item.qty ?? 1 };
      });

  const list = (services.data ?? []).filter((service) => service.active !== false);
  const listed = (service: Service) => service.effectivePrices?.[size] ?? service.basePrice;
  const priceOf = (service: Service) => (service.priceType === 'FROM' ? toAmount(prices[service.id] ?? '') || listed(service) : listed(service));
  const total = list.filter((service) => selected.includes(service.id)).reduce((sum, service) => sum + priceOf(service), 0) + cartTotal(productLines);

  async function save() {
    const picked = list.filter((service) => selected.includes(service.id));
    const low = picked.find((service) => service.priceType === 'FROM' && priceOf(service) < listed(service));
    if (low) {
      setError(`${low.name} ລາຄາຕ່ຳສຸດ ${money(listed(low))}`);
      return;
    }
    if (picked.length === 0 && productLines.length === 0) {
      setError('ກະລຸນາເລືອກບໍລິການ ຫຼື ສິນຄ້າ');
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      const saved = await api.jobs.update(job.id, {
        assignedStaffId: staffId || undefined,
        items: [
          ...picked.map((service) => ({
            serviceId: service.id,
            price: service.priceType === 'FROM' ? priceOf(service) : undefined,
            staffId: staffId || undefined,
          })),
          ...productLines.map((line) => ({ productId: line.product.id, qty: line.qty })),
        ],
      });
      bump();
      notify('ບັນທຶກບິນແລ້ວ');
      onSaved(saved);
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <span className="card-label">ບໍລິການ · {SIZE_LABEL[size]}</span>
        {services.loading && !services.data && <Skeleton />}
        {list.map((service) => {
          const on = selected.includes(service.id);
          return (
            <div key={service.id}>
              <label className={cls('service', on && 'on')}>
                <input type="checkbox" checked={on} onChange={() => setSelected((current) => (on ? current.filter((id) => id !== service.id) : [...current, service.id]))} />
                <span>{service.name}</span>
                <b>{money(on ? priceOf(service) : listed(service))}</b>
              </label>
              {on && service.priceType === 'FROM' && (
                <label className="field">
                  <span>ລາຄາ</span>
                  <input inputMode="numeric" value={prices[service.id] ?? String(listed(service))} onChange={(event) => setPrices((current) => ({ ...current, [service.id]: event.target.value.replace(/[^\d]/g, '') }))} />
                </label>
              )}
            </div>
          );
        })}
        <FieldError text={fields.items} />
      </div>
      <div className="card">
        <span className="card-label">ສິນຄ້າ</span>
        <ProductPicker lines={productLines} onChange={setLines} />
      </div>
      <div className="card">
        <label className="card-label" htmlFor="job-staff">ພະນັກງານ</label>
        <label className="field">
          <select id="job-staff" value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            <option value="">ບໍ່ລະບຸ</option>
            {staff.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="alert pad">{error}</p>}
      <div className="pay-total"><span>ລວມໃໝ່</span><b>{money(total)} ກີບ</b></div>
      <div className="pair">
        <button type="button" className="btn ghost" onClick={onCancel}>ຍົກເລີກ</button>
        <button type="button" className="btn red" disabled={busy} onClick={() => void save()}>{busy ? '...' : 'ບັນທຶກ'}</button>
      </div>
    </>
  );
}

function Photos({ job, onChange }: { job: Job; onChange: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const unpaid = isUnpaid(job.status);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const ready = await Promise.all(
        files.map(async (file, index) => {
          const blob = await (await fetch(await readImage(file))).blob();
          return new File([blob], `after-${index + 1}.jpg`, { type: 'image/jpeg' });
        }),
      );
      await api.jobs.uploadPhotos(job.id, ready, 'AFTER');
      notify('ອັບຮູບແລ້ວ');
      onChange();
    } catch (reason) {
      report(reason, 'ອັບຮູບບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  async function remove(photoId: string) {
    try {
      await api.jobs.removePhoto(job.id, photoId);
      onChange();
    } catch (reason) {
      report(reason, 'ລຶບຮູບບໍ່ສຳເລັດ');
    }
  }

  return (
    <div className="card">
      {(['BEFORE', 'AFTER'] as const).map((type) => {
        const list = job.photos.filter((photo) => photo.type === type);
        return (
          <div key={type}>
            <span className="card-label">{type === 'BEFORE' ? 'ຮູບກ່ອນເຮັດ' : 'ຮູບຫຼັງເຮັດ'}</span>
            <div className="photos">
              {list.length === 0 && type === 'BEFORE' && <span className="muted">-</span>}
              {list.map((photo) => (
                <div key={photo.id} className="photo">
                  <a href={fileUrl(photo.url)} target="_blank" rel="noreferrer"><img src={fileUrl(photo.url)} alt="" /></a>
                  {unpaid && (
                    <button type="button" className="photo-x" aria-label="ລຶບຮູບ" onClick={() => void remove(photo.id)}>
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
              ))}
              {type === 'AFTER' && (
                <button type="button" className="photo add" aria-label="ເພີ່ມຮູບຫຼັງເຮັດ" disabled={busy} onClick={() => fileRef.current?.click()}>
                  <Icon name="camera" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void upload(event)} />
    </div>
  );
}

export function JobPage() {
  const { id = '' } = useParams();
  const { data: job, loading, setData, reload } = useApi(() => api.jobs.get(id), [id], { live: true });
  const [editing, setEditing] = useState(false);
  const [cancel, setCancel] = useState(false);
  const unpaid = job ? isUnpaid(job.status) : false;

  return (
    <div className="page">
      <PageHeader title="ລາຍລະອຽດບິນ" />
      {loading && !job && <Skeleton rows={6} />}
      {!loading && !job && <Empty text="ບໍ່ພົບບິນນີ້" />}
      {job && (
        <div className="columns">
          <div>
            <div className="card">
              <div className="job-top">
                <b className="plate">{job.vehicle?.plateNo ?? 'ຂາຍໜ້າຮ້ານ'}</b>
                <StatusChip status={job.status} />
              </div>
              <div className="muted">{job.code} · {job.branch?.name}</div>
              {job.vehicle && <div className="muted">{vehicleText(job.vehicle)} · {SIZE_LABEL[job.vehicle.size]}</div>}
              {job.customer ? (
                <Link to={`/customers/${job.customer.id}`}>{job.customer.name} · {formatPhone(job.customer.phone)}</Link>
              ) : (
                <div className="muted">ບໍ່ລະບຸລູກຄ້າ</div>
              )}
              <div className="muted">ຮັບ {formatLaoDateTime(job.receivedAt)}{job.assignedStaff ? ` · ${job.assignedStaff.name}` : ''}</div>
              {job.paidAt && <div className="muted">ຊຳລະ {formatLaoDateTime(job.paidAt)}{job.payment ? ` · ${METHOD_LABEL[job.payment.method]}` : ''}</div>}
              {job.cancelReason && <div className="alert">ເຫດຜົນຍົກເລີກ: {job.cancelReason}</div>}
            </div>
            {job.vehicle && <Photos job={job} onChange={reload} />}
          </div>
          <div>
            {editing && unpaid ? (
              <Editor
                job={job}
                onCancel={() => setEditing(false)}
                onSaved={(saved) => {
                  setData(saved);
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <div className="card">
                  <PayLines lines={payLines(job)} />
                  <div className="line total-line"><span>ລວມ</span><b>{money(job.subtotal)}</b></div>
                  {job.discount > 0 && <div className="line"><span>ສ່ວນຫຼຸດ</span><b>−{money(job.discount)}</b></div>}
                  <div className="line"><span>ຍອດຊຳລະ</span><b>{money(job.total)} ກີບ</b></div>
                </div>
                <div className="pad stack">
                  {unpaid && (
                    <>
                      <Link className="btn red wide" to={`/jobs/${job.id}/pay`}>ຊຳລະເງິນ</Link>
                      <button type="button" className="btn ghost wide" onClick={() => setEditing(true)}>ແກ້ໄຂລາຍການ / ພະນັກງານ</button>
                      <button type="button" className="btn ghost wide danger-text" onClick={() => setCancel(true)}>ຍົກເລີກບິນ</button>
                    </>
                  )}
                  {job.status === 'DONE' && <Link className="btn red wide" to={`/jobs/${job.id}/receipt`}>ເບິ່ງໃບບິນ</Link>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {cancel && job && <CancelDialog job={job} onClose={() => setCancel(false)} onDone={reload} />}
    </div>
  );
}
