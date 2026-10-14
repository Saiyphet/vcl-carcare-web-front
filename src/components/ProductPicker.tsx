import { useState } from 'react';
import { branchParam } from '../api';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Product } from '../lib/api';
import { cls, money } from '../utils/format';
import { Icon } from './Icon';
import { Empty, Sheet, Skeleton } from './ui';

export type CartLine = { product: Product; qty: number };

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.product.effectivePrice * line.qty, 0);
}

/** Set the qty of one product, capped at the branch stock. 0 removes the row. */
export function setCartQty(lines: CartLine[], product: Product, qty: number): CartLine[] {
  const capped = Math.max(0, Math.min(product.qty, Math.round(qty) || 0));
  const rest = lines.filter((line) => line.product.id !== product.id);
  if (capped <= 0) return rest;
  const index = lines.findIndex((line) => line.product.id === product.id);
  const next = { product, qty: capped };
  if (index < 0) return [...lines, next];
  const copy = [...lines];
  copy[index] = next;
  return copy;
}

function Stepper({ product, qty, onSet }: { product: Product; qty: number; onSet: (qty: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" aria-label="ຫຼຸດ" disabled={qty <= 0} onClick={() => onSet(qty - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <b>{qty}</b>
      <button type="button" aria-label="ເພີ່ມ" disabled={product.qty <= 0 || qty >= product.qty} onClick={() => onSet(qty + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

/** "+ ເພີ່ມສິນຄ້າ" button, the chosen product rows, and a searchable dialog of sellable products */
export function ProductPicker({ lines, onChange }: { lines: CartLine[]; onChange: (lines: CartLine[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {lines.map((line) => (
        <div key={line.product.id} className="product-line">
          <div>
            <b>{line.product.name}</b>
            <small>{line.qty} × {money(line.product.effectivePrice)} · ເຫຼືອ {line.product.qty} {line.product.unit}</small>
          </div>
          <Stepper product={line.product} qty={line.qty} onSet={(qty) => onChange(setCartQty(lines, line.product, qty))} />
          <em>{money(line.product.effectivePrice * line.qty)}</em>
        </div>
      ))}
      <button type="button" className="text-btn" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} /> ເພີ່ມສິນຄ້າ
      </button>
      {open && <ProductDialog lines={lines} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ProductDialog({ lines, onChange, onClose }: { lines: CartLine[]; onChange: (lines: CartLine[]) => void; onClose: () => void }) {
  const { branchId } = useStore();
  const [query, setQuery] = useState('');
  const { data, loading } = useApi(
    () => api.products.list({ sellable: true, limit: 100, branchId: branchParam() }).then((result) => result.data),
    [branchId],
  );
  const text = query.trim().toLowerCase();
  const shown = (data ?? []).filter((item) => !text || item.name.toLowerCase().includes(text) || (item.barcode || '').includes(text));

  return (
    <Sheet title="ເພີ່ມສິນຄ້າ" onClose={onClose}>
      <label className="field">
        <Icon name="search" size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາສິນຄ້າ ຫຼື ບາໂຄດ" autoFocus />
      </label>
      {loading && !data && <Skeleton />}
      {!loading && shown.length === 0 && <Empty text="ຍັງບໍ່ມີສິນຄ້າຂາຍ" />}
      {shown.map((item) => {
        const qty = lines.find((line) => line.product.id === item.id)?.qty ?? 0;
        const out = item.qty <= 0;
        return (
          <div key={item.id} className={cls('product-line', out && 'is-out')}>
            <div>
              <b>{item.name}</b>
              <small className={cls(item.isLow && 'low-text')}>
                {money(item.effectivePrice)} ກີບ · ເຫຼືອ {item.qty} {item.unit}{out ? ' · ໝົດ' : ''}
              </small>
            </div>
            <Stepper product={item} qty={qty} onSet={(next) => onChange(setCartQty(lines, item, next))} />
            {qty > 0 ? <em>{money(item.effectivePrice * qty)}</em> : <em />}
          </div>
        );
      })}
      <button type="button" className="btn red wide mt" onClick={onClose}>ແລ້ວໆ</button>
    </Sheet>
  );
}
