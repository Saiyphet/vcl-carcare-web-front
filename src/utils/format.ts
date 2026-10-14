import { VEHICLE_SIZE_LABEL, type JobStatus, type PaymentMethod } from '../lib/api';

/** Old WAITING / IN_PROGRESS jobs are treated as READY */
export const STATUS_LABEL: Record<JobStatus, string> = {
  WAITING: 'ລໍຖ້າຊຳລະ',
  IN_PROGRESS: 'ລໍຖ້າຊຳລະ',
  READY: 'ລໍຖ້າຊຳລະ',
  DONE: 'ສຳເລັດ',
  CANCELLED: 'ຍົກເລີກ',
};

export function isUnpaid(status: JobStatus) {
  return status === 'READY' || status === 'WAITING' || status === 'IN_PROGRESS';
}

export const SIZE_LABEL = VEHICLE_SIZE_LABEL;

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'ເງິນສົດ',
  TRANSFER: 'ໂອນເງິນ',
  QR: 'QR',
};

const SHOP_TZ = 'Asia/Vientiane';

/** YYYY-MM-DD in Vientiane time */
export function shopDate(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TZ }).format(new Date(value));
}

/** YYYY-MM in Vientiane time */
export function shopMonth(value: string | Date = new Date()) {
  return shopDate(value).slice(0, 7);
}

export function monthStart(value: string | Date = new Date()) {
  return `${shopMonth(value)}-01`;
}

function shopParts(value: string | Date) {
  const map: Record<string, string> = {};
  new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TZ,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(new Date(value))
    .forEach((part) => {
      map[part.type] = part.value;
    });
  return map;
}

export const COLORS = [
  { name: 'ຂາວ', hex: '#f4f4f5' },
  { name: 'ດຳ', hex: '#202024' },
  { name: 'ເງິນ', hex: '#c5c5ce' },
  { name: 'ເທົາ', hex: '#71717a' },
  { name: 'ແດງ', hex: '#dc2626' },
  { name: 'ຟ້າ', hex: '#2563eb' },
  { name: 'ນ້ຳຕານ', hex: '#92400e' },
  { name: 'ເຫຼືອງ', hex: '#eab308' },
  { name: 'ຂຽວ', hex: '#16a34a' },
] as const;

const SERVICE_COLOR: Record<string, string> = {
  ລ້າງລົດ: '#3b82f6',
  ສະປາພາຍໃນ: '#8b5cf6',
  ເຄືອບແກ້ວ: '#14b8a6',
  ຟິມແກ້ວ: '#f59e0b',
  ຂັດສີ: '#ef4444',
  ດູດຝຸ່ນ: '#64748b',
};

const SHORT_MONTHS = ['ມ.ກ.', 'ກ.ພ.', 'ມ.ນ.', 'ເມ.ສ.', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.'];
const FULL_MONTHS = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'];

export function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(' ');
}

export function money(value: number) {
  return Math.round(Number(value) || 0).toLocaleString('en-US');
}

/** 280000 → "280,000 ກີບ" */
export function kip(value: number) {
  return `${new Intl.NumberFormat('en-US').format(Math.round(Number(value) || 0))} ກີບ`;
}

export function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function toAmount(value: string) {
  const digits = digitsOnly(value);
  return digits ? Number(digits) : 0;
}

export function colorHex(name: string) {
  return COLORS.find((color) => color.name === name)?.hex ?? '#71717a';
}

export function isLightColor(hex: string) {
  return hex === '#f4f4f5' || hex === '#c5c5ce' || hex === '#eab308';
}

export function serviceColor(name: string) {
  return SERVICE_COLOR[name] ?? '#e10600';
}

export function formatLaoDate(value: string | Date) {
  const part = shopParts(value);
  const month = Number(part.month) - 1;
  return `${Number(part.day)} ${SHORT_MONTHS[month] ?? ''} ${part.year}`;
}

/** "2026-10" → "ຕຸລາ 2026" */
export function formatLaoMonth(month: string = shopMonth()) {
  const [year, index] = month.split('-').map(Number);
  return `${FULL_MONTHS[index - 1] ?? ''} ${year}`;
}

export function formatTime(value: string | Date) {
  const part = shopParts(value);
  return `${part.hour}:${part.minute}`;
}

export function formatLaoDateTime(value: string | Date) {
  return `${formatLaoDate(value)} · ${formatTime(value)}`;
}

/** A YYYY-MM-DD shop date shown as a Lao date */
export function formatDay(day: string) {
  return formatLaoDate(`${day}T12:00:00+07:00`);
}

export function formatPhone(phone?: string | null) {
  const digits = digitsOnly(phone || '');
  if (digits.length === 11) return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return phone || '-';
}

/** ISO → value for <input type="datetime-local"> in Vientiane time */
export function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  const part = shopParts(value);
  const pad = (text: string) => text.padStart(2, '0');
  return `${part.year}-${pad(part.month)}-${pad(part.day)}T${part.hour}:${part.minute}`;
}

/** <input type="datetime-local"> value (Vientiane time) → ISO UTC */
export function fromDateTimeLocal(value: string) {
  return new Date(`${value}:00+07:00`).toISOString();
}

export function vehicleText(vehicle?: { brand?: string | null; model?: string | null; color?: string | null } | null) {
  if (!vehicle) return '';
  return [[vehicle.brand, vehicle.model].filter(Boolean).join(' '), vehicle.color].filter(Boolean).join(' · ');
}
