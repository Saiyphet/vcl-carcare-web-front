import { useState } from 'react';
import type { FormEvent } from 'react';
import { changePassword, errorMessage, logout } from '../api';
import { Avatar, PageHeader, Sheet } from '../components/ui';
import { SHOP } from '../config';
import { useStore } from '../hooks/useStore';
import { API_URL, ROLE_LABEL } from '../lib/api';
import { Icon } from '../components/Icon';
import { InstallButton } from '../components/InstallButton';
import { setTheme, useTheme } from '../hooks/useTheme';
import { cls } from '../utils/format';

export function SettingsPage() {
  const { session } = useStore();
  const theme = useTheme();
  const [ask, setAsk] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  if (!session) return null;

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError('');
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (reason) {
      setPasswordError(errorMessage(reason, 'ປ່ຽນລະຫັດບໍ່ສຳເລັດ'));
    }
  }

  return (
    <div className="page settings">
      <PageHeader title="ຕັ້ງຄ່າ" />
      <div className="card profile">
        <Avatar name={session.name} size={64} />
        <div>
          <b>{session.name}</b>
          <small>{ROLE_LABEL[session.role]} · {session.username}{session.branchName ? ` · ${session.branchName}` : ''}</small>
          {session.position && <small>{session.position}</small>}
        </div>
      </div>
      <div className="card shop-card">
        <b>VCL CARCARE</b>
        <p>{SHOP.slogan}</p>
        <a href={`tel:${SHOP.phoneRaw}`}>ໂທ {SHOP.phone}</a>
        <span>ເຟສບຸກ {SHOP.facebook}</span>
      </div>
      <div className="card">
        <span className="card-label">ຮູບແບບໜ້າຈໍ</span>
        <div className="segment">
          <button type="button" className={cls(theme === 'light' && 'on')} onClick={() => setTheme('light')}>
            <Icon name="sun" size={18} /> ໂໝດສະຫວ່າງ
          </button>
          <button type="button" className={cls(theme === 'dark' && 'on')} onClick={() => setTheme('dark')}>
            <Icon name="moon" size={18} /> ໂໝດມືດ
          </button>
        </div>
      </div>
      <div className="pad stack">
        <InstallButton />
        <button type="button" className="btn ghost wide" onClick={() => setPasswordOpen(true)}>ປ່ຽນລະຫັດຜ່ານ</button>
        <button type="button" className="btn red wide" onClick={() => setAsk(true)}>ອອກຈາກລະບົບ</button>
      </div>
      <p className="footnote">ເຊື່ອມກັບ API: {API_URL}</p>
      {passwordOpen && (
        <Sheet title="ປ່ຽນລະຫັດຜ່ານ" onClose={() => setPasswordOpen(false)}>
          <form onSubmit={savePassword}>
            <label className="card-label" htmlFor="current-password">ລະຫັດປັດຈຸບັນ</label>
            <label className="field"><input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label className="card-label" htmlFor="new-password">ລະຫັດໃໝ່</label>
            <label className="field"><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            {passwordError && <p className="alert">{passwordError}</p>}
            <button className="btn red wide mt" type="submit">ບັນທຶກ</button>
          </form>
        </Sheet>
      )}
      {ask && (
        <Sheet title="ອອກຈາກລະບົບ" onClose={() => setAsk(false)}>
          <p>ຕ້ອງການອອກຈາກລະບົບບໍ?</p>
          <div className="pair flush">
            <button type="button" className="btn ghost" onClick={() => setAsk(false)}>ຍົກເລີກ</button>
            <button
              type="button"
              className="btn red"
              onClick={() => {
                logout();
                setAsk(false);
              }}
            >
              ຢືນຢັນ
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
