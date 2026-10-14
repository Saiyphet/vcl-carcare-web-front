import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Payslip } from '../components/Payslip';
import { Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api } from '../lib/api';
import { shopDate, shopMonth } from '../utils/format';

function monthRange(month: string) {
  const [year, index] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  const end = `${month}-${String(last).padStart(2, '0')}`;
  const today = shopDate();
  return { from: `${month}-01`, to: end > today ? today : end };
}

export function PayslipPage() {
  const [month, setMonth] = useState(shopMonth());
  const slip = useApi(() => api.payroll.me(month), [month], { live: true });
  const range = monthRange(month);
  const mine = useApi(() => api.reports.me(range.from, range.to), [month], { live: true });

  return (
    <div className="page">
      <div className="no-print">
        <PageHeader title="ສະລິບເງິນເດືອນ" />
        <div className="pad">
          <label className="field">
            <Icon name="calendar" size={18} />
            <input type="month" value={month} max={shopMonth()} onChange={(event) => setMonth(event.target.value || shopMonth())} />
          </label>
        </div>
      </div>
      <div className="columns">
        <div>
          {slip.loading && !slip.data && <Skeleton rows={6} />}
          {!slip.loading && !slip.data && <Empty text="ບໍ່ພົບສະລິບ" />}
          {slip.data && <Payslip slip={slip.data} />}
        </div>
        <div className="no-print">
          <p className="section-label">ຄ່າຄອມຂອງຂ້ອຍ (ແຍກຈາກເງິນເດືອນ)</p>
          <div className="stat-grid">
            <article className="stat"><span>ຄ່າຄອມ</span><b><Kip value={mine.data?.commission ?? 0} /></b></article>
            <article className="stat"><span>ຍອດຂາຍ</span><b><Kip value={mine.data?.sales ?? 0} /></b></article>
            <article className="stat"><span>ລົດ</span><b>{mine.data?.cars ?? 0} ຄັນ</b></article>
            <article className="stat"><span>ລາຍການ</span><b>{mine.data?.items ?? 0}</b></article>
          </div>
        </div>
      </div>
    </div>
  );
}
