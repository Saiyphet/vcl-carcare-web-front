import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { branchName, bump } from '../api';
import { ROLE_LABEL } from '../lib/api';
import { useJobStream } from '../hooks/useJobStream';
import { toggleTheme, useTheme } from '../hooks/useTheme';
import { useStore, useToast } from '../hooks/useStore';
import { cls } from '../utils/format';
import { BranchSelect } from './BranchSelect';
import { Icon, type IconName } from './Icon';
import { InstallButton } from './InstallButton';
import { Logo } from './Logo';
import { menuFor } from './menu';
import { Avatar, Sheet } from './ui';

function hideTabs(pathname: string) {
  if (pathname === '/login' || pathname === '/receive') return true;
  return /^\/jobs\/[^/]+\/(pay|receipt)$/.test(pathname);
}

const TABS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/', label: 'ໜ້າຫຼັກ', icon: 'home', end: true },
  { to: '/receive', label: 'ຮັບລົດ', icon: 'car' },
  { to: '/pos', label: 'ຂາຍ', icon: 'bag' },
  { to: '/unpaid', label: 'ລໍຖ້າຊຳລະ', icon: 'card' },
];

/** Live updates for the whole app: any job event refetches counters and live screens */
function LiveJobs() {
  const { superAdmin, branchId } = useStore();
  useJobStream(() => bump(), superAdmin ? branchId ?? undefined : undefined, 'ALL');
  return null;
}

export function Frame() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, base, branchId } = useStore();
  const message = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useTheme();
  const loggedIn = Boolean(session) && pathname !== '/login';
  const unpaid = base.summary?.unpaid ?? 0;
  const items = session ? menuFor(session.role) : [];

  return (
    <div className="stage">
      {loggedIn && session && <LiveJobs />}
      {loggedIn && session && (
        <aside className="side">
          <div className="side-brand">
            <Logo size="sm" />
          </div>
          <nav className="side-nav">
            {items.filter((item) => item.to !== '/settings').map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cls('side-link', isActive && 'on')}>
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
                {item.to === '/unpaid' && unpaid > 0 && <em className="count">{unpaid}</em>}
                {item.to === '/stock' && base.lowStockCount > 0 && <em className="count">{base.lowStockCount}</em>}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/settings" className="side-user">
            <Avatar name={session.name} size={40} />
            <div>
              <b>{session.name}</b>
              <small>{ROLE_LABEL[session.role]}{session.branchName ? ` · ${session.branchName}` : ''}</small>
            </div>
          </NavLink>
        </aside>
      )}
      <div className={cls('frame', theme === 'light' && pathname !== '/login' && 'light')}>
        {loggedIn && (
          <div className="app-head no-print">
            <span className="app-title"><Logo size="xs" /></span>
            <span className="app-branch">{branchName(branchId)}</span>
            <BranchSelect />
            <InstallButton compact />
            <button
              type="button"
              className="icon-btn theme-btn"
              aria-label={theme === 'dark' ? 'ໂໝດສະຫວ່າງ' : 'ໂໝດມືດ'}
              title={theme === 'dark' ? 'ໂໝດສະຫວ່າງ' : 'ໂໝດມືດ'}
              onClick={toggleTheme}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            </button>
          </div>
        )}
        <div className="screen">
          <Outlet />
        </div>
        {loggedIn && !hideTabs(pathname) && (
          <nav className="nav">
            {TABS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cls('nav-item', isActive && 'on')}>
                <span className="nav-icon">
                  <Icon name={item.icon} size={22} />
                  {item.to === '/unpaid' && unpaid > 0 && <em className="badge">{unpaid}</em>}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button type="button" className={cls('nav-item', menuOpen && 'on')} onClick={() => setMenuOpen(true)}>
              <Icon name="menu" size={22} />
              <span>ເມນູ</span>
            </button>
          </nav>
        )}
        {menuOpen && (
          <Sheet title="ເມນູ" onClose={() => setMenuOpen(false)}>
            <div className="menu-grid">
              {items.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  className={cls(pathname === item.to && 'on')}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                >
                  <Icon name={item.icon} size={22} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </Sheet>
        )}
        {message && <div className="toast" role="status">{message}</div>}
      </div>
    </div>
  );
}
