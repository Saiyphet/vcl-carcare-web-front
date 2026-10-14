import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bump, errorMessage, fieldErrors, needsBranch, notify, report, requireBranch } from '../api';
import { Icon } from '../components/Icon';
import { PaymentSheet, type PayLine } from '../components/PaymentSheet';
import { cartTotal, ProductPicker, type CartLine } from '../components/ProductPicker';
import { BranchNeeded, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Customer, type Job, type PaymentInput, type Service, type VehicleSize } from '../lib/api';
import { readImage } from '../utils/image';
import { COLORS, SIZE_LABEL, cls, digitsOnly, formatPhone, money, toAmount } from '../utils/format';

const MAX_PHOTOS = 6;

type Hit = NonNullable<Job['vehicle']> & { customer: Customer | null };
type Photo = { url: string; file: File };

async function toFile(dataUrl: string, index: number) {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], `before-${index + 1}.jpg`, { type: blob.type || 'image/jpeg' });
}

export function IntakePage() {
  const { base } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filled = useRef(false);
  const [plate, setPlate] = useState('');
  const [province, setProvince] = useState('ນະຄອນຫຼວງວຽງຈັນ');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('ຂາວ');
  const [size, setSize] = useState<VehicleSize>('SMALL');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [customPrice, setCustomPrice] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<CartLine[]>([]);
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const blocked = needsBranch();

  const presetId = params.get('customer');
  const preset = useApi(() => api.customers.get(presetId as string), [presetId], { enabled: Boolean(presetId) });

  useEffect(() => {
    const customer = preset.data;
    if (filled.current || !customer) return;
    filled.current = true;
    setCustomerName(customer.name);
    setPhone(formatPhone(customer.phone));
    const vehicle = customer.vehicles?.[0];
    if (!vehicle) return;
    setPlate(vehicle.plateNo);
    setProvince(vehicle.province || province);
    setBrand(vehicle.brand || '');
    setModel(vehicle.model || '');
    if (vehicle.color) setColor(vehicle.color);
    setSize(vehicle.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.data]);

  useEffect(() => {
    const text = plate.trim();
    if (text.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void api.vehicles.lookup(text).then((list) => setHits(list.filter((hit) => hit.plateNo !== text))).catch(() => setHits([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [plate]);

  // services the branch no longer offers
  useEffect(() => {
    setSelected((current) => current.filter((id) => base.services.some((service) => service.id === id)));
  }, [base.services]);

  function listed(service: Service) {
    return service.effectivePrices?.[size] ?? service.basePrice;
  }

  function priceOf(service: Service) {
    const min = listed(service);
    if (service.priceType !== 'FROM') return min;
    const typed = toAmount(customPrice[service.id] ?? '');
    return typed || min;
  }

  const picked = base.services.filter((service) => selected.includes(service.id));
  const serviceTotal = picked.reduce((sum, service) => sum + priceOf(service), 0);
  const total = serviceTotal + cartTotal(products);
  const tooLow = picked.find((service) => service.priceType === 'FROM' && priceOf(service) < listed(service));

  const lines: PayLine[] = [
    ...picked.map((service) => ({ key: service.id, name: service.name, price: priceOf(service) })),
    ...products.map((line) => ({
      key: line.product.id,
      name: line.product.name,
      price: line.product.effectivePrice * line.qty,
      qty: line.qty,
      unitPrice: line.product.effectivePrice,
      unit: line.product.unit,
      product: true,
    })),
  ];

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyHit(hit: Hit) {
    setPlate(hit.plateNo);
    if (hit.province) setProvince(hit.province);
    setBrand(hit.brand || '');
    setModel(hit.model || '');
    if (hit.color) setColor(hit.color);
    setSize(hit.size);
    if (hit.customer?.name) setCustomerName(hit.customer.name);
    if (hit.customer?.phone) setPhone(formatPhone(hit.customer.phone));
    setHits([]);
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    try {
      const next: Photo[] = [];
      for (const file of files.slice(0, MAX_PHOTOS - photos.length)) {
        const url = await readImage(file);
        next.push({ url, file: await toFile(url, photos.length + next.length) });
      }
      setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS));
    } catch (reason) {
      setError(errorMessage(reason, 'ອ່ານຮູບບໍ່ໄດ້'));
    }
  }

  function check() {
    if (blocked) return 'ກະລຸນາເລືອກສາຂາ';
    if (!plate.trim()) return 'ກະລຸນາກອກທະບຽນລົດ';
    if (lines.length === 0) return 'ກະລຸນາເລືອກບໍລິການ ຫຼື ສິນຄ້າ';
    if (tooLow) return `${tooLow.name} ລາຄາຕ່ຳສຸດ ${money(listed(tooLow))}`;
    const digits = digitsOnly(phone);
    if (digits && digits.length < 8) return 'ເບີໂທບໍ່ຄົບ';
    return '';
  }

  function body(payment?: PaymentInput) {
    return {
      branchId: requireBranch(),
      plateNo: plate.trim(),
      province: province.trim() || undefined,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      color: color || undefined,
      size,
      customerName: customerName.trim() || undefined,
      customerPhone: digitsOnly(phone) || undefined,
      assignedStaffId: staffId || undefined,
      items: [
        ...picked.map((service) => ({
          serviceId: service.id,
          price: service.priceType === 'FROM' ? priceOf(service) : undefined,
          staffId: staffId || undefined,
        })),
        ...products.map((line) => ({ productId: line.product.id, qty: line.qty })),
      ],
      payment,
    };
  }

  async function uploadPhotos(id: string) {
    if (photos.length === 0) return;
    try {
      await api.jobs.uploadPhotos(id, photos.map((photo) => photo.file), 'BEFORE');
    } catch (reason) {
      report(reason, 'ອັບຮູບບໍ່ສຳເລັດ');
    }
  }

  async function save(payment?: PaymentInput) {
    const problem = check();
    if (problem) {
      setError(problem);
      setPayOpen(false);
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      const job = await api.jobs.create(body(payment));
      await uploadPhotos(job.id);
      bump();
      notify(payment ? `ຊຳລະແລ້ວ ${job.code}` : `ບັນທຶກແລ້ວ ${job.code}`);
      navigate(payment ? `/jobs/${job.id}/receipt` : `/jobs/${job.id}/pay`);
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
      setPayOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ຮັບລົດເຂົ້າຮ້ານ" />
      {blocked && <BranchNeeded />}
      <div className="columns">
        <div className="card">
          <label className="card-label" htmlFor="plate">ທະບຽນລົດ</label>
          <label className="field">
            <input id="plate" value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="ກກ 1234" autoComplete="off" />
          </label>
          <FieldError text={fields.plateNo} />
          {hits.length > 0 && (
            <div className="suggest">
              {hits.map((hit) => (
                <button key={hit.id} type="button" onClick={() => applyHit(hit)}>
                  <b>{hit.plateNo}</b>
                  <span>{[hit.brand, hit.model, hit.color, hit.customer?.name].filter(Boolean).join(' · ')}</span>
                </button>
              ))}
            </div>
          )}
          <label className="card-label" htmlFor="province">ແຂວງ</label>
          <label className="field">
            <input id="province" value={province} onChange={(event) => setProvince(event.target.value)} placeholder="ນະຄອນຫຼວງວຽງຈັນ" />
          </label>
          <div className="two">
            <div>
              <label className="card-label" htmlFor="brand">ຍີ່ຫໍ້</label>
              <label className="field">
                <input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Toyota" />
              </label>
            </div>
            <div>
              <label className="card-label" htmlFor="model">ລຸ້ນ</label>
              <label className="field">
                <input id="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Vios" />
              </label>
            </div>
          </div>
          <span className="card-label">ສີ</span>
          <div className="colors">
            {COLORS.map((item) => (
              <button key={item.name} type="button" className={cls('chip', color === item.name && 'on')} onClick={() => setColor(item.name)}>
                <i className="swatch" style={{ background: item.hex }} />
                {item.name}
              </button>
            ))}
          </div>
          <span className="card-label">ຂະໜາດລົດ</span>
          <div className="segment">
            {base.sizes.map((item) => (
              <button key={item.code} type="button" className={cls(size === item.code && 'on')} onClick={() => setSize(item.code)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <label className="card-label" htmlFor="customer">ຊື່ລູກຄ້າ</label>
          <label className="field">
            <Icon name="user" size={18} />
            <input id="customer" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="ບໍ່ບັງຄັບ" />
          </label>
          <FieldError text={fields.customerName} />
          <label className="card-label" htmlFor="phone">ເບີໂທ</label>
          <label className="field">
            <Icon name="phone" size={18} />
            <input id="phone" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => phone && setPhone(formatPhone(phone))} placeholder="ບໍ່ບັງຄັບ" />
          </label>
          <FieldError text={fields.customerPhone} />
        </div>

        <div className="card">
          <span className="card-label">ບໍລິການ</span>
          {!base.loaded && <Skeleton rows={3} />}
          {base.loaded && base.services.length === 0 && <p className="empty">ຍັງບໍ່ມີບໍລິການ</p>}
          {base.services.map((service) => {
            const on = selected.includes(service.id);
            const min = listed(service);
            return (
              <div key={service.id}>
                <label className={cls('service', on && 'on')}>
                  <input type="checkbox" checked={on} onChange={() => toggle(service.id)} />
                  <span>{service.name}</span>
                  <b>{service.priceType === 'FROM' && !on ? `ເລີ່ມ ${money(min)}` : money(on ? priceOf(service) : min)}</b>
                </label>
                {on && service.priceType === 'FROM' && (
                  <label className="field">
                    <span>ລາຄາ</span>
                    <input
                      inputMode="numeric"
                      value={customPrice[service.id] ?? String(min)}
                      onChange={(event) => setCustomPrice((current) => ({ ...current, [service.id]: event.target.value.replace(/[^\d]/g, '') }))}
                      placeholder={`ຕ່ຳສຸດ ${money(min)}`}
                    />
                  </label>
                )}
              </div>
            );
          })}
          <FieldError text={fields.items} />
        </div>

        <div className="card">
          <span className="card-label">ສິນຄ້າເພີ່ມ</span>
          <ProductPicker lines={products} onChange={setProducts} />
        </div>

        <div className="card">
          <label className="card-label" htmlFor="staff">ພະນັກງານ</label>
          <label className="field">
            <select id="staff" value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              <option value="">ບໍ່ລະບຸ</option>
              {base.staff.map((member) => (
                <option key={member.id} value={member.id}>{member.name}{member.position ? ` · ${member.position}` : ''}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="card">
          <span className="card-label">ຖ່າຍຮູບ (ກ່ອນເຮັດ)</span>
          <div className="photos">
            {photos.map((photo, index) => (
              <button key={photo.url} type="button" className="photo" aria-label="ລຶບຮູບ" onClick={() => setPhotos((current) => current.filter((_, item) => item !== index))}>
                <img src={photo.url} alt="" />
              </button>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <button type="button" className="photo add" aria-label="ຖ່າຍຮູບ" onClick={() => cameraRef.current?.click()}>
                  <Icon name="camera" />
                </button>
                <button type="button" className="photo add" aria-label="ເລືອກຮູບ" onClick={() => fileRef.current?.click()}>
                  <Icon name="plus" />
                </button>
              </>
            )}
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => void onFiles(event)} />
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void onFiles(event)} />
        </div>
      </div>

      {error && <p className="alert pad">{error}</p>}

      <div className="dock">
        <div>
          <span className="muted">ລວມ</span>
          <div className="total">{money(total)} <small>ກີບ</small></div>
        </div>
        <div className="dock-actions">
          <button className="btn ghost" type="button" disabled={busy || blocked} onClick={() => void save()}>
            {busy && !payOpen ? '...' : 'ບັນທຶກ → ຊຳລະ'}
          </button>
          <button
            className="btn red"
            type="button"
            disabled={busy || blocked}
            onClick={() => {
              const problem = check();
              if (problem) setError(problem);
              else {
                setError('');
                setPayOpen(true);
              }
            }}
          >
            ຊຳລະເລີຍ
          </button>
        </div>
      </div>

      {payOpen && (
        <Sheet title="ຊຳລະເງິນ" onClose={() => setPayOpen(false)}>
          <div className="sheet-plate">{plate} · {SIZE_LABEL[size]}</div>
          <PaymentSheet lines={lines} subtotal={total} busy={busy} onConfirm={(payment) => void save(payment)} />
        </Sheet>
      )}
    </div>
  );
}
