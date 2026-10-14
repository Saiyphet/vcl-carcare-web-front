import { useState } from 'react';
import type { FormEvent } from 'react';
import { branchParam, bump, errorCode, fieldErrors, notify, report } from '../api';
import { Avatar, Confirm, Empty, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Role, type User } from '../lib/api';
import { cls, money, toAmount } from '../utils/format';

type Draft = {
  id?: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
  branchId: string;
  position: string;
  baseSalary: string;
};

const EMPTY: Draft = { username: '', password: '', name: '', phone: '', role: 'USER', branchId: '', position: '', baseSalary: '' };

function UserForm({ draft: start, onClose }: { draft: Draft; onClose: () => void }) {
  const { base } = useStore();
  const [draft, setDraft] = useState(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (draft.role === 'USER' && !draft.branchId) {
      setFields({ branchId: 'ພະນັກງານຕ້ອງເລືອກສາຂາ' });
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    const common = {
      name: draft.name.trim(),
      phone: draft.phone.trim() || undefined,
      role: draft.role,
      branchId: draft.branchId || undefined,
      position: draft.position.trim() || undefined,
      baseSalary: toAmount(draft.baseSalary),
    };
    try {
      if (draft.id) {
        await api.users.update(draft.id, { ...common, password: draft.password.trim() || undefined });
        notify('ບັນທຶກຜູ້ໃຊ້ແລ້ວ');
      } else {
        await api.users.create({ ...common, username: draft.username.trim(), password: draft.password });
        notify('ເພີ່ມຜູ້ໃຊ້ແລ້ວ');
      }
      bump();
      onClose();
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={draft.id ? 'ແກ້ໄຂຜູ້ໃຊ້' : 'ເພີ່ມຜູ້ໃຊ້'} onClose={onClose}>
      <form onSubmit={(event) => void save(event)}>
        {!draft.id && (
          <>
            <label className="card-label" htmlFor="u-username">ຊື່ຜູ້ໃຊ້ (username)</label>
            <label className="field"><input id="u-username" autoComplete="off" value={draft.username} onChange={(event) => patch({ username: event.target.value })} /></label>
            <FieldError text={fields.username} />
          </>
        )}
        <label className="card-label" htmlFor="u-password">{draft.id ? 'ລະຫັດໃໝ່ (ບໍ່ບັງຄັບ)' : 'ລະຫັດຜ່ານ'}</label>
        <label className="field"><input id="u-password" type="password" autoComplete="new-password" value={draft.password} onChange={(event) => patch({ password: event.target.value })} /></label>
        <FieldError text={fields.password} />
        <label className="card-label" htmlFor="u-name">ຊື່</label>
        <label className="field"><input id="u-name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></label>
        <FieldError text={fields.name} />
        <label className="card-label" htmlFor="u-phone">ເບີໂທ</label>
        <label className="field"><input id="u-phone" inputMode="tel" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} /></label>
        <FieldError text={fields.phone} />
        <span className="card-label">ບົດບາດ</span>
        <div className="segment">
          <button type="button" className={cls(draft.role === 'USER' && 'on')} onClick={() => patch({ role: 'USER' })}>ພະນັກງານ</button>
          <button type="button" className={cls(draft.role === 'ADMIN' && 'on')} onClick={() => patch({ role: 'ADMIN' })}>ເຈົ້າຂອງຮ້ານ</button>
        </div>
        <label className="card-label" htmlFor="u-branch">ສາຂາ</label>
        <label className="field">
          <select id="u-branch" value={draft.branchId} onChange={(event) => patch({ branchId: event.target.value })}>
            <option value="">{draft.role === 'ADMIN' ? 'ບໍ່ຜູກສາຂາ' : 'ເລືອກສາຂາ'}</option>
            {base.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}
          </select>
        </label>
        <FieldError text={fields.branchId} />
        <label className="card-label" htmlFor="u-position">ຕຳແໜ່ງ</label>
        <label className="field"><input id="u-position" value={draft.position} onChange={(event) => patch({ position: event.target.value })} placeholder="ພະນັກງານລ້າງລົດ" /></label>
        <label className="card-label" htmlFor="u-salary">ເງິນເດືອນ (baseSalary)</label>
        <label className="field">
          <input id="u-salary" inputMode="numeric" value={draft.baseSalary ? money(toAmount(draft.baseSalary)) : ''} onChange={(event) => patch({ baseSalary: event.target.value.replace(/[^\d]/g, '') })} placeholder="2,500,000" />
          <span>ກີບ</span>
        </label>
        <FieldError text={fields.baseSalary} />
        {error && !Object.keys(fields).length && <p className="alert">{error}</p>}
        <button className="btn red wide mt" type="submit" disabled={busy}>{busy ? '...' : 'ບັນທຶກ'}</button>
      </form>
    </Sheet>
  );
}

export function UsersPage() {
  const { session, branchId } = useStore();
  const [includeInactive, setIncludeInactive] = useState(false);
  const { data, loading } = useApi(() => api.users.list(branchParam(), includeInactive), [branchId, includeInactive], { live: true });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [remove, setRemove] = useState<User | null>(null);
  const [history, setHistory] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  function openEdit(user: User) {
    setDraft({
      id: user.id,
      username: user.username,
      password: '',
      name: user.name,
      phone: user.phone ?? '',
      role: user.role,
      branchId: user.branch?.id ?? user.branchId ?? '',
      position: user.position ?? '',
      baseSalary: user.baseSalary ? String(user.baseSalary) : '',
    });
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      bump();
      notify(message);
      return true;
    } catch (reason) {
      report(reason);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api.users.remove(remove.id);
      bump();
      notify('ລຶບຜູ້ໃຊ້ແລ້ວ');
      setRemove(null);
    } catch (reason) {
      if (errorCode(reason) === 'USER_HAS_HISTORY') {
        setHistory(remove);
        setRemove(null);
      } else report(reason, 'ລຶບບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ຈັດການຜູ້ໃຊ້" />
      <div className="tabs">
        <button type="button" className={cls(!includeInactive && 'on')} onClick={() => setIncludeInactive(false)}>ໃຊ້ງານ</button>
        <button type="button" className={cls(includeInactive && 'on')} onClick={() => setIncludeInactive(true)}>ລວມບັນຊີທີ່ປິດ</button>
      </div>
      <div className="card">
        {loading && !data && <Skeleton rows={4} />}
        {!loading && rows.length === 0 && <Empty text="ຍັງບໍ່ມີຜູ້ໃຊ້" />}
        {rows.map((user) => (
          <div key={user.id} className={cls('person', user.active === false && 'is-off')}>
            <Avatar name={user.name} size={44} />
            <div>
              <b>{user.name}</b>
              <small>
                {user.username} · {user.role === 'ADMIN' ? 'ເຈົ້າຂອງຮ້ານ' : 'ພະນັກງານ'}
                {user.branch ? ` · ${user.branch.code}` : ''}
                {user.position ? ` · ${user.position}` : ''}
                {user.active === false ? ' · ປິດແລ້ວ' : ''}
              </small>
              {user.baseSalary != null && <small>ເງິນເດືອນ {money(user.baseSalary)} ກີບ</small>}
            </div>
            {user.id !== session?.userId && (
              <div className="user-actions">
                <button type="button" className="mini" onClick={() => openEdit(user)}>ແກ້ໄຂ</button>
                {user.active === false ? (
                  <button type="button" className="mini" disabled={busy} onClick={() => void run(() => api.users.activate(user.id), 'ເປີດບັນຊີແລ້ວ')}>ເປີດ</button>
                ) : (
                  <button type="button" className="mini" disabled={busy} onClick={() => void run(() => api.users.disable(user.id), 'ປິດບັນຊີແລ້ວ')}>ປິດ</button>
                )}
                <button type="button" className="mini danger" onClick={() => setRemove(user)}>ລຶບ</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="pad">
        <button type="button" className="btn red wide" onClick={() => setDraft({ ...EMPTY, branchId: branchId ?? '' })}>+ ເພີ່ມຜູ້ໃຊ້</button>
      </div>
      {draft && <UserForm draft={draft} onClose={() => setDraft(null)} />}
      {remove && (
        <Confirm
          title="ລຶບຜູ້ໃຊ້ຖາວອນ"
          text={`${remove.name} (${remove.username}) — ລຶບໄດ້ສະເພາະບັນຊີທີ່ຍັງບໍ່ມີປະຫວັດການເຮັດວຽກ`}
          confirmLabel="ລຶບຖາວອນ"
          busy={busy}
          onConfirm={() => void confirmRemove()}
          onClose={() => setRemove(null)}
        />
      )}
      {history && (
        <Confirm
          title="ລຶບບໍ່ໄດ້"
          text="ມີປະຫວັດການເຮັດວຽກ — ປິດບັນຊີແທນ"
          confirmLabel="ປິດບັນຊີ"
          busy={busy}
          onConfirm={() => {
            const user = history;
            void run(() => api.users.disable(user.id), 'ປິດບັນຊີແລ້ວ').then((ok) => ok && setHistory(null));
          }}
          onClose={() => setHistory(null)}
        />
      )}
    </div>
  );
}
