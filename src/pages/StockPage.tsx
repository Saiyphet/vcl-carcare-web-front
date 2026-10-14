import { useState } from 'react';
import type { FormEvent } from 'react';
import { branchParam, bump, errorCode, fieldErrors, needsBranch, notify, report, requireBranch } from '../api';
import { Icon } from '../components/Icon';
import { RoleGate } from '../components/RoleGate';
import { Empty, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Product, type ProductCategory, type ProductInput } from '../lib/api';
import { cls, formatLaoDateTime, money, toAmount } from '../utils/format';

type Draft = {
  name: string;
  category: ProductCategory;
  unit: string;
  minQty: string;
  cost: string;
  price: string;
  sellable: boolean;
  barcode: string;
  commission: string;
};

const MOVE_LABEL: Record<string, string> = {
  IN: 'ຮັບເຂົ້າ',
  ADJUST: 'ປັບຍອດ',
  SALE: 'ຂາຍ',
  SOLD: 'ຂາຍ',
  USE: 'ໃຊ້ໃນບໍລິການ',
  USED: 'ໃຊ້ໃນບໍລິການ',
  SERVICE: 'ໃຊ້ໃນບໍລິການ',
  RETURN: 'ຄືນສະຕັອກ',
  OUT: 'ອອກ',
};

function toDraft(item: Product | null, category: ProductCategory): Draft {
  return {
    name: item?.name ?? '',
    category: item?.category ?? category,
    unit: item?.unit ?? (category === 'CHEMICAL' ? 'ຂວດ' : 'ຊິ້ນ'),
    minQty: String(item?.minQty ?? 1),
    cost: item?.cost == null ? '' : String(item.cost),
    price: item ? String(item.price) : '',
    sellable: item?.sellable ?? false,
    barcode: item?.barcode ?? '',
    commission: String(item?.commissionPercent ?? 0),
  };
}

function ProductForm({ item, category, onClose }: { item: Product | null; category: ProductCategory; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(item, category));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const margin = toAmount(draft.price) - toAmount(draft.cost);
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setFields({ name: 'ກະລຸນາກອກຊື່' });
      return;
    }
    const body: ProductInput = {
      name: draft.name.trim(),
      category: draft.category,
      unit: draft.unit.trim() || 'ຊິ້ນ',
      minQty: Number(draft.minQty) || 0,
      cost: toAmount(draft.cost),
      price: toAmount(draft.price),
      sellable: draft.sellable,
      barcode: draft.barcode.trim() || (item ? null : undefined),
      commissionPercent: Math.min(100, Math.max(0, Number(draft.commission) || 0)),
    };
    setBusy(true);
    setError('');
    setFields({});
    try {
      if (item) await api.products.update(item.id, body);
      else await api.products.create(body);
      bump();
      notify(item ? 'ແກ້ໄຂສິນຄ້າແລ້ວ' : 'ເພີ່ມສິນຄ້າແລ້ວ');
      onClose();
    } catch (reason) {
      if (errorCode(reason) === 'DUPLICATE') {
        setFields({ barcode: 'ບາໂຄດນີ້ມີແລ້ວ' });
        setError('ບາໂຄດນີ້ມີແລ້ວ');
      } else {
        setFields(fieldErrors(reason));
        setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={item ? 'ແກ້ໄຂສິນຄ້າ' : 'ເພີ່ມສິນຄ້າ'} onClose={onClose}>
      <form onSubmit={(event) => void save(event)}>
        <label className="card-label" htmlFor="p-name">ຊື່</label>
        <label className="field"><input id="p-name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></label>
        <FieldError text={fields.name} />
        <span className="card-label">ໝວດ</span>
        <div className="segment">
          <button type="button" className={cls(draft.category === 'CHEMICAL' && 'on')} onClick={() => patch({ category: 'CHEMICAL' })}>ນ້ຳຢາ</button>
          <button type="button" className={cls(draft.category === 'EQUIPMENT' && 'on')} onClick={() => patch({ category: 'EQUIPMENT' })}>ອຸປະກອນ</button>
        </div>
        <div className="two">
          <div>
            <label className="card-label" htmlFor="p-unit">ໜ່ວຍ</label>
            <label className="field"><input id="p-unit" value={draft.unit} onChange={(event) => patch({ unit: event.target.value })} /></label>
            <FieldError text={fields.unit} />
          </div>
          <div>
            <label className="card-label" htmlFor="p-min">ແຈ້ງເຕືອນເມື່ອຕ່ຳກວ່າ</label>
            <label className="field"><input id="p-min" inputMode="decimal" value={draft.minQty} onChange={(event) => patch({ minQty: event.target.value.replace(/[^\d.]/g, '') })} /></label>
            <FieldError text={fields.minQty} />
          </div>
        </div>
        <div className="two">
          <div>
            <label className="card-label" htmlFor="p-cost">ລາຄາຕົ້ນທຶນ</label>
            <label className="field"><input id="p-cost" inputMode="numeric" value={draft.cost} onChange={(event) => patch({ cost: event.target.value.replace(/[^\d]/g, '') })} placeholder="0" /></label>
            <FieldError text={fields.cost} />
          </div>
          <div>
            <label className="card-label" htmlFor="p-price">ລາຄາຂາຍ</label>
            <label className="field"><input id="p-price" inputMode="numeric" value={draft.price} onChange={(event) => patch({ price: event.target.value.replace(/[^\d]/g, '') })} placeholder="0" /></label>
            <FieldError text={fields.price} />
          </div>
        </div>
        <p className={cls('footnote', margin < 0 && 'negative')}>ກຳໄລຕໍ່ໜ່ວຍ {money(margin)} ກີບ</p>
        <label className="check-row">
          <input type="checkbox" checked={draft.sellable} onChange={(event) => patch({ sellable: event.target.checked })} />
          ຂາຍໄດ້
        </label>
        <label className="card-label" htmlFor="p-barcode">ບາໂຄດ</label>
        <label className="field"><input id="p-barcode" value={draft.barcode} onChange={(event) => patch({ barcode: event.target.value })} /></label>
        <FieldError text={fields.barcode} />
        <label className="card-label" htmlFor="p-commission">ຄ່າຄອມ %</label>
        <label className="field"><input id="p-commission" inputMode="decimal" value={draft.commission} onChange={(event) => patch({ commission: event.target.value.replace(/[^\d.]/g, '') })} /></label>
        <FieldError text={fields.commissionPercent} />
        {error && !Object.keys(fields).length && <p className="alert">{error}</p>}
        <button className="btn red wide mt" type="submit" disabled={busy}>{busy ? '...' : 'ບັນທຶກ'}</button>
      </form>
    </Sheet>
  );
}

