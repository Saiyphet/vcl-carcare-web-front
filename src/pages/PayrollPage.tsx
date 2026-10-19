import { useState } from 'react';
import { branchName, branchParam, bump, fieldErrors, notify, report } from '../api';
import { Icon } from '../components/Icon';
import { Payslip } from '../components/Payslip';
import { Avatar, Confirm, Empty, FieldError, Kip, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type AdjustmentType, type PaymentMethod, type PayrollAdjustment, type PayrollRow } from '../lib/api';
import { METHOD_LABEL, cls, formatLaoMonth, money, shopDate, shopMonth, toAmount } from '../utils/format';

const QUICK_REASONS: Record<AdjustmentType, string[]> = {
  DEDUCTION: ['ມາສາຍ', 'ຂາດວຽກ', 'ເຮັດເຄື່ອງເສຍຫາຍ'],
  ADVANCE: ['ເບີກລ່ວງໜ້າ', 'ຄ່າເດີນທາງ', 'ຄ່າປິ່ນປົວ'],
};

function defaultDate(month: string) {
  const today = shopDate();
  return today.startsWith(month) ? today : `${month}-01`;
}

function AdjustDialog({ row, type, month, onClose }: { row: PayrollRow; type: AdjustmentType; month: string; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(defaultDate(month));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const title = type === 'DEDUCTION' ? 'ຕັດເງິນ' : 'ເບີກລ່ວງໜ້າ';

  async function save() {
    const value = toAmount(amount);
    if (value <= 0 || !reason.trim()) {
      setError('ກະລຸນາໃສ່ຈຳນວນ ແລະ ເຫດຜົນ');
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      await api.payroll.addAdjustment({ userId: row.user.id, type, amount: value, reason: reason.trim(), date, month });
      bump();
      notify(`${title} ${row.user.name} ${money(value)} ກີບ`);
      onClose();
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={`${title} · ${row.user.name}`} onClose={onClose}>
      <p className="muted">ເງິນເດືອນ {money(row.baseSalary)} · ຮັບຕົວຈິງຕອນນີ້ {money(row.netPay)}</p>
      <label className="card-label" htmlFor="adj-amount">ຈຳນວນເງິນ</label>
      <label className="field">
        <input id="adj-amount" inputMode="numeric" autoFocus value={amount ? money(toAmount(amount)) : ''} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
      </label>
      <FieldError text={fields.amount} />
      <label className="card-label" htmlFor="adj-reason">ເຫດຜົນ</label>
      <label className="field">
        <input id="adj-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={type === 'DEDUCTION' ? 'ມາສາຍ 30 ນາທີ' : 'ເບີກລ່ວງໜ້າ'} />
      </label>
      <div className="quick mt">
        {QUICK_REASONS[type].map((text) => (
          <button key={text} type="button" onClick={() => setReason(text)}>{text}</button>
        ))}
      </div>
      <FieldError text={fields.reason} />
      <label className="card-label" htmlFor="adj-date">ວັນທີ</label>
      <label className="field">
        <input id="adj-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <FieldError text={fields.date} />
      {error && <p className="alert">{error}</p>}
      <button type="button" className="btn red wide mt" disabled={busy} onClick={() => void save()}>{busy ? '...' : `ບັນທຶກ${title}`}</button>
    </Sheet>
  );
}

function PayDialog({ row, month, onClose }: { row: PayrollRow; month: string; onClose: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setBusy(true);
    setError('');
    try {
      await api.payroll.pay({ userId: row.user.id, month, method, note: note.trim() || undefined });
      bump();
      notify(`ຈ່າຍເງິນເດືອນ ${row.user.name} ແລ້ວ`);
      onClose();
    } catch (reason) {
      setError(report(reason, 'ຈ່າຍບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Confirm title={`ຈ່າຍເງິນເດືອນ · ${row.user.name}`} confirmLabel="ຢືນຢັນຈ່າຍ" busy={busy} onConfirm={() => void pay()} onClose={onClose}>
      <div className="line"><span>ເງິນເດືອນ</span><b>{money(row.baseSalary)}</b></div>
      <div className="line"><span>ຕັດເງິນ</span><b>−{money(row.totalDeductions)}</b></div>
      <div className="line"><span>ເບີກລ່ວງໜ້າ</span><b>−{money(row.totalAdvances)}</b></div>
      <div className={cls('line big', row.netPay < 0 && 'negative')}><span>ຮັບຕົວຈິງ</span><b>{money(row.netPay)} ກີບ</b></div>
      <span className="card-label">ວິທີຈ່າຍ</span>
      <div className="segment">
        {(['CASH', 'TRANSFER'] as const).map((item) => (
          <button key={item} type="button" className={cls(method === item && 'on')} onClick={() => setMethod(item)}>{METHOD_LABEL[item]}</button>
        ))}
      </div>
      <label className="card-label" htmlFor="pay-note">ໝາຍເຫດ</label>
      <label className="field"><input id="pay-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ບໍ່ບັງຄັບ" /></label>
      <p className="footnote">ຈ່າຍແລ້ວຈະລັອກເດືອນນີ້ ເພີ່ມ ຫຼື ລຶບ ຕັດເງິນ/ເບີກ ບໍ່ໄດ້</p>
      {error && <p className="alert">{error}</p>}
    </Confirm>
  );
}

function SlipDrawer({ row, month, onClose }: { row: PayrollRow; month: string; onClose: () => void }) {
  const { data, loading, reload } = useApi(() => api.payroll.payslip(row.user.id, month), [row.user.id, month], { live: true });
  const [remove, setRemove] = useState<PayrollAdjustment | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api.payroll.removeAdjustment(remove.id);
      bump();
      notify('ລຶບແລ້ວ');
      setRemove(null);
      reload();
    } catch (reason) {
      report(reason, 'ລຶບບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title="ສະລິບເງິນເດືອນ" onClose={onClose}>
      {loading && !data && <Skeleton rows={5} />}
      {data && <Payslip slip={data} onRemove={setRemove} />}
      {remove && (
        <Confirm
          title="ລຶບລາຍການ"
          text={`${remove.type === 'DEDUCTION' ? 'ຕັດເງິນ' : 'ເບີກ'} ${money(remove.amount)} · ${remove.reason}`}
          confirmLabel="ລຶບ"
          busy={busy}
          onConfirm={() => void confirmRemove()}
          onClose={() => setRemove(null)}
        />
      )}
    </Sheet>
  );
}

export function PayrollPage() {
  const { session, branchId } = useStore();
  const [month, setMonth] = useState(shopMonth());
  const { data, loading } = useApi(() => api.payroll.sheet(month, branchParam()), [month, branchId], { live: true });
  const [adjust, setAdjust] = useState<{ row: PayrollRow; type: AdjustmentType } | null>(null);
  const [pay, setPay] = useState<PayrollRow | null>(null);
  const [slip, setSlip] = useState<PayrollRow | null>(null);
  const [unpay, setUnpay] = useState<PayrollRow | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = data?.rows ?? [];
  const totals = data?.totals;
  const paidCount = rows.filter((row) => row.status === 'PAID').length;
  const remaining = rows.filter((row) => row.status !== 'PAID').reduce((sum, row) => sum + row.netPay, 0);

  async function confirmUnpay() {
    if (!unpay?.payrollId) return;
    setBusy(true);
    try {
      await api.payroll.unpay(unpay.payrollId);
      bump();
      notify(`ຍົກເລີກການຈ່າຍ ${unpay.user.name} ແລ້ວ`);
      setUnpay(null);
    } catch (reason) {
      report(reason, 'ຍົກເລີກບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ເງິນເດືອນ" />
      <div className="pad">
        <label className="field">
          <Icon name="calendar" size={18} />
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value || shopMonth())} />
        </label>
      </div>
      <p className="section-label">{formatLaoMonth(month)} · {branchName(branchId)}</p>
      {totals && (
        <div className="stat-grid four">
          <article className="stat"><span>ເງິນເດືອນລວມ</span><b><Kip value={totals.baseSalary} /></b></article>
          <article className="stat"><span>ຕັດເງິນ</span><b><Kip value={totals.totalDeductions} /></b></article>
          <article className="stat"><span>ເບີກລ່ວງໜ້າ</span><b><Kip value={totals.totalAdvances} /></b></article>
          <article className="stat accent"><span>ຕ້ອງຈ່າຍສຸດທິ</span><b><Kip value={totals.netPay} /></b></article>
          <article className="stat"><span>ຈ່າຍແລ້ວ / ພະນັກງານ</span><b>{paidCount} / {totals.staff}</b></article>
          <article className="stat"><span>ຍັງເຫຼືອຕ້ອງຈ່າຍ</span><b><Kip value={remaining} /></b></article>
        </div>
      )}
      {loading && !data && <Skeleton rows={5} />}
      {!loading && rows.length === 0 && <Empty text="ບໍ່ມີພະນັກງານ" />}
      <div className="payroll-list">
        {rows.map((row) => {
          const paid = row.status === 'PAID';
          const own = row.user.id === session?.userId;
          return (
            <article key={row.user.id} className="card payroll-row">
              <div className="person">
                <Avatar name={row.user.name} size={42} />
                <div>
                  <b>{row.user.name}</b>
                  <small>{row.user.position || '-'} · {row.user.branch?.code ?? 'ທຸກສາຂາ'}</small>
                </div>
                <span className={cls('pay-status', paid ? 'paid' : 'unpaid')}>{paid ? 'ຈ່າຍແລ້ວ' : 'ຍັງບໍ່ຈ່າຍ'}</span>
              </div>
              <div className="payroll-nums">
                <div><span>ເງິນເດືອນ</span><b>{money(row.baseSalary)}</b></div>
                <div><span>ຕັດເງິນ</span><b className="minus">{row.totalDeductions ? `−${money(row.totalDeductions)}` : '0'}</b></div>
                <div><span>ເບີກ</span><b className="minus">{row.totalAdvances ? `−${money(row.totalAdvances)}` : '0'}</b></div>
                <div><span>ຮັບຕົວຈິງ</span><b className={cls('net', row.netPay < 0 && 'negative')}>{money(row.netPay)}</b></div>
              </div>
              <div className="payroll-actions">
                {!own && <button type="button" className="mini" disabled={paid} onClick={() => setAdjust({ row, type: 'DEDUCTION' })}>ຕັດເງິນ</button>}
                {!own && <button type="button" className="mini" disabled={paid} onClick={() => setAdjust({ row, type: 'ADVANCE' })}>ເບີກລ່ວງໜ້າ</button>}
                <button type="button" className="mini" onClick={() => setSlip(row)}>ລາຍລະອຽດ</button>
                {!own && (paid ? (
                  <button type="button" className="mini danger" onClick={() => setUnpay(row)}>ຍົກເລີກການຈ່າຍ</button>
                ) : (
                  <button type="button" className="status-btn done" onClick={() => setPay(row)}>ຈ່າຍເງິນເດືອນ</button>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      {adjust && <AdjustDialog row={adjust.row} type={adjust.type} month={month} onClose={() => setAdjust(null)} />}
      {pay && <PayDialog row={pay} month={month} onClose={() => setPay(null)} />}
      {slip && <SlipDrawer row={slip} month={month} onClose={() => setSlip(null)} />}
      {unpay && (
        <Confirm
          title="ຍົກເລີກການຈ່າຍ"
          text={`${unpay.user.name} · ${money(unpay.netPay)} ກີບ — ເດືອນນີ້ຈະແກ້ໄຂໄດ້ອີກ`}
          confirmLabel="ຍົກເລີກການຈ່າຍ"
          busy={busy}
          onConfirm={() => void confirmUnpay()}
          onClose={() => setUnpay(null)}
        />
      )}
    </div>
  );
}
