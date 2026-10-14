import { useState } from 'react';
import type { FormEvent } from 'react';
import { bump, fieldErrors, notify, refreshBase, report } from '../api';
import { Icon } from '../components/Icon';
import { Confirm, Empty, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi } from '../hooks/useStore';
import { api, type Branch } from '../lib/api';
import { cls, formatPhone } from '../utils/format';

type Draft = { id?: string; code: string; name: string; address: string; phone: string; active: boolean };

const CODE_RULE = /^[A-Z0-9]{2,8}$/;

function BranchForm({ draft: start, onClose }: { draft: Draft; onClose: () => void }) {
  const [draft, setDraft] = useState(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial }));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!CODE_RULE.test(draft.code)) {
      setFields({ code: 'ລະຫັດສາຂາ 2–8 ຕົວ (A–Z, 0–9)' });
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    const body = { code: draft.code, name: draft.name.trim(), address: draft.address.trim() || undefined, phone: draft.phone.trim() || undefined };
    try {
      if (draft.id) await api.branches.update(draft.id, { ...body, active: draft.active });
      else await api.branches.create(body);
      bump();
      void refreshBase();
      notify('ບັນທຶກສາຂາແລ້ວ');
      onClose();
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={draft.id ? 'ແກ້ໄຂສາຂາ' : 'ເພີ່ມສາຂາ'} onClose={onClose}>
      <form onSubmit={(event) => void save(event)}>
        <label className="card-label" htmlFor="b-code">ລະຫັດສາຂາ</label>
        <label className="field">
          <input id="b-code" value={draft.code} maxLength={8} placeholder="VT03" onChange={(event) => patch({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
        </label>
        <FieldError text={fields.code} />
        <label className="card-label" htmlFor="b-name">ຊື່ສາຂາ</label>
        <label className="field"><input id="b-name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></label>
        <FieldError text={fields.name} />
        <label className="card-label" htmlFor="b-address">ທີ່ຢູ່</label>
        <label className="field"><input id="b-address" value={draft.address} onChange={(event) => patch({ address: event.target.value })} /></label>
        <FieldError text={fields.address} />
        <label className="card-label" htmlFor="b-phone">ເບີໂທ</label>
        <label className="field"><input id="b-phone" inputMode="tel" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} /></label>
        <FieldError text={fields.phone} />
        {draft.id && (
          <label className="check-row">
            <input type="checkbox" checked={draft.active} onChange={(event) => patch({ active: event.target.checked })} />
            ເປີດໃຊ້ງານ
          </label>
        )}
        {error && !Object.keys(fields).length && <p className="alert">{error}</p>}
        <button className="btn red wide mt" type="submit" disabled={busy}>{busy ? '...' : 'ບັນທຶກ'}</button>
      </form>
    </Sheet>
  );
}

export function BranchesPage() {
  const { data, loading } = useApi(() => api.branches.list(true), [], { live: true });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [remove, setRemove] = useState<Branch | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api.branches.remove(remove.id);
      bump();
      notify('ລຶບສາຂາແລ້ວ');
      setRemove(null);
    } catch (reason) {
      report(reason, 'ລຶບບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ຈັດການສາຂາ" />
      <div className="card">
        {loading && !data && <Skeleton rows={3} />}
        {!loading && !data?.length && <Empty text="ຍັງບໍ່ມີສາຂາ" />}
        {data?.map((branch) => (
          <div key={branch.id} className={cls('stock-row', branch.active === false && 'is-off')}>
            <span className="stock-icon"><Icon name="store" size={20} /></span>
            <div>
              <b>{branch.code} · {branch.name}{branch.active === false ? ' · ປິດ' : ''}</b>
              <small>{branch.address || '-'}</small>
              <small>{branch.phone ? formatPhone(branch.phone) : '-'}</small>
            </div>
            <div className="user-actions">
              <button
                type="button"
                className="mini"
                onClick={() => setDraft({ id: branch.id, code: branch.code, name: branch.name, address: branch.address ?? '', phone: branch.phone ?? '', active: branch.active !== false })}
              >
                ແກ້ໄຂ
              </button>
              <button type="button" className="mini danger" onClick={() => setRemove(branch)}>ລຶບ</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pad">
        <button type="button" className="btn red wide" onClick={() => setDraft({ code: '', name: '', address: '', phone: '', active: true })}>+ ເພີ່ມສາຂາ</button>
      </div>
      {draft && <BranchForm draft={draft} onClose={() => setDraft(null)} />}
      {remove && (
        <Confirm
          title="ລຶບສາຂາ"
          text={`${remove.code} · ${remove.name}`}
          confirmLabel="ລຶບ"
          busy={busy}
          onConfirm={() => void confirmRemove()}
          onClose={() => setRemove(null)}
        />
      )}
    </div>
  );
}
