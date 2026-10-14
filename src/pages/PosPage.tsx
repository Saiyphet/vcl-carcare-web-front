import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { branchParam, bump, needsBranch, notify, report } from '../api';
import { Icon } from '../components/Icon';
import { PaymentSheet, type PayLine } from '../components/PaymentSheet';
import { StatusChip } from '../components/StatusChip';
import { BranchNeeded, Empty, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Job, type PaymentInput, type Product, type ProductCategory } from '../lib/api';
import { METHOD_LABEL, cls, formatPhone, formatTime, isUnpaid, money, shopDate, toAmount, digitsOnly } from '../utils/format';
import { CancelDialog } from './UnpaidPage';

type Line = { product: Product; qty: number; price?: number };
type Done = { id: string; code: string; total: number; change: number };

const unitPrice = (line: Line) => line.price ?? line.product.effectivePrice;

function History() {
  const { branchId } = useStore();
  const navigate = useNavigate();
  const [date, setDate] = useState(shopDate());
  const [cancel, setCancel] = useState<Job | null>(null);
  const { data, loading } = useApi(() => api.sales.list({ date, branchId: branchParam(), limit: 100 }).then((result) => result.data), [date, branchId], { live: true });
  const rows = data ?? [];

  return (
    <>
      <div className="pad">
        <label className="field">
          <Icon name="calendar" size={18} />
          <input type="date" value={date} max={shopDate()} onChange={(event) => setDate(event.target.value || shopDate())} />
        </label>
      </div>
      <div className="card">
        {loading && !data && <Skeleton />}
        {!loading && rows.length === 0 && <Empty text="ຍັງບໍ່ມີບິນຂາຍ" />}
        {rows.map((sale) => (
          <div key={sale.id} className="sale-row">
            <button type="button" className="sale-main" onClick={() => navigate(sale.status === 'DONE' ? `/jobs/${sale.id}/receipt` : `/jobs/${sale.id}`)}>
              <span className="sale-top">
                <b>{sale.code}</b>
                <StatusChip status={sale.status} />
              </span>
              <span className="muted">
                {formatTime(sale.paidAt || sale.receivedAt)} · {sale.items.map((item) => `${item.serviceName} ×${item.qty ?? 1}`).join(', ')}
              </span>
              <span className="sale-top">
                <span className="muted">{sale.payment ? METHOD_LABEL[sale.payment.method] : '-'}</span>
                <b>{money(sale.total)} ກີບ</b>
              </span>
            </button>
            {isUnpaid(sale.status) && (
              <div className="row-actions">
                <button type="button" className="mini" onClick={() => setCancel(sale)}>ຍົກເລີກ</button>
                <Link className="status-btn ready" to={`/jobs/${sale.id}/pay`}>ຊຳລະ</Link>
              </div>
            )}
          </div>
        ))}
      </div>
      {cancel && <CancelDialog job={cancel} onClose={() => setCancel(null)} />}
    </>
  );
}

