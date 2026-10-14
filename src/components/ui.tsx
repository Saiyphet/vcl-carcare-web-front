import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { money } from '../utils/format';

export function PageHeader({ title, action, back }: { title: string; action?: ReactNode; back?: string }) {
  const navigate = useNavigate();
  return (
    <header className="page-head">
      <button
        type="button"
        className="icon-btn"
        aria-label="ກັບຄືນ"
        onClick={() => {
          if (back) navigate(back);
          else if (window.history.length > 1) navigate(-1);
          else navigate('/');
        }}
      >
        <Icon name="back" />
      </button>
      <h1>{title}</h1>
      <div className="page-action">{action ?? <span />}</div>
    </header>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 52% 38%)` }}>
      {name.trim().charAt(0) || 'V'}
    </span>
  );
}

export function Kip({ value, unit = true }: { value: number; unit?: boolean }) {
  return (
    <span className="kip">
      {money(value)}
      {unit && <small> ກີບ</small>}
    </span>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="ກຳລັງໂຫຼດ">
      {Array.from({ length: rows }, (_, index) => <i key={index} />)}
    </div>
  );
}

/** Red text under a form field (400 VALIDATION_ERROR details) */
export function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="alert field-error">{text}</p>;
}

/** Shown instead of an action when ADMIN has "ທຸກສາຂາ" selected */
export function BranchNeeded() {
  return <p className="warn">ກະລຸນາເລືອກສາຂາ</p>;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-back" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="ປິດ">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  title,
  text,
  confirmLabel = 'ຢືນຢັນ',
  busy,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      {text && <p className="confirm-text">{text}</p>}
      {children}
      <div className="pair flush">
        <button type="button" className="btn ghost" onClick={onClose}>ຍົກເລີກ</button>
        <button type="button" className="btn red" disabled={busy} onClick={onConfirm}>{busy ? '...' : confirmLabel}</button>
      </div>
    </Sheet>
  );
}
