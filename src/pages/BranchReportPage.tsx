import { useState } from 'react';
import { Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api } from '../lib/api';
import { formatDay, money, monthStart, shopDate } from '../utils/format';

export function BranchReportPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(shopDate());
  const { data, loading } = useApi(() => api.reports.branches(from, to), [from, to], { live: true });
  const max = Math.max(...(data?.branches.map((row) => row.revenue) ?? [0]), 1);
  const total = data?.total;

  return (
    <div className="page">
      <PageHeader title="ສະຫຼຸບແຕ່ລະສາຂາ" />
      <div className="two pad">
        <div>
          <label className="card-label" htmlFor="br-from">ຈາກ</label>
          <label className="field"><input id="br-from" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value || monthStart())} /></label>
        </div>
        <div>
          <label className="card-label" htmlFor="br-to">ເຖິງ</label>
          <label className="field"><input id="br-to" type="date" value={to} min={from} max={shopDate()} onChange={(event) => setTo(event.target.value || shopDate())} /></label>
        </div>
      </div>
      {loading && !data && <Skeleton rows={5} />}
      {data && total && (
        <>
          <p className="section-label">{formatDay(data.from)} – {formatDay(data.to)}</p>
          <div className="stat-grid four">
            <article className="stat"><span>ລາຍຮັບລວມ</span><b><Kip value={total.revenue} /></b></article>
            <article className="stat"><span>ບໍລິການ / ສິນຄ້າ</span><b>{money(total.serviceRevenue)} / {money(total.productRevenue)}</b></article>
            <article className="stat"><span>ລົດ · ບິນໜ້າຮ້ານ</span><b>{total.cars} · {total.retailSales}</b></article>
            <article className="stat"><span>ສະເລ່ຍຕໍ່ຄັນ</span><b><Kip value={total.avgPerCar} /></b></article>
            <article className="stat"><span>ເງິນສົດ</span><b>{money(total.byMethod.CASH)}</b></article>
            <article className="stat"><span>ໂອນ / QR</span><b>{money(total.byMethod.TRANSFER)} / {money(total.byMethod.QR)}</b></article>
          </div>
          {data.branches.length === 0 && <Empty text="ຍັງບໍ່ມີສາຂາ" />}
          <div className="card">
            {data.branches.map((row) => (
              <div key={row.branch.id} className="hbar">
                <span>{row.branch.code}</span>
                <div><i style={{ width: `${Math.round((row.revenue / max) * 100)}%` }} /></div>
                <b>{money(row.revenue)} · {row.share.toFixed(1)}%</b>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>ສາຂາ</th><th>ລາຍຮັບ</th><th>ບໍລິການ</th><th>ສິນຄ້າ</th><th>ລົດ</th><th>ບິນໜ້າຮ້ານ</th><th>ສະເລ່ຍ/ຄັນ</th><th>%</th><th>ເງິນສົດ</th><th>ໂອນ</th><th>QR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branches.map((row) => (
                    <tr key={row.branch.id}>
                      <td>{row.branch.code} · {row.branch.name}</td>
                      <td>{money(row.revenue)}</td>
                      <td>{money(row.serviceRevenue)}</td>
                      <td>{money(row.productRevenue)}</td>
                      <td>{row.cars}</td>
                      <td>{row.retailSales}</td>
                      <td>{money(row.avgPerCar)}</td>
                      <td>{row.share.toFixed(1)}</td>
                      <td>{money(row.byMethod.CASH)}</td>
                      <td>{money(row.byMethod.TRANSFER)}</td>
                      <td>{money(row.byMethod.QR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="columns">
            {data.branches.map((row) => (
              <div key={row.branch.id} className="card">
                <b>{row.branch.code} · {row.branch.name}</b>
                <span className="card-label">ບໍລິການຂາຍດີ</span>
                {row.topServices.length === 0 && <p className="muted">-</p>}
                {row.topServices.map((service) => (
                  <div key={service.serviceId || service.name} className="line"><span>{service.name}</span><b>{service.count} · {money(service.amount)}</b></div>
                ))}
                <span className="card-label">ສິນຄ້າຂາຍດີ</span>
                {row.topProducts.length === 0 && <p className="muted">-</p>}
                {row.topProducts.map((product) => (
                  <div key={product.productId || product.name} className="line"><span>{product.name}</span><b>{product.qty} · {money(product.amount)}</b></div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