export function PosPage() {
  const { admin, branchId } = useStore();
  const navigate = useNavigate();
  const blocked = needsBranch();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'sell' | 'history'>('sell');
  const [category, setCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editPrice, setEditPrice] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const products = useApi(
    () => api.products.list({ sellable: true, limit: 100, branchId: branchParam() }).then((result) => result.data),
    [branchId],
    { enabled: !blocked },
  );

  // drop cart rows from another branch
  useEffect(() => {
    setCart([]);
  }, [branchId]);

  // after a refetch, use the new stock and cap the cart to it
  useEffect(() => {
    const list = products.data;
    if (!list) return;
    setCart((current) =>
      current.flatMap((line) => {
        const fresh = list.find((item) => item.id === line.product.id);
        if (!fresh || fresh.qty <= 0) return [];
        return [{ ...line, product: fresh, qty: Math.min(line.qty, fresh.qty) }];
      }),
    );
  }, [products.data]);

  useEffect(() => {
    if (tab === 'sell' && !blocked) barcodeRef.current?.focus();
  }, [tab, blocked]);

  const text = query.trim().toLowerCase();
  const shown = (products.data ?? []).filter(
    (item) => (category === 'ALL' || item.category === category) && (!text || item.name.toLowerCase().includes(text) || (item.barcode || '').includes(text)),
  );
  const total = cart.reduce((sum, line) => sum + unitPrice(line) * line.qty, 0);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const payLines: PayLine[] = cart.map((line) => ({
    key: line.product.id,
    name: line.product.name,
    qty: line.qty,
    unit: line.product.unit,
    unitPrice: unitPrice(line),
    price: unitPrice(line) * line.qty,
    product: true,
  }));

  function focusScanner() {
    window.setTimeout(() => barcodeRef.current?.focus(), 0);
  }

  function put(product: Product, qty: number) {
    const capped = Math.max(0, Math.min(product.qty, Math.round(qty) || 0));
    if (qty > product.qty) notify(`ສິນຄ້າບໍ່ພໍ: ${product.name} ເຫຼືອ ${product.qty} ${product.unit}`);
    setCart((current) => {
      const rest = current.filter((line) => line.product.id !== product.id);
      if (capped <= 0) return rest;
      const old = current.find((line) => line.product.id === product.id);
      const next = { product, qty: capped, price: old?.price };
      return old ? current.map((line) => (line.product.id === product.id ? next : line)) : [...current, next];
    });
  }

  const qtyOf = (id: string) => cart.find((line) => line.product.id === id)?.qty ?? 0;

  async function scan(event: FormEvent) {
    event.preventDefault();
    const code = barcode.trim();
    setBarcode('');
    if (!code || blocked) return;
    try {
      const found = await api.products.byBarcode(code, branchParam());
      if (!found) {
        notify('ບໍ່ພົບສິນຄ້າ');
        return;
      }
      if (found.qty <= 0) {
        notify(`${found.name} ໝົດ`);
        return;
      }
      put(found, qtyOf(found.id) + 1);
    } catch (reason) {
      report(reason, 'ສະແກນບໍ່ສຳເລັດ');
    } finally {
      focusScanner();
    }
  }

  function reset() {
    setCart([]);
    setCustomerName('');
    setPhone('');
    setNote('');
    setDone(null);
    setError('');
    setPayOpen(false);
    setCartOpen(false);
    focusScanner();
  }

  async function sell(payment: PaymentInput, change: number) {
    setBusy(true);
    setError('');
    try {
      const sale = await api.sales.create({
        branchId: branchParam(),
        items: cart.map((line) => ({ productId: line.product.id, qty: line.qty, price: admin && line.price != null ? line.price : undefined })),
        customerName: customerName.trim() || undefined,
        customerPhone: digitsOnly(phone) || undefined,
        note: note.trim() || undefined,
        payment,
      });
      setDone({ id: sale.id, code: sale.code, total: sale.total, change: sale.payment?.change ?? change });
      setCart([]);
      setPayOpen(false);
      setCartOpen(false);
      bump();
      products.reload();
    } catch (reason) {
      setError(report(reason, 'ຂາຍບໍ່ສຳເລັດ'));
      products.reload();
    } finally {
      setBusy(false);
    }
  }

  const cartView = (
    <>
      <div className="cart-head">
        <b>ກະຕ່າ</b>
        {cart.length > 0 && <button type="button" className="mini" onClick={() => setCart([])}>ລ້າງ</button>}
      </div>
      {cart.length === 0 && <p className="empty">ຍັງບໍ່ໄດ້ເລືອກ</p>}
      {cart.map((line) => (
        <div key={line.product.id} className="cart-line">
          <div className="cart-name">
            <b>{line.product.name}</b>
            {admin && editPrice === line.product.id ? (
              <input
                className="price-input"
                inputMode="numeric"
                autoFocus
                defaultValue={String(unitPrice(line))}
                onBlur={(event) => {
                  const value = toAmount(event.target.value);
                  setCart((current) => current.map((row) => (row.product.id === line.product.id ? { ...row, price: value === row.product.effectivePrice ? undefined : value } : row)));
                  setEditPrice(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                }}
              />
            ) : (
              <button type="button" className={cls('price-tap', line.price != null && 'changed')} disabled={!admin} onClick={() => setEditPrice(line.product.id)}>
                {money(unitPrice(line))} × {line.qty} = {money(unitPrice(line) * line.qty)}
              </button>
            )}
          </div>
          <div className="stepper">
            <button type="button" aria-label="ຫຼຸດ" onClick={() => put(line.product, line.qty - 1)}><Icon name="minus" size={16} /></button>
            <input
              className="qty-input"
              inputMode="numeric"
              aria-label="ຈຳນວນ"
              value={line.qty}
              onChange={(event) => put(line.product, toAmount(event.target.value))}
            />
            <button type="button" aria-label="ເພີ່ມ" disabled={line.qty >= line.product.qty} onClick={() => put(line.product, line.qty + 1)}><Icon name="plus" size={16} /></button>
          </div>
        </div>
      ))}
      <label className="card-label" htmlFor="pos-name">ຊື່ລູກຄ້າ</label>
      <label className="field"><input id="pos-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="ບໍ່ບັງຄັບ" /></label>
      <label className="card-label" htmlFor="pos-phone">ເບີໂທ</label>
      <label className="field"><input id="pos-phone" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => phone && setPhone(formatPhone(phone))} placeholder="ບໍ່ບັງຄັບ" /></label>
      <label className="card-label" htmlFor="pos-note">ໝາຍເຫດ</label>
      <label className="field"><input id="pos-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ບໍ່ບັງຄັບ" /></label>
      <div className="line total-line"><span>ລວມ · {count} ລາຍການ</span><b>{money(total)} ກີບ</b></div>
      <button type="button" className="btn red wide" disabled={cart.length === 0} onClick={() => { setError(''); setPayOpen(true); }}>ຊຳລະເງິນ</button>
    </>
  );

  return (
    <div className="page pos">
      <PageHeader title="ຂາຍໜ້າຮ້ານ" />
      <div className="tabs">
        <button type="button" className={cls(tab === 'sell' && 'on')} onClick={() => setTab('sell')}>ຂາຍ</button>
        <button type="button" className={cls(tab === 'history' && 'on')} onClick={() => setTab('history')}>ປະຫວັດການຂາຍ</button>
      </div>
      {tab === 'history' && <History />}
      {tab === 'sell' && blocked && <BranchNeeded />}
      {tab === 'sell' && !blocked && (
        <div className="pos-layout">
          <div>
            <form className="pad-x" onSubmit={(event) => void scan(event)}>
              <label className="field scan">
                <Icon name="qr" size={18} />
                <input ref={barcodeRef} value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="ສະແກນບາໂຄດ ແລ້ວກົດ Enter" aria-label="ບາໂຄດ" autoComplete="off" />
              </label>
            </form>
            <div className="pad-x mt-s">
              <label className="field">
                <Icon name="search" size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ" />
              </label>
            </div>
            <div className="tabs three">
              <button type="button" className={cls(category === 'ALL' && 'on')} onClick={() => setCategory('ALL')}>ທັງໝົດ</button>
              <button type="button" className={cls(category === 'CHEMICAL' && 'on')} onClick={() => setCategory('CHEMICAL')}>ນ້ຳຢາ</button>
              <button type="button" className={cls(category === 'EQUIPMENT' && 'on')} onClick={() => setCategory('EQUIPMENT')}>ອຸປະກອນ</button>
            </div>
            {products.loading && !products.data && <Skeleton rows={4} />}
            <div className="pos-grid pad-x">
              {!products.loading && shown.length === 0 && <Empty text="ຍັງບໍ່ມີສິນຄ້າຂາຍ" />}
              {shown.map((item) => {
                const inCart = qtyOf(item.id);
                const out = item.qty <= 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cls('pos-tile', out && 'is-out', inCart > 0 && 'on')}
                    disabled={out || inCart >= item.qty}
                    onClick={() => {
                      put(item, inCart + 1);
                      focusScanner();
                    }}
                  >
                    {out && <em className="out-badge">ໝົດ</em>}
                    {inCart > 0 && <em className="cart-badge">{inCart}</em>}
                    <b>{item.name}</b>
                    <span>{money(item.effectivePrice)} ກີບ</span>
                    <small className={cls(item.isLow && 'low-text')}>ເຫຼືອ {item.qty} {item.unit}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="pos-cart card desktop-only">{cartView}</aside>
        </div>
      )}
      {tab === 'sell' && !blocked && cart.length > 0 && (
        <button type="button" className="cart-bar mobile-only" onClick={() => setCartOpen(true)}>
          <span>ລວມ {money(total)} ກີບ · {count} ລາຍການ</span>
          <b>ເບິ່ງກະຕ່າ</b>
        </button>
      )}
      {error && !payOpen && <p className="alert pad">{error}</p>}
      {cartOpen && (
        <Sheet title="ກະຕ່າ" onClose={() => { setCartOpen(false); focusScanner(); }}>
          <div className="cart-sheet">{cartView}</div>
        </Sheet>
      )}
      {payOpen && (
        <Sheet title="ຊຳລະເງິນ" onClose={() => setPayOpen(false)}>
          <PaymentSheet lines={payLines} subtotal={total} busy={busy} error={error} onConfirm={(payment, change) => void sell(payment, change)} />
        </Sheet>
      )}
      {done && (
        <Sheet title="ຂາຍສຳເລັດ" onClose={reset}>
          <p className="paid-banner flush">ຂາຍແລ້ວ · {done.code}</p>
          <div className="line"><span>ຍອດຊຳລະ</span><b>{money(done.total)} ກີບ</b></div>
          <div className="line"><span>ເງິນທອນ</span><b>{money(done.change)} ກີບ</b></div>
          <div className="pair flush">
            <button type="button" className="btn ghost" onClick={() => navigate(`/jobs/${done.id}/receipt`)}>
              <Icon name="print" size={18} /> ພິມໃບບິນ
            </button>
            <button type="button" className="btn red" onClick={reset}>ຂາຍໃໝ່</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
