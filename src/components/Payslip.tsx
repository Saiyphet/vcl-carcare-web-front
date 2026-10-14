import { SHOP } from '../config';
import type { PayrollAdjustment, Payslip as PayslipData } from '../lib/api';
import { METHOD_LABEL, cls, formatLaoDate, formatLaoDateTime, formatLaoMonth, money } from '../utils/format';
import { Icon } from './Icon';

/** Read-only payslip. `onRemove` (ADMIN, month UNPAID) shows a delete button on each adjustment. */
export function Payslip({ slip, onRemove }: { slip: PayslipData; onRemove?: (item: PayrollAdjustment) => void }) {
  const paid = slip.status === 'PAID';
  const row = (item: PayrollAdjustment) => (
    <div key={item.id} className="line">
      <span>
        {formatLaoDate(item.date)} · {item.reason}
      </span>
      <span className="discount-side">
        <b className="minus">−{money(item.amount)}</b>
        {onRemove && !paid && (
          <button type="button" className="mini danger no-print" aria-label="ລຶບ" onClick={() => onRemove(item)}>
            <Icon name="trash" size={14} />
          </button>
        )}
      </span>
    </div>
  );

  return (
    <article className="paper payslip">
      <div className="center">
        <h2>{SHOP.name}</h2>
        <div>ສະລິບເງິນເດືອນ · {formatLaoMonth(slip.month)}</div>
      </div>
      <hr className="dash" />
      <div className="line"><span>ຊື່</span><b>{slip.user.name}</b></div>
      {slip.user.position && <div className="line"><span>ຕຳແໜ່ງ</span><b>{slip.user.position}</b></div>}
      <div className="line"><span>ສາຂາ</span><b>{slip.user.branch?.name ?? '-'}</b></div>
      <hr className="dash" />
      <div className="line"><span>ເງິນເດືອນ</span><b>{money(slip.baseSalary)}</b></div>
      <p className="slip-label">ຕັດເງິນ</p>
      {slip.deductions.length === 0 && <p className="slip-none">-</p>}
      {slip.deductions.map(row)}
      <p className="slip-label">ເບີກລ່ວງໜ້າ</p>
      {slip.advances.length === 0 && <p className="slip-none">-</p>}
      {slip.advances.map(row)}
      <hr className="dash" />
      <div className={cls('line big', slip.netPay < 0 && 'negative')}><span>ຮັບຕົວຈິງ</span><b>{money(slip.netPay)} ກີບ</b></div>
      <div className="line">
        <span>ສະຖານະ</span>
        <span className={cls('pay-status', paid ? 'paid' : 'unpaid')}>{paid ? 'ຈ່າຍແລ້ວ' : 'ຍັງບໍ່ຈ່າຍ'}</span>
      </div>
      {paid && slip.paidAt && <div className="line"><span>ວັນທີຈ່າຍ</span><b>{formatLaoDateTime(slip.paidAt)}</b></div>}
      {paid && slip.method && <div className="line"><span>ວິທີຈ່າຍ</span><b>{METHOD_LABEL[slip.method]}</b></div>}
      {slip.note && <div className="line"><span>ໝາຍເຫດ</span><b>{slip.note}</b></div>}
      <div className="no-print mt">
        <button type="button" className="btn ghost wide" onClick={() => window.print()}>
          <Icon name="print" size={18} /> ພິມ
        </button>
      </div>
    </article>
  );
}
