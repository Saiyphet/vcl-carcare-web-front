import { useState } from 'react';
import type { FormEvent } from 'react';
import { bump, fieldErrors, notify, refreshBase, report } from '../api';
import { Icon } from '../components/Icon';
import { Confirm, Empty, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, VEHICLE_SIZES as SIZES, type Service, type VehicleSize } from '../lib/api';
import { SIZE_LABEL, cls, money, toAmount } from '../utils/format';

const emptyPrices = () => Object.fromEntries(SIZES.map((size) => [size, ''])) as Record<VehicleSize, string>;

type Draft = {
  id?: string;
  name: string;
  basePrice: string;
  priceType: 'FIXED' | 'FROM';
  durationMin: string;
  commissionPercent: string;
  prices: Record<VehicleSize, string>;
  active: boolean;
};

function toDraft(service: Service | null): Draft {
  const prices = emptyPrices();
  service?.prices.forEach((row) => {
    prices[row.size] = String(row.price);
  });
  return {
    id: service?.id,
    name: service?.name ?? '',
    basePrice: service ? String(service.basePrice) : '',
    priceType: service?.priceType ?? 'FIXED',
    durationMin: String(service?.durationMin ?? 30),
    commissionPercent: String(service?.commissionPercent ?? 0),
    prices,
    active: service?.active !== false,
  };
}

function sizePrices(values: Record<VehicleSize, string>) {
  return SIZES.filter((size) => values[size] !== '').map((size) => ({ size, price: toAmount(values[size]) }));
}

