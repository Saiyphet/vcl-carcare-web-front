import { useState } from 'react';
import { branchName, branchParam } from '../api';
import { Icon } from '../components/Icon';
import { Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api } from '../lib/api';
import { cls, formatLaoMonth, money, serviceColor, shopMonth } from '../utils/format';

export function ReportsPage() {
  const { branchId } = useStore();
  const [month, setMonth] = useState(shopMonth());
  const [day, setDay] = useState<number | null>(null);
  const [year, monthNo] = month.split('-').map(Number);
  const { data: report, loading } = useApi(() => api.reports.monthly(year, monthNo, branchParam()), [month, branchId], { live: true });

  const daily = report?.daily ?? [];
  const max = Math.max(...daily.map((item) => item.revenue), 1);
  const selected = day ? daily[day - 1] : undefined;
  const rows = report
    ? [
        { label: 'ລາຍໄດ້ບໍລິການ', value: `${money(report.serviceRevenue)} ກີບ`, dot: '#2f6bff' },
        { label: 'ລາຍໄດ້ສິນຄ້າ', value: `${money(report.productRevenue)} ກີບ`, dot: '#e10600' },
        { label: 'ຍອດກ່ອນສ່ວນຫຼຸດ', value: `${money(report.grossSales)} ກີບ`, dot: '#111' },
        { label: 'ສ່ວນຫຼຸດ', value: `${money(report.discount)} ກີບ`, dot: '#e10600' },
        { label: 'ຈຳນວນລົດ', value: `${report.cars} ຄັນ`, dot: '#111' },
        { label: 'ສະເລ່ຍຕໍ່ຄັນ', value: `${money(report.avgPerCar)} ກີບ`, dot: '#111' },
        { label: 'ບິນຂາຍໜ້າຮ້ານ', value: `${report.retailSales}`, dot: '#7c3aed' },
        { label: 'ເງິນສົດ', value: `${money(report.byMethod.CASH)} ກີບ`, dot: '#16a34a' },
        { label: 'ໂອນເງິນ', value: `${money(report.byMethod.TRANSFER)} ກີບ`, dot: '#0284c7' },
        { label: 'QR', value: `${money(report.byMethod.QR)} ກີບ`, dot: '#7c3aed' },
      ]
    : [];

  return (
    <div className="page">
      <PageHeader title="ລາຍງານລາຍເດືອນ" />
      <div className="pad">
        <label className="field">
          <Icon name="calendar" size={18} />
          <input type="month" value={month} max={shopMonth()} onChange={(event) => { setMonth(event.target.value || shopMonth()); setDay(null); }} />
        </label>
      </div>
      {loading && !report && <Skeleton rows={5} />}
      {report && (
        <>
          <div className="report-hero">
            <span>{formatLaoMonth(month)} · {branchName(branchId)}</span>
            <div className="hero-num"><Kip value={report.revenue} /></div>
          </div>
          <div className="columns">
            <div>
              <div className="card">
                <div className="bars" role="img" aria-label="ກຣາຟຍອດຂາຍລາຍວັນ">
                  {daily.map((item, index) => {
                    const height = item.revenue <= 0 ? 4 : Math.max(12, Math.round((item.revenue / max) * 140));
                    return (
                      <button
                        key={item.date}
                        type="button"
                        className={cls(index + 1 === day && 'on')}
                        style={{ height: `${height}px` }}
                        aria-label={`${item.date}: ${money(item.revenue)} ກີບ`}
                        onClick={() => setDay(index + 1)}
                      />
                    );
                  })}
                </div>
                <div className="axis">
                  {[1, 5, 10, 15, 20, 25, 30].filter((item) => item <= daily.length).map((item) => <span key={item}>{item}</span>)}
                </div>
                <p className="chart-caption">
                  {selected ? `ວັນທີ ${day}: ${money(selected.revenue)} ກີບ · ${selected.cars} ຄັນ` : 'ແຕະແທ່ງເພື່ອເບິ່ງແຕ່ລະວັນ'}
                </p>
              </div>
              {(report.byBranch?.length ?? 0) > 0 && (
                <>
                  <p className="section-label">ແຍກຕາມສາຂາ</p>
                  <div className="card">
                    {report.byBranch?.map((row) => (
                      <div key={row.id} className="line">
                        <span>{row.code} · {row.name}</span>
                        <b>{money(row.revenue)} · {row.cars} ຄັນ</b>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              <p className="section-label">ສະຫຼຸບຍອດ</p>
              <div className="card summary">
                {rows.map((row) => (
                  <div key={row.label}>
                    <span><i className="dot" style={{ background: row.dot }} />{row.label}</span>
                    <b>{row.value}</b>
                  </div>
                ))}
              </div>
              <p className="section-label">ບໍລິການຂາຍດີ</p>
              <div className="card">
                {report.services.length === 0 && <Empty text="ຍັງບໍ່ມີຍອດ" />}
                {report.services.slice(0, 8).map((service) => (
                  <div key={service.serviceId || service.name} className="rank">
                    <i style={{ background: serviceColor(service.name) }} />
                    <span>{service.name}</span>
                    <b>{service.count} · {money(service.amount)}</b>
                  </div>
                ))}
              </div>
              <p className="section-label">ສິນຄ້າຂາຍດີ</p>
              <div className="card">
                {report.products.length === 0 && <Empty text="ຍັງບໍ່ມີສິນຄ້າຂາຍ" />}
                {report.products.slice(0, 8).map((product) => (
                  <div key={product.productId || product.name} className="line">
                    <span>{product.name}</span>
                    <b>{product.qty} · {money(product.amount)}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
