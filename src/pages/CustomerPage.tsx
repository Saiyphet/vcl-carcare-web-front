import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusChip } from '../components/StatusChip';
import { Avatar, Empty, Kip, PageHeader, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api } from '../lib/api';
import { SIZE_LABEL, formatLaoDate, formatLaoDateTime, formatPhone, money, vehicleText } from '../utils/format';
import { AppointmentForm } from './AppointmentsPage';

export function CustomerPage() {
  const { id = '' } = useParams();
  const { data: customer, loading } = useApi(() => api.customers.get(id), [id], { live: true });
  const [open, setOpen] = useState(false);

  return (
    <div className="page">
      <PageHeader title="ຂໍ້ມູນລູກຄ້າ" />
      {loading && !customer && <Skeleton rows={5} />}
      {!loading && !customer && <Empty text="ບໍ່ພົບລູກຄ້າ" />}
      {customer && (
        <>
          <div className="columns">
            <div>
              <div className="card profile">
                <Avatar name={customer.name} size={64} />
                <div>
                  <b>{customer.name}</b>
                  <div>{customer.phone ? <a href={`tel:${customer.phone}`}>{formatPhone(customer.phone)}</a> : '-'}</div>
                  {customer.tier === 'MEMBER' && <span className="pill">ສະມາຊິກ</span>}
                </div>
              </div>
              <div className="stat-grid">
                <article className="stat"><span>ຈຳນວນຄັ້ງ</span><b>{customer.totalVisits} ຄັ້ງ</b></article>
                <article className="stat"><span>ຍອດໃຊ້ຈ່າຍທັງໝົດ</span><b><Kip value={customer.totalSpent} /></b></article>
              </div>
              <p className="section-label">ລົດ</p>
              <div className="card">
                {!customer.vehicles?.length && <Empty text="ຍັງບໍ່ມີລົດ" />}
                {customer.vehicles?.map((vehicle) => (
                  <div key={vehicle.id} className="line">
                    <span><b>{vehicle.plateNo}</b> · {vehicleText(vehicle) || '-'}</span>
                    <span className="muted">{SIZE_LABEL[vehicle.size]}</span>
                  </div>
                ))}
              </div>
              <p className="section-label">ນັດໝາຍຄັ້ງຕໍ່ໄປ</p>
              <div className="card">
                {customer.nextAppointment ? (
                  <div className="line">
                    <span>{formatLaoDateTime(customer.nextAppointment.scheduledAt)}{customer.nextAppointment.note ? ` · ${customer.nextAppointment.note}` : ''}</span>
                    <Link to="/appointments" className="mini">ເບິ່ງ</Link>
                  </div>
                ) : (
                  <p className="muted">ຍັງບໍ່ມີນັດໝາຍ</p>
                )}
              </div>
            </div>
            <div>
              <p className="section-label">ປະຫວັດການໃຊ້ບໍລິການ</p>
              <div className="card">
                {customer.history.length === 0 && <Empty text="ຍັງບໍ່ມີປະຫວັດ" />}
                {customer.history.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="history">
                    <div>
                      <b>{formatLaoDate(job.paidAt || job.receivedAt)} · {job.code}</b>
                      <small>{job.vehicle?.plateNo ?? 'ຂາຍໜ້າຮ້ານ'} · {job.items.map((item) => item.serviceName).join(' · ')}</small>
                    </div>
                    <div className="person-meta">
                      <b>{money(job.total)}</b>
                      <StatusChip status={job.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pad stack">
            <Link className="btn ghost wide" to={`/receive?customer=${customer.id}`}>ຮັບລົດລູກຄ້າຄົນນີ້</Link>
            <button type="button" className="btn blue wide" onClick={() => setOpen(true)}>+ ສ້າງນັດໝາຍ</button>
          </div>
          {open && <AppointmentForm customer={customer} onClose={() => setOpen(false)} />}
        </>
      )}
    </div>
  );
}
