import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Avatar, Empty, PageHeader, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api } from '../lib/api';
import { formatPhone, money } from '../utils/format';

export function CustomersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const { data, loading } = useApi(() => api.customers.list({ search: search || undefined, limit: 50 }), [search]);
  const list = data?.data ?? [];

  return (
    <div className="page">
      <PageHeader title="ລູກຄ້າ" />
      <div className="pad">
        <label className="field">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາຊື່, ເບີໂທ ຫຼື ທະບຽນ" />
        </label>
      </div>
      <div className="card">
        {loading && !data && <Skeleton rows={5} />}
        {!loading && list.length === 0 && <Empty text="ບໍ່ພົບລູກຄ້າ" />}
        {list.map((customer) => (
          <Link key={customer.id} to={`/customers/${customer.id}`} className="person">
            <Avatar name={customer.name} size={44} />
            <div>
              <b>{customer.name}{customer.tier === 'MEMBER' ? ' · ສະມາຊິກ' : ''}</b>
              <small>{formatPhone(customer.phone)}{customer.vehicles?.length ? ` · ${customer.vehicles.map((vehicle) => vehicle.plateNo).join(', ')}` : ''}</small>
            </div>
            <div className="person-meta">
              <b>{money(customer.totalSpent)}</b>
              <small>{customer.totalVisits} ຄັ້ງ</small>
            </div>
          </Link>
        ))}
        {data?.meta && data.meta.total > list.length && <p className="footnote">ສະແດງ {list.length} ຈາກ {data.meta.total} · ພິມເພື່ອຄົ້ນຫາ</p>}
      </div>
    </div>
  );
}
