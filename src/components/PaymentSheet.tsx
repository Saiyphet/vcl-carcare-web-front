import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { PaymentInput, PaymentMethod } from '../lib/api';
import { cls, money, toAmount } from '../utils/format';
import { Icon, type IconName } from './Icon';

export type PayLine = { key: string; name: string; price: number; qty?: number; unitPrice?: number; unit?: string | null; product?: boolean };

const METHODS: Array<{ key: PaymentMethod; label: string; icon: IconName; color: string }> = [
  { key: 'CASH', label: 'ເງິນສົດ', icon: 'cash', color: '#16a34a' },
  { key: 'TRANSFER', label: 'ໂອນເງິນ', icon: 'transfer', color: '#0284c7' },
  { key: 'QR', label: 'QR', icon: 'qr', color: '#7c3aed' },
];

const QUICK = [50000, 100000, 500000];

export function PayLines({ lines }: { lines: PayLine[] }) {
  return (
    <>
      {lines.map((line) => (
        <div key={line.key} className="line">
          <span>
            {line.name}
            {line.product && <small className="line-sub"> {line.qty ?? 1}{line.unit ? ` ${line.unit}` : ''} × {money(line.unitPrice ?? line.price)}</small>}
          </span>
          <b>{money(line.price)}</b>
        </div>
      ))}
    </>
  );
}

/**
 * Item list, method (cash / transfer / QR), cash received + change, refNo, and the ADMIN-only discount.
 * `onConfirm` gets the payment body for api.jobs.pay / api.jobs.create / api.sales.create.
 */
export function PaymentSheet({
  lines,
  subtotal,
  onConfirm,
  busy,
  error,
  confirmLabel = 'ຢືນຢັນຊຳລະ',
}: {
  lines: PayLine[];
  subtotal: number;
  onConfirm: (payment: PaymentInput, change: number) => void;
  busy?: boolean;
  error?: string;
  confirmLabel?: string;
}) {
  const { admin } = useStore();
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [receivedText, setReceivedText] = useState('');
  const [refNo, setRefNo] = useState('');
  const [discountText, setDiscountText] = useState('');
  const discount = admin ? Math.min(toAmount(discountText), subtotal) : 0;
  const net = Math.max(0, subtotal - discount);
  const received = toAmount(receivedText);
  const change = Math.max(0, received - net);
  const short = method === 'CASH' && received < net;

  function confirm() {
    if (short) return;
    onConfirm(
      {
        method,
        discount: admin && discount > 0 ? discount : undefined,
        received: method === 'CASH' ? received : undefined,
        refNo: method !== 'CASH' && refNo.trim() ? refNo.trim() : undefined,
      },
      method === 'CASH' ? change : 0,
    );
  }

  return (
    <div className="pay-sheet">
      <div className="card">
        <PayLines lines={lines} />
        <div className="line total-line"><span>ລວມ</span><b>{money(subtotal)}</b></div>
        {admin && (
          <>
            <label className="card-label" htmlFor="pay-discount">ສ່ວນຫຼຸດ</label>
            <label className="field">
              <input id="pay-discount" inputMode="numeric" value={discountText} placeholder="0" onChange={(event) => setDiscountText(event.target.value.replace(/[^\d]/g, ''))} />
            </label>
          </>
        )}
      </div>
      <p className="section-label">ວິທີຊຳລະເງິນ</p>
      <div className="methods">
        {METHODS.map((item) => (
          <button key={item.key} type="button" className={cls('method', method === item.key && 'on')} onClick={() => setMethod(item.key)}>
            <span style={{ color: item.color }}><Icon name={item.icon} /></span>
            {item.label}
          </button>
        ))}
      </div>
      <div className="card mt">
        {method === 'CASH' ? (
          <>
            <label className="card-label" htmlFor="pay-received">ຮັບເງິນ</label>
            <label className="field">
              <input id="pay-received" inputMode="numeric" value={receivedText ? money(received) : ''} placeholder={money(net)} onChange={(event) => setReceivedText(event.target.value.replace(/[^\d]/g, ''))} />
            </label>
            <div className="quick mt">
              <button type="button" className={cls(received === net && receivedText !== '' && 'on')} onClick={() => setReceivedText(String(net))}>ພໍດີ</button>
              {QUICK.map((amount) => (
                <button key={amount} type="button" className={cls(received === amount && 'on')} onClick={() => setReceivedText(String(amount))}>{money(amount)}</button>
              ))}
            </div>
            <div className="line change-line"><span>ເງິນທອນ</span><b>{money(change)} ກີບ</b></div>
            {short && receivedText !== '' && <p className="alert">ເງິນທີ່ຮັບນ້ອຍກວ່າຍອດຊຳລະ</p>}
          </>
        ) : (
          <>
            <label className="card-label" htmlFor="pay-ref">ເລກອ້າງອີງ (refNo)</label>
            <label className="field">
              <input id="pay-ref" value={refNo} onChange={(event) => setRefNo(event.target.value)} placeholder="ເລກອ້າງອີງການໂອນ / QR" />
            </label>
          </>
        )}
      </div>
      <div className="pay-total">
        <span>ຍອດຊຳລະ</span>
        <b>{money(net)} ກີບ</b>
      </div>
      {error && <p className="alert pad">{error}</p>}
      <div className="pad">
        <button type="button" className="btn red wide" disabled={busy || short} onClick={confirm}>
          {busy ? 'ກຳລັງບັນທຶກ...' : confirmLabel}
        </button>
      </div>
    </div>
  );
}