function StockDialog({ item, mode, onClose }: { item: Product; mode: 'IN' | 'ADJUST'; onClose: () => void }) {
  const [qty, setQty] = useState(mode === 'IN' ? '1' : '');
  const [sign, setSign] = useState<1 | -1>(-1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const amount = Number(qty) || 0;

  async function save() {
    if (amount <= 0) {
      setError('ກະລຸນາໃສ່ຈຳນວນ');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.products.adjust(item.id, mode, mode === 'IN' ? amount : sign * amount, { branchId: requireBranch(), note: note.trim() || undefined });
      bump();
      notify(mode === 'IN' ? `ຮັບເຂົ້າ ${item.name} ${amount} ${item.unit}` : 'ປັບຍອດແລ້ວ');
      onClose();
    } catch (reason) {
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`${mode === 'IN' ? 'ຮັບເຂົ້າ' : 'ປັບຍອດ'} · ${item.name}`} onClose={onClose}>
      <p className="muted">ຍອດປັດຈຸບັນ {item.qty} {item.unit}</p>
      {mode === 'ADJUST' && (
        <div className="segment mt">
          <button type="button" className={cls(sign === -1 && 'on')} onClick={() => setSign(-1)}>− ຫຼຸດ</button>
          <button type="button" className={cls(sign === 1 && 'on')} onClick={() => setSign(1)}>+ ເພີ່ມ</button>
        </div>
      )}
      <label className="card-label" htmlFor="stock-qty">ຈຳນວນ ({item.unit})</label>
      <label className="field">
        <input id="stock-qty" inputMode="decimal" value={qty} autoFocus onChange={(event) => setQty(event.target.value.replace(/[^\d.]/g, ''))} />
      </label>
      <label className="card-label" htmlFor="stock-note">ໝາຍເຫດ</label>
      <label className="field">
        <input id="stock-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={mode === 'IN' ? 'ຊື້ເຂົ້າ' : 'ນັບສະຕັອກ'} />
      </label>
      {mode === 'ADJUST' && amount > 0 && <p className="footnote">ຍອດໃໝ່ {item.qty + sign * amount} {item.unit}</p>}
      {error && <p className="alert">{error}</p>}
      <button type="button" className="btn red wide mt" disabled={busy} onClick={() => void save()}>{busy ? '...' : 'ບັນທຶກ'}</button>
    </Sheet>
  );
}

function Movements({ item, onClose }: { item: Product; onClose: () => void }) {
  const { branchId } = useStore();
  const { data, loading } = useApi(() => api.products.movements(item.id, { branchId: branchParam(), limit: 50 }).then((result) => result.data), [item.id, branchId]);
  return (
    <Sheet title={`ປະຫວັດ · ${item.name}`} onClose={onClose}>
      {loading && !data && <Skeleton />}
      {!loading && !data?.length && <Empty text="ຍັງບໍ່ມີປະຫວັດ" />}
      {data?.map((move) => (
        <div key={move.id} className="history">
          <div>
            <b>{MOVE_LABEL[move.type] ?? move.type}{move.job ? ` · ${move.job.code}` : ''}</b>
            <small>{formatLaoDateTime(move.createdAt)}{move.branch ? ` · ${move.branch.code}` : ''}{move.user ? ` · ${move.user.name}` : ''}{move.note ? ` · ${move.note}` : ''}</small>
          </div>
          <div className="person-meta">
            <b className={move.qty < 0 ? 'minus' : 'plus'}>{move.qty > 0 ? '+' : ''}{move.qty}</b>
            <small>ເຫຼືອ {move.balance}</small>
          </div>
        </div>
      ))}
    </Sheet>
  );
}

function BranchPrices({ item, onClose }: { item: Product; onClose: () => void }) {
  const { base } = useStore();
  const detail = useApi(() => api.products.get(item.id), [item.id]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');

  function current(branchId: string) {
    if (values[branchId] !== undefined) return values[branchId];
    const found = detail.data?.branchPrices.find((row) => row.branchId === branchId);
    return found ? String(found.price) : '';
  }

  async function save(branchId: string, price: number | null) {
    setBusy(branchId);
    try {
      await api.products.setBranchPrice(item.id, branchId, price);
      if (price == null) setValues((old) => ({ ...old, [branchId]: '' }));
      detail.reload();
      bump();
      notify(price == null ? 'ໃຊ້ລາຄາປົກກະຕິແລ້ວ' : 'ບັນທຶກລາຄາສາຂາແລ້ວ');
    } catch (reason) {
      report(reason, 'ບັນທຶກບໍ່ສຳເລັດ');
    } finally {
      setBusy('');
    }
  }

  return (
    <Sheet title="ລາຄາສະເພາະສາຂາ" onClose={onClose}>
      <p className="muted">{item.name} · ລາຄາປົກກະຕິ {money(item.price)} ກີບ</p>
      {detail.loading && !detail.data && <Skeleton />}
      {base.branches.map((branch) => {
        const value = current(branch.id);
        return (
          <div key={branch.id} className="branch-price">
            <b>{branch.code} · {branch.name}</b>
            <label className="field">
              <input inputMode="numeric" value={value} placeholder={`${money(item.price)} (ປົກກະຕິ)`} onChange={(event) => setValues((old) => ({ ...old, [branch.id]: event.target.value.replace(/[^\d]/g, '') }))} />
            </label>
            <div className="row-actions">
              <button type="button" className="mini" disabled={busy === branch.id} onClick={() => void save(branch.id, null)}>ໃຊ້ລາຄາປົກກະຕິ</button>
              <button type="button" className="status-btn ready" disabled={busy === branch.id || value === ''} onClick={() => void save(branch.id, toAmount(value))}>ບັນທຶກ</button>
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

export function StockPage() {
  const { admin, branchId, base } = useStore();
  const [tab, setTab] = useState<ProductCategory>('CHEMICAL');
  const [form, setForm] = useState<{ item: Product | null } | null>(null);
  const [stock, setStock] = useState<{ item: Product; mode: 'IN' | 'ADJUST' } | null>(null);
  const [moves, setMoves] = useState<Product | null>(null);
  const [prices, setPrices] = useState<Product | null>(null);
  const allBranches = admin && !branchId;
  const blocked = needsBranch();
  const { data, loading } = useApi(
    () => api.products.list({ branchId: branchParam(), category: tab, limit: 100 }).then((result) => result.data),
    [branchId, tab],
    { live: true },
  );
  const items = data ?? [];
  const value = items.reduce((sum, item) => sum + item.qty * (item.cost ?? 0), 0);

  return (
    <div className="page">
      <PageHeader title="ສະຕັອກ" />
      {base.lowStockCount > 0 && <div className="warn">ສິນຄ້າໃກ້ໝົດ {base.lowStockCount} ລາຍການ</div>}
      <div className="tabs">
        <button type="button" className={cls(tab === 'CHEMICAL' && 'on')} onClick={() => setTab('CHEMICAL')}>ນ້ຳຢາ</button>
        <button type="button" className={cls(tab === 'EQUIPMENT' && 'on')} onClick={() => setTab('EQUIPMENT')}>ອຸປະກອນ</button>
      </div>
      <RoleGate>
        <div className="stat-grid">
          <article className="stat"><span>ລາຍການ</span><b>{items.length}</b></article>
          <article className="stat"><span>ມູນຄ່າສະຕັອກ (ຕົ້ນທຶນ)</span><b>{money(value)} ກີບ</b></article>
        </div>
      </RoleGate>
      <div className="card">
        {loading && !data && <Skeleton rows={4} />}
        {!loading && items.length === 0 && <Empty text="ຍັງບໍ່ມີລາຍການ" />}
        {items.map((item) => (
          <div key={item.id} className={cls('stock-row', item.isLow && 'is-low')}>
            <span className="stock-icon"><Icon name={item.category === 'CHEMICAL' ? 'droplet' : 'tool'} size={20} /></span>
            <div>
              <b>{item.name}{item.sellable ? ' · ຂາຍໄດ້' : ''}</b>
              <small className="qty">
                ເຫຼືອ {item.qty} {item.unit}{item.isLow ? ' · ໃກ້ໝົດ' : ''}
                {item.sellable ? ` · ຂາຍ ${money(item.effectivePrice)}` : ''}
              </small>
              {admin && item.cost != null && (
                <small>ຕົ້ນທຶນ {money(item.cost)} · ມູນຄ່າ {money(item.qty * item.cost)}{item.sellable ? ` · ກຳໄລ ${money(item.effectivePrice - item.cost)}` : ''}</small>
              )}
              {item.barcode && <small>ບາໂຄດ {item.barcode}</small>}
              {allBranches && item.stocks && item.stocks.length > 0 && (
                <small className="branch-stock">
                  {item.stocks.map((row) => (
                    <span key={row.branchId} className={cls(row.isLow && 'low-text')}>{row.branchCode} {row.qty}{row.price ? ` · ${money(row.price)}` : ''}</span>
                  ))}
                </small>
              )}
              <div className="user-actions">
                <button type="button" className="mini" disabled={blocked} onClick={() => setStock({ item, mode: 'IN' })}>+ ຮັບເຂົ້າ</button>
                {admin && <button type="button" className="mini" disabled={blocked} onClick={() => setStock({ item, mode: 'ADJUST' })}>ປັບຍອດ</button>}
                <button type="button" className="mini" onClick={() => setMoves(item)}>ປະຫວັດ</button>
                {admin && <button type="button" className="mini" onClick={() => setForm({ item })}>ແກ້ໄຂ</button>}
                {admin && item.sellable && <button type="button" className="mini" onClick={() => setPrices(item)}>ລາຄາສາຂາ</button>}
              </div>
            </div>
            <b className="stock-qty">{item.qty}</b>
          </div>
        ))}
      </div>
      {blocked && <p className="footnote">ກະລຸນາເລືອກສາຂາ ເພື່ອຮັບເຂົ້າ ຫຼື ປັບຍອດ</p>}
      <RoleGate>
        <div className="pad">
          <button type="button" className="btn ghost wide" onClick={() => setForm({ item: null })}>+ ເພີ່ມສິນຄ້າ</button>
        </div>
      </RoleGate>
      {form && <ProductForm item={form.item} category={tab} onClose={() => setForm(null)} />}
      {stock && <StockDialog item={stock.item} mode={stock.mode} onClose={() => setStock(null)} />}
      {moves && <Movements item={moves} onClose={() => setMoves(null)} />}
      {prices && <BranchPrices item={prices} onClose={() => setPrices(null)} />}
    </div>
  );
}
