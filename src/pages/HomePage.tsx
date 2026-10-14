import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { branchName, branchParam } from '../api';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { Avatar, Empty, Kip, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api } from '../lib/api';
import { cls } from '../utils/format';

function LowStock({ onPick }: { onPick: () => void }) {
  const { branchId } = useStore();
  const { data, loading } = useApi(() => api.products.list({ lowStock: true, branchId: branchParam(), limit: 100 }).then((result) => result.data), [branchId]);
  if (loading && !data) return <Skeleton />;
  if (!data?.length) return <Empty text="ຍັງບໍ່ມີແຈ້ງເຕືອນ" />;
  return (
    <>
      {data.map((item) => (
        <button key={item.id} type="button" className="sheet-link" onClick={onPick}>
          <b>{item.name}</b>
          <span>ໃກ້ໝົດ · ເຫຼືອ {item.qty} {item.unit}</span>
        </button>
      ))}
    </>
  );
}

export function HomePage() {
  const { base, session, admin, branchId } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!session) return null;

  const summary = base.summary;
  const low = base.lowStockCount;
  const tiles: Array<{ label: string; icon: IconName; to: string; primary?: boolean; count?: number }> = [
    { label: 'ຮັບລົດ', icon: 'car', to: '/receive', primary: true },
    { label: 'ຂາຍໜ້າຮ້ານ', icon: 'bag', to: '/pos' },
    { label: 'ລໍຖ້າຊຳລະ', icon: 'card', to: '/unpaid', count: summary?.unpaid },
    { label: 'ສະຕັອກ', icon: 'box', to: '/stock', count: low },
    { label: 'ລູກຄ້າ', icon: 'users', to: '/customers' },
    { label: 'ຍອດມື້ນີ້', icon: 'chart', to: '/sales/today' },
    ...(admin
      ? ([
          { label: 'ລາຍງານລາຍເດືອນ', icon: 'chart', to: '/reports/monthly' },
          { label: 'ສະຫຼຸບແຕ່ລະສາຂາ', icon: 'store', to: '/reports/branches' },
          { label: 'ເງິນເດືອນ', icon: 'wallet', to: '/admin/payroll' },
          { label: 'ຈັດການຜູ້ໃຊ້', icon: 'users', to: '/admin/users' },
          { label: 'ບໍລິການ ແລະ ລາຄາ', icon: 'tag', to: '/admin/services' },
          { label: 'ຈັດການສາຂາ', icon: 'store', to: '/admin/branches' },
        ] as const)
      : ([{ label: 'ສະລິບເງິນເດືອນ', icon: 'wallet', to: '/me/payslip' }] as const)),
  ];

  return (
    <div className="home">
      <header className="home-head">
        <Logo size="sm" />
        <button type="button" className="icon-btn" aria-label="ແຈ້ງເຕືອນສະຕັອກ" onClick={() => setOpen(true)}>
          <Icon name="bell" />
          {low > 0 && <em className="badge">{low}</em>}
        </button>
      </header>
      <section className="hello">
        <Avatar name={session.name} />
        <div>
          <span className="muted">ສະບາຍດີ</span>
          <strong>{session.name}</strong>
          <small>{admin ? 'ເຈົ້າຂອງຮ້ານ' : 'ພະນັກງານ'} · {branchName(branchId)}</small>
        </div>
      </section>
      <section className="home-stats">
        <button type="button" onClick={() => navigate('/unpaid')}>
          <span>ລໍຖ້າຊຳລະ</span>
          <b>{summary ? `${summary.unpaid} ບິນ` : '…'}</b>
          <small><Kip value={summary?.unpaidTotal ?? 0} /></small>
        </button>
        <button type="button" onClick={() => navigate('/sales/today')}>
          <span>ຊຳລະແລ້ວມື້ນີ້</span>
          <b>{summary ? `${summary.doneToday} ບິນ` : '…'}</b>
          <small>{low > 0 ? `ສິນຄ້າໃກ້ໝົດ ${low}` : 'ສະຕັອກປົກກະຕິ'}</small>
        </button>
      </section>
      <div className="menu">
        {tiles.map((item) => (
          <button key={item.to} type="button" onClick={() => navigate(item.to)}>
            <span className={cls('menu-icon', item.primary && 'primary')}>
              <Icon name={item.icon} size={28} />
              {!!item.count && <em className="badge">{item.count}</em>}
            </span>
            {item.label}
          </button>
        ))}
      </div>
      {open && (
        <Sheet title="ສິນຄ້າໃກ້ໝົດ" onClose={() => setOpen(false)}>
          <LowStock
            onPick={() => {
              setOpen(false);
              navigate('/stock');
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
