import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { errorMessage, login } from '../api';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { InstallButton } from '../components/InstallButton';
import { SHOP } from '../config';
import { useStore } from '../hooks/useStore';

const API_ACCOUNTS = [
  { username: 'admin', password: 'admin1234', label: 'ເຈົ້າຂອງຮ້ານ' },
  { username: 'admin01', password: 'admin1234', label: 'ແອັດມິນສາຂາ VT01' },
  { username: 'user01', password: 'user1234', label: 'ພະນັກງານ VT01' },
];

export function LoginPage() {
  const { session } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function submit(nextUser = username, nextPass = password) {
    setError('');
    setBusy(true);
    try {
      await login(nextUser, nextPass);
    } catch (reason) {
      setError(errorMessage(reason, 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <div className="login">
      <section className="login-brand">
        <Logo />
        <p className="brand-sub">ສູນລ້າງ ແລະ ດູແລລົດ</p>
        <ul className="brand-points">
          <li>ຮັບລົດ</li>
          <li>ຊຳລະເງິນ</li>
          <li>ຂາຍໜ້າຮ້ານ</li>
          <li>ສະຕັອກ</li>
          <li>ລາຍງານ ແລະ ເງິນເດືອນ</li>
        </ul>
        <p className="brand-slogan">{SHOP.slogan}</p>
      </section>
      <section className="login-panel">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>ເຂົ້າສູ່ລະບົບ</h1>
        <label className="field">
          <Icon name="user" size={18} />
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ຊື່ຜູ້ໃຊ້" autoComplete="username" autoFocus />
        </label>
        <label className="field">
          <Icon name="lock" size={18} />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ລະຫັດຜ່ານ"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
          />
          <button type="button" className="icon-btn" aria-label={show ? 'ເຊື່ອງລະຫັດ' : 'ເບິ່ງລະຫັດ'} onClick={() => setShow((value) => !value)}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </label>
        {error && <p className="alert" role="alert">{error}</p>}
        <button className="btn red wide" type="submit" disabled={busy}>
          {busy ? 'ກຳລັງເຂົ້າ...' : 'ເຂົ້າສູ່ລະບົບ'}
        </button>
        <button type="button" className="forgot" onClick={() => setForgot((value) => !value)}>
          ລືມລະຫັດຜ່ານ?
        </button>
        {forgot && (
          <p className="hint">
            ກະລຸນາຕິດຕໍ່ເຈົ້າຂອງຮ້ານ ເພື່ອຕັ້ງລະຫັດໃໝ່
            <br />
            ໂທ {SHOP.phone}
          </p>
        )}
        {/* <div className="demo">
          <span>ບັນຊີທົດລອງຂອງ API</span>
          {API_ACCOUNTS.map((user) => (
            <button key={user.username} type="button" className="btn ghost" onClick={() => void submit(user.username, user.password)}>
              {user.label} · {user.username}
            </button>
          ))}
        </div> */}
      </form>
      <div className="login-install">
        <InstallButton />
      </div>
      <footer className="login-foot">
        <b>VCL CARCARE</b>
        <div>ລະບົບຈັດການຮ້ານລ້າງລົດ</div>
      </footer>
      </section>
    </div>
  );
}