function ServiceForm({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const [draft, setDraft] = useState(() => toDraft(service));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    const body = {
      name: draft.name.trim(),
      basePrice: toAmount(draft.basePrice),
      priceType: draft.priceType,
      durationMin: Number(draft.durationMin) || 0,
      commissionPercent: Math.min(100, Math.max(0, Number(draft.commissionPercent) || 0)),
      prices: sizePrices(draft.prices),
      active: draft.active,
    };
    try {
      if (draft.id) await api.services.update(draft.id, body);
      else await api.services.create(body);
      bump();
      void refreshBase();
      notify('ບັນທຶກບໍລິການແລ້ວ');
      onClose();
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={draft.id ? 'ແກ້ໄຂບໍລິການ' : 'ເພີ່ມບໍລິການ'} onClose={onClose}>
      <form onSubmit={(event) => void save(event)}>
        <label className="card-label" htmlFor="s-name">ຊື່ບໍລິການ</label>
        <label className="field"><input id="s-name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></label>
        <FieldError text={fields.name} />
        <span className="card-label">ແບບລາຄາ</span>
        <div className="segment">
          <button type="button" className={cls(draft.priceType === 'FIXED' && 'on')} onClick={() => patch({ priceType: 'FIXED' })}>ລາຄາຄົງທີ່</button>
          <button type="button" className={cls(draft.priceType === 'FROM' && 'on')} onClick={() => patch({ priceType: 'FROM' })}>ເລີ່ມຕົ້ນ (FROM)</button>
        </div>
        <div className="two">
          <div>
            <label className="card-label" htmlFor="s-base">ລາຄາພື້ນຖານ</label>
            <label className="field"><input id="s-base" inputMode="numeric" value={draft.basePrice} onChange={(event) => patch({ basePrice: event.target.value.replace(/[^\d]/g, '') })} /></label>
            <FieldError text={fields.basePrice} />
          </div>
          <div>
            <label className="card-label" htmlFor="s-duration">ເວລາ (ນາທີ)</label>
            <label className="field"><input id="s-duration" inputMode="numeric" value={draft.durationMin} onChange={(event) => patch({ durationMin: event.target.value.replace(/[^\d]/g, '') })} /></label>
            <FieldError text={fields.durationMin} />
          </div>
        </div>
        <label className="card-label" htmlFor="s-commission">ຄ່າຄອມ %</label>
        <label className="field"><input id="s-commission" inputMode="decimal" value={draft.commissionPercent} onChange={(event) => patch({ commissionPercent: event.target.value.replace(/[^\d.]/g, '') })} /></label>
        <FieldError text={fields.commissionPercent} />
        <span className="card-label">ລາຄາຕາມຂະໜາດ (ວ່າງ = ລາຄາພື້ນຖານ)</span>
        <div className="sizes-grid">
          {SIZES.map((size) => (
            <div key={size}>
              <small className="muted">{SIZE_LABEL[size]}</small>
              <label className="field">
                <input
                  inputMode="numeric"
                  aria-label={SIZE_LABEL[size]}
                  value={draft.prices[size]}
                  placeholder={draft.basePrice || '0'}
                  onChange={(event) => patch({ prices: { ...draft.prices, [size]: event.target.value.replace(/[^\d]/g, '') } })}
                />
              </label>
            </div>
          ))}
        </div>
        <FieldError text={fields.prices} />
        {draft.id && (
          <label className="check-row">
            <input type="checkbox" checked={draft.active} onChange={(event) => patch({ active: event.target.checked })} />
            ເປີດໃຊ້ງານ
          </label>
        )}
        {error && !Object.keys(fields).length && <p className="alert">{error}</p>}
        <button className="btn red wide mt" type="submit" disabled={busy}>{busy ? '...' : 'ບັນທຶກ'}</button>
      </form>
    </Sheet>
  );
}

function BranchPriceEditor({ service, onClose }: { service: Service; onClose: () => void }) {
  const { base } = useStore();
  const [branchId, setBranchId] = useState(base.branches[0]?.id ?? '');
  const [values, setValues] = useState<Record<VehicleSize, string>>(() => pricesFor(base.branches[0]?.id ?? ''));
  const [busy, setBusy] = useState(false);

  function pricesFor(id: string) {
    const out = emptyPrices();
    service.branchPrices?.filter((row) => row.branchId === id).forEach((row) => {
      out[row.size] = String(row.price);
    });
    return out;
  }

  const fallback = (size: VehicleSize) => service.prices.find((row) => row.size === size)?.price ?? service.basePrice;

  async function save(prices: { size: VehicleSize; price: number }[]) {
    setBusy(true);
    try {
      await api.services.setBranchPrices(service.id, branchId, prices);
      bump();
      void refreshBase();
      notify(prices.length ? 'ບັນທຶກລາຄາສາຂາແລ້ວ' : 'ໃຊ້ລາຄາປົກກະຕິແລ້ວ');
      onClose();
    } catch (reason) {
      report(reason, 'ບັນທຶກບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`ລາຄາສາຂາ · ${service.name}`} onClose={onClose}>
      <label className="card-label" htmlFor="bp-branch">ສາຂາ</label>
      <label className="field">
        <select id="bp-branch" value={branchId} onChange={(event) => { setBranchId(event.target.value); setValues(pricesFor(event.target.value)); }}>
          {base.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}
        </select>
      </label>
      <span className="card-label">ລາຄາຕາມຂະໜາດ (ວ່າງ = ລາຄາປົກກະຕິ)</span>
      <div className="sizes-grid">
        {SIZES.map((size) => (
          <div key={size}>
            <small className="muted">{SIZE_LABEL[size]}</small>
            <label className="field">
              <input inputMode="numeric" aria-label={SIZE_LABEL[size]} value={values[size]} placeholder={money(fallback(size))} onChange={(event) => setValues({ ...values, [size]: event.target.value.replace(/[^\d]/g, '') })} />
            </label>
          </div>
        ))}
      </div>
      <div className="pair flush">
        <button type="button" className="btn ghost" disabled={busy} onClick={() => void save([])}>ໃຊ້ລາຄາປົກກະຕິ</button>
        <button type="button" className="btn red" disabled={busy || !branchId} onClick={() => void save(sizePrices(values))}>ບັນທຶກ</button>
      </div>
    </Sheet>
  );
}

function MaterialsEditor({ service, onClose }: { service: Service; onClose: () => void }) {
  const products = useApi(() => api.products.list({ limit: 100 }).then((result) => result.data), []);
  const [rows, setRows] = useState(() => (service.materials ?? []).map((row) => ({ productId: row.productId, qty: String(row.qtyPerUse) })));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.services.setMaterials(
        service.id,
        rows.filter((row) => row.productId && Number(row.qty) > 0).map((row) => ({ productId: row.productId, qtyPerUse: Number(row.qty) })),
      );
      bump();
      notify('ບັນທຶກວັດສະດຸແລ້ວ');
      onClose();
    } catch (reason) {
      report(reason, 'ບັນທຶກບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`ວັດສະດຸທີ່ໃຊ້ · ${service.name}`} onClose={onClose}>
      <p className="muted">ຕັດສະຕັອກອັດຕະໂນມັດທຸກຄັ້ງທີ່ຊຳລະບໍລິການນີ້</p>
      {products.loading && !products.data && <Skeleton />}
      {rows.map((row, index) => {
        const product = products.data?.find((item) => item.id === row.productId);
        return (
          <div key={index} className="material-row">
            <label className="field">
              <select aria-label="ສິນຄ້າ" value={row.productId} onChange={(event) => setRows(rows.map((item, at) => (at === index ? { ...item, productId: event.target.value } : item)))}>
                <option value="">ເລືອກສິນຄ້າ</option>
                {products.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="field">
              <input inputMode="decimal" aria-label="ຈຳນວນຕໍ່ຄັ້ງ" value={row.qty} onChange={(event) => setRows(rows.map((item, at) => (at === index ? { ...item, qty: event.target.value.replace(/[^\d.]/g, '') } : item)))} />
              <span>{product?.unit ?? ''}</span>
            </label>
            <button type="button" className="icon-btn" aria-label="ລຶບ" onClick={() => setRows(rows.filter((_, at) => at !== index))}><Icon name="trash" size={18} /></button>
          </div>
        );
      })}
      <button type="button" className="text-btn" onClick={() => setRows([...rows, { productId: '', qty: '' }])}><Icon name="plus" size={18} /> ເພີ່ມວັດສະດຸ</button>
      <button type="button" className="btn red wide mt" disabled={busy} onClick={() => void save()}>{busy ? '...' : 'ບັນທຶກ'}</button>
    </Sheet>
  );
}

export function ServicesPage() {
  const { base } = useStore();
  const { data, loading } = useApi(() => api.services.list(undefined, true), [], { live: true });
  const [form, setForm] = useState<{ service: Service | null } | null>(null);
  const [branchPrices, setBranchPrices] = useState<Service | null>(null);
  const [materials, setMaterials] = useState<Service | null>(null);
  const [remove, setRemove] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api.services.remove(remove.id);
      bump();
      void refreshBase();
      notify('ລຶບບໍລິການແລ້ວ');
      setRemove(null);
    } catch (reason) {
      report(reason, 'ລຶບບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  const branchCode = (id: string) => base.branches.find((branch) => branch.id === id)?.code ?? '';

  return (
    <div className="page">
      <PageHeader title="ບໍລິການ ແລະ ລາຄາ" />
      {loading && !data && <Skeleton rows={4} />}
      {!loading && !data?.length && <Empty text="ຍັງບໍ່ມີບໍລິການ" />}
      <div className="queue-list">
        {data?.map((service) => {
          const branchRows = [...new Set((service.branchPrices ?? []).map((row) => row.branchId))];
          return (
            <article key={service.id} className={cls('card service-card', service.active === false && 'is-off')}>
              <div className="job-top">
                <b>{service.name}{service.active === false ? ' · ປິດ' : ''}</b>
                <span className="muted">{service.priceType === 'FROM' ? 'ເລີ່ມ ' : ''}{money(service.basePrice)}</span>
              </div>
              <small className="muted">
                {SIZES.map((size) => `${SIZE_LABEL[size]} ${money(service.effectivePrices?.[size] ?? service.basePrice)}`).join(' · ')}
              </small>
              <small className="muted">{service.durationMin} ນາທີ · ຄອມ {service.commissionPercent ?? 0}%</small>
              {branchRows.map((id) => (
                <small key={id} className="muted">
                  {branchCode(id)}: {SIZES.map((size) => {
                    const row = service.branchPrices?.find((item) => item.branchId === id && item.size === size);
                    return row ? `${SIZE_LABEL[size]} ${money(row.price)}` : null;
                  }).filter(Boolean).join(' · ')}
                </small>
              ))}
              {(service.materials?.length ?? 0) > 0 && (
                <small className="muted">ວັດສະດຸ: {service.materials?.map((row) => `${row.product?.name ?? ''} ${row.qtyPerUse}`).join(', ')}</small>
              )}
              <div className="payroll-actions">
                <button type="button" className="mini" onClick={() => setForm({ service })}>ແກ້ໄຂ</button>
                <button type="button" className="mini" onClick={() => setBranchPrices(service)}>ລາຄາສາຂາ</button>
                <button type="button" className="mini" onClick={() => setMaterials(service)}>ວັດສະດຸ</button>
                <button type="button" className="mini danger" onClick={() => setRemove(service)}>ລຶບ</button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="pad">
        <button type="button" className="btn red wide" onClick={() => setForm({ service: null })}>+ ເພີ່ມບໍລິການ</button>
      </div>
      {form && <ServiceForm service={form.service} onClose={() => setForm(null)} />}
      {branchPrices && <BranchPriceEditor service={branchPrices} onClose={() => setBranchPrices(null)} />}
      {materials && <MaterialsEditor service={materials} onClose={() => setMaterials(null)} />}
      {remove && (
        <Confirm title="ລຶບບໍລິການ" text={remove.name} confirmLabel="ລຶບ" busy={busy} onConfirm={() => void confirmRemove()} onClose={() => setRemove(null)} />
      )}
    </div>
  );
}
