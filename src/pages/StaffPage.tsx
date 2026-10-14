import { useState } from 'react';
import { branchParam } from '../api';
import { Avatar, Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api } from '../lib/api';
import { money, monthStart, shopDate } from '../utils/format';

export function StaffPage() {
  const { branchId } = useStore();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(shopDate());
  const { data, loading } = useApi(() => api.reports.staff(from, to, branchParam()), [from, to, branchId], { live: true });
  const rows = [...(data?.staff ?? [])].sort((a, b) => b.commission - a.commission);
  const sales = rows.reduce((sum, row) => sum + row.sales, 0);

  return (
    <div className="page">
      <PageHeader title="ຄ່າຄອມພະນັກງານ" />
      <div className="two pad">
        <div>
          <label className="card-label" htmlFor="st-from">ຈາກ</label>
          <label className="field"><input id="st-from" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value || monthStart())} /></label>
        </div>
        <div>
          <label className="card-label" htmlFor="st-to">ເຖິງ</label>
          <label className="field"><input id="st-to" type="date" value={to} min={from} max={shopDate()} onChange={(event) => setTo(event.target.value || shopDate())} /></label>
        </div>
      </div>
      <div className="stat-grid">
        <article className="stat"><span>ຄ່າຄອມລວມ</span><b><Kip value={data?.totalCommission ?? 0} /></b></article>
        <article className="stat"><span>ຍອດຂາຍ</span><b><Kip value={sales} /></b></article>
      </div>
      <div className="card">
        {loading && !data && <Skeleton rows={4} />}
        {!loading && rows.length === 0 && <Empty text="ຍັງບໍ່ມີຂໍ້ມູນ" />}
        {rows.map((member) => (
          <div key={member.id} className="person">
            <Avatar name={member.name} size={46} />
            <div>
              <b>{member.name}</b>
              <small>{member.position || (member.role === 'ADMIN' ? 'ເຈົ້າຂອງຮ້ານ' : 'ພະນັກງານ')}{member.branch ? ` · ${member.branch.code}` : ''}</small>
              <small>{member.cars} ຄັນ · {member.items} ລາຍການ · ຍອດ {money(member.sales)}</small>
            </div>
            <div className="person-meta">
              <b className="money">{money(member.commission)}</b>
              <small>ຄ່າຄອມ</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
