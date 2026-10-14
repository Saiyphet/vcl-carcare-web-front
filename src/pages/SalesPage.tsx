import { useState } from 'react';
import { Link } from 'react-router-dom';
import { branchParam } from '../api';
import { Icon } from '../components/Icon';
import { Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api } from '../lib/api';
import { formatDay, money, serviceColor, shopDate } from '../utils/format';

export function SalesPage() {
  const { admin, branchId } = useStore();
  const [date, setDate] = useState(shopDate());
  const { data: daily, loading } = useApi(() => api.reports.daily(date, branchParam()), [date, branchId], { live: true });
  const mine = useApi(() => api.reports.me(date, date), [date], { live: true });
  const cards = [
    { label: 'ເງິນສົດ', value: daily?.byMethod.CASH ?? 0, icon: 'cash' as const, color: '#16a34a' },
    { label: 'ໂອນເງິນ', value: daily?.byMethod.TRANSFER ?? 0, icon: 'transfer' as const, color: '#0284c7' },
    { label: 'QR', value: daily?.byMethod.QR ?? 0, icon: 'qr' as const, color: '#7c3aed' },
  ];

  return (
    <div className="page">
      <PageHeader title="ຍອດຂາຍມື້ນີ້" />
      <div className="pad">
        <label className="field">
          <Icon name="calendar" size={18} />
          <input type="date" value={date} max={shopDate()} onChange={(event) => setDate(event.target.value || shopDate())} />
        </label>
      </div>
      {loading && !daily && <Skeleton rows={5} />}
      {daily && (
        <div className="columns">
          <div>
            <div className="sales-top">
              <div>
                <b>{formatDay(daily.date)}</b>
                {admin && <Link to="/reports/monthly">ລາຍເດືອນ</Link>}
              </div>
              <div className="car-count">
                <span>ຈຳນວນລົດ</span>
                <b>{daily.cars} ຄັນ</b>
              </div>
            </div>
            <div className="hero-num pad"><Kip value={daily.revenue} /></div>
            <div className="method-stats">
              <article>
                <span>ລາຍໄດ້ບໍລິການ</span>
                <b><Kip value={daily.serviceRevenue} unit={false} /></b>
              </article>
              <article>
                <span>ລາຍໄດ້ສິນຄ້າ</span>
                <b><Kip value={daily.productRevenue} unit={false} /></b>
              </article>
              <article>
                <span>ບິນຂາຍໜ້າຮ້ານ</span>
                <b>{daily.retailSales}</b>
              </article>
            </div>
            <div className="method-stats">
              {cards.map((card) => (
                <article key={card.label}>
                  <span style={{ color: card.color }}><Icon name={card.icon} /></span>
                  <span>{card.label}</span>
                  <b><Kip value={card.value} unit={false} /></b>
                </article>
              ))}
            </div>
            <div className="card summary">
              <div><span>ຍອດກ່ອນສ່ວນຫຼຸດ</span><b>{money(daily.grossSales)}</b></div>
              <div><span>ສ່ວນຫຼຸດ</span><b>{money(daily.discount)}</b></div>
              <div><span>ສະເລ່ຍຕໍ່ຄັນ</span><b>{money(daily.avgPerCar)}</b></div>
              <div><span>ລໍຖ້າຊຳລະ / ຍົກເລີກ</span><b>{daily.inQueue} / {daily.cancelled}</b></div>
              <div><span>ຄ່າຄອມຂອງຂ້ອຍ</span><b className="money">{money(mine.data?.commission ?? 0)}</b></div>
            </div>
          </div>
          <div>
            {admin && (daily.byBranch?.length ?? 0) > 0 && (
              <>
                <p className="section-label">ແຍກຕາມສາຂາ</p>
                <div className="card">
                  <div className="table-scroll">
                    <table className="table">
                      <thead><tr><th>ສາຂາ</th><th>ລາຍຮັບ</th><th>ລົດ</th><th>ບິນໜ້າຮ້ານ</th></tr></thead>
                      <tbody>
                        {daily.byBranch?.map((row) => (
                          <tr key={row.id}><td>{row.code} · {row.name}</td><td>{money(row.revenue)}</td><td>{row.cars}</td><td>{row.retailSales}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            <p className="section-label">ບໍລິການທີ່ຂາຍ</p>
            <div className="card">
              {daily.services.length === 0 && <Empty text="ຍັງບໍ່ມີຍອດຂາຍ" />}
              {daily.services.map((service) => (
                <div key={service.serviceId || service.name} className="rank">
                  <i style={{ background: serviceColor(service.name) }} />
                  <span>{service.name}</span>
                  <b>{service.count} · {money(service.amount)}</b>
                </div>
              ))}
            </div>
            <p className="section-label">ສິນຄ້າຂາຍດີ</p>
            <div className="card">
              {daily.products.length === 0 && <Empty text="ຍັງບໍ່ມີສິນຄ້າຂາຍ" />}
              {daily.products.map((product) => (
                <div key={product.productId || product.name} className="line">
                  <span>{product.name}</span>
                  <b>{product.qty} · {money(product.amount)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
