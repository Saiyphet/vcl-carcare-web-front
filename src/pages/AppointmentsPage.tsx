import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { branchParam, bump, fieldErrors, needsBranch, notify, report, requireBranch } from '../api';
import { Icon } from '../components/Icon';
import { BranchNeeded, Confirm, Empty, FieldError, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useApi, useStore } from '../hooks/useStore';
import { api, type Appointment, type Customer } from '../lib/api';
import { digitsOnly, formatLaoDateTime, formatPhone, fromDateTimeLocal, shopDate, toDateTimeLocal } from '../utils/format';

type FormProps = {
  appointment?: Appointment;
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'vehicles'>;
  onClose: () => void;
};

function NewCustomer({ initial, onCreated, onCancel }: { initial: string; onCreated: (customer: Customer) => void; onCancel: () => void }) {
  const looksLikePhone = /^[\d\s+-]+$/.test(initial);
  const [name, setName] = useState(looksLikePhone ? '' : initial);
  const [phone, setPhone] = useState(looksLikePhone ? initial : '');
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function create() {
    if (!name.trim() || digitsOnly(phone).length < 8) {
      setFields({ name: name.trim() ? '' : 'ກະລຸນາກອກຊື່', phone: digitsOnly(phone).length < 8 ? 'ເບີໂທບໍ່ຄົບ' : '' });
      return;
    }
    setBusy(true);
    setFields({});
    try {
      const customer = await api.customers.create({ name: name.trim(), phone: digitsOnly(phone) });
      notify(`ເພີ່ມລູກຄ້າ ${customer.name} ແລ້ວ`);
      onCreated(customer);
    } catch (reason) {
      setFields(fieldErrors(reason));
      report(reason, 'ເພີ່ມລູກຄ້າບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="new-customer">
      <label className="field"><Icon name="user" size={18} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="ຊື່ລູກຄ້າ" /></label>
      <FieldError text={fields.name} />
      <label className="field mt-s"><Icon name="phone" size={18} /><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="ເບີໂທ" /></label>
      <FieldError text={fields.phone} />
      <div className="row-actions mt-s">
        <button type="button" className="mini" onClick={onCancel}>ຍົກເລີກ</button>
        <button type="button" className="status-btn ready" disabled={busy} onClick={() => void create()}>{busy ? '...' : 'ບັນທຶກລູກຄ້າໃໝ່'}</button>
      </div>
    </div>
  );
}

function CustomerSearch({ onPick }: { onPick: (customer: Customer) => void }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Customer[]>([]);
  const [searched, setSearched] = useState('');
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setHits([]);
      setSearched('');
      return;
    }
    const timer = window.setTimeout(() => {
      void api.customers
        .list({ search: text, limit: 8 })
        .then((result) => setHits(result.data))
        .catch(() => setHits([]))
        .finally(() => setSearched(text));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (creating) return <NewCustomer initial={query.trim()} onCreated={onPick} onCancel={() => setCreating(false)} />;

  return (
    <>
      <label className="field">
        <Icon name="search" size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ພິມຊື່, ເບີໂທ ຫຼື ທະບຽນ ແລ້ວເລືອກ" autoFocus />
      </label>
      {hits.length > 0 && (
        <div className="suggest mt">
          {hits.map((hit) => (
            <button key={hit.id} type="button" onClick={() => onPick(hit)}>
              <b>{hit.name}</b>
              <span>{formatPhone(hit.phone)}{hit.vehicles?.length ? ` · ${hit.vehicles.map((vehicle) => vehicle.plateNo).join(', ')}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      {searched && searched === query.trim() && hits.length === 0 && <p className="muted mt-s">ບໍ່ພົບລູກຄ້າ "{searched}"</p>}
      <button type="button" className="text-btn" onClick={() => setCreating(true)}>
        <Icon name="plus" size={18} /> ເພີ່ມລູກຄ້າໃໝ່
      </button>
    </>
  );
}

/** Create (with `customer` or a customer search) or edit an appointment */
export function AppointmentForm({ appointment, customer: preset, onClose }: FormProps) {
  const { base } = useStore();
  const [customer, setCustomer] = useState<FormProps['customer'] | null>(preset ?? null);
  const [vehicleId, setVehicleId] = useState(appointment?.vehicleId ?? preset?.vehicles?.[0]?.id ?? '');
  const [serviceId, setServiceId] = useState(appointment?.serviceId ?? '');
  const [when, setWhen] = useState(toDateTimeLocal(appointment?.scheduledAt) || `${shopDate()}T10:00`);
  const [note, setNote] = useState(appointment?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const blocked = !appointment && needsBranch();

  async function save() {
    if (!appointment && !customer) {
      setError('ກະລຸນາເລືອກລູກຄ້າ');
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      if (appointment) {
        await api.appointments.update(appointment.id, {
          scheduledAt: fromDateTimeLocal(when),
          note: note.trim(),
          serviceId: serviceId || undefined,
          vehicleId: vehicleId || undefined,
        });
      } else {
        await api.appointments.create({
          branchId: requireBranch(),
          customerId: customer!.id,
          vehicleId: vehicleId || undefined,
          serviceId: serviceId || undefined,
          scheduledAt: fromDateTimeLocal(when),
          note: note.trim() || undefined,
        });
      }
      bump();
      notify('ບັນທຶກນັດໝາຍແລ້ວ');
      onClose();
    } catch (reason) {
      setFields(fieldErrors(reason));
      setError(report(reason, 'ບັນທຶກບໍ່ສຳເລັດ'));
    } finally {
      setBusy(false);
    }
  }

  const vehicles = customer?.vehicles ?? (appointment?.vehicle ? [{ id: appointment.vehicle.id, plateNo: appointment.vehicle.plateNo }] : []);

  return (
    <Sheet title={appointment ? 'ແກ້ໄຂນັດໝາຍ' : 'ນັດໝາຍໃໝ່'} onClose={onClose}>
      {blocked && <BranchNeeded />}
      <span className="card-label">ລູກຄ້າ</span>
      {customer || appointment ? (
        <div className="picked">
          <b>{customer?.name ?? appointment?.customer?.name}</b>
          <span className="muted">{formatPhone(customer?.phone ?? appointment?.customer?.phone)}</span>
          {!preset && !appointment && <button type="button" className="mini" onClick={() => setCustomer(null)}>ປ່ຽນ</button>}
        </div>
      ) : (
        <CustomerSearch onPick={(hit) => { setCustomer(hit); setVehicleId(hit.vehicles?.[0]?.id ?? ''); }} />
      )}
      <FieldError text={fields.customerId} />
      {vehicles.length > 0 && (
        <>
          <label className="card-label" htmlFor="ap-vehicle">ລົດ</label>
          <label className="field">
            <select id="ap-vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              <option value="">ບໍ່ລະບຸ</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNo}</option>)}
            </select>
          </label>
        </>
      )}
      <label className="card-label" htmlFor="ap-service">ບໍລິການ</label>
      <label className="field">
        <select id="ap-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
          <option value="">ບໍ່ລະບຸ</option>
          {base.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
      </label>
      <label className="card-label" htmlFor="ap-when">ວັນ ແລະ ເວລາ</label>
      <label className="field">
        <input id="ap-when" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
      </label>
      <FieldError text={fields.scheduledAt} />
      <label className="card-label" htmlFor="ap-note">ໝາຍເຫດ</label>
      <label className="field"><input id="ap-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="ບໍ່ບັງຄັບ" /></label>
      {error && <p className="alert">{error}</p>}
      <button type="button" className="btn blue wide mt" disabled={busy || blocked || !when} onClick={() => void save()}>{busy ? '...' : 'ບັນທຶກນັດໝາຍ'}</button>
    </Sheet>
  );
}

export function AppointmentsPage() {
  const { branchId } = useStore();
  const [from] = useState(() => new Date(`${shopDate()}T00:00:00+07:00`).toISOString());
  const { data, loading } = useApi(() => api.appointments.list({ from, branchId: branchParam(), status: 'BOOKED' }), [branchId], { live: true });
  const [form, setForm] = useState<{ appointment?: Appointment } | null>(null);
  const [cancel, setCancel] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = [...(data ?? [])].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  async function setStatus(item: Appointment, status: Appointment['status']) {
    setBusy(true);
    try {
      await api.appointments.update(item.id, { status });
      bump();
      notify(status === 'CANCELLED' ? 'ຍົກເລີກນັດໝາຍແລ້ວ' : 'ບັນທຶກແລ້ວ');
      setCancel(null);
    } catch (reason) {
      report(reason, 'ບັນທຶກບໍ່ສຳເລັດ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="ນັດໝາຍ" />
      <div className="card">
        {loading && !data && <Skeleton rows={4} />}
        {!loading && rows.length === 0 && <Empty text="ບໍ່ມີນັດໝາຍທີ່ຈະມາເຖິງ" />}
        {rows.map((item) => (
          <div key={item.id} className="history">
            <div>
              <b>{formatLaoDateTime(item.scheduledAt)}</b>
              <small>
                {item.customer ? <Link to={`/customers/${item.customer.id}`}>{item.customer.name}</Link> : '-'}
                {item.customer?.phone ? ` · ${formatPhone(item.customer.phone)}` : ''}
                {item.vehicle ? ` · ${item.vehicle.plateNo}` : ''}
              </small>
              <small>{[item.service?.name, item.branch?.code, item.note].filter(Boolean).join(' · ') || '-'}</small>
            </div>
            <div className="user-actions">
              <button type="button" className="mini" onClick={() => setForm({ appointment: item })}>ແກ້ໄຂ</button>
              <button type="button" className="mini" disabled={busy} onClick={() => void setStatus(item, 'DONE')}>ມາແລ້ວ</button>
              <button type="button" className="mini danger" onClick={() => setCancel(item)}>ຍົກເລີກ</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pad">
        <button type="button" className="btn blue wide" onClick={() => setForm({})}>+ ນັດໝາຍໃໝ່</button>
      </div>
      {form && <AppointmentForm appointment={form.appointment} onClose={() => setForm(null)} />}
      {cancel && (
        <Confirm
          title="ຍົກເລີກນັດໝາຍ"
          text={`${cancel.customer?.name ?? ''} · ${formatLaoDateTime(cancel.scheduledAt)}`}
          confirmLabel="ຍົກເລີກນັດ"
          busy={busy}
          onConfirm={() => void setStatus(cancel, 'CANCELLED')}
          onClose={() => setCancel(null)}
        />
      )}
    </div>
  );
}
