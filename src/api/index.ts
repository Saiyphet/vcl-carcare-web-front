/**
 * App state shared by every screen: session, selected branch, toasts, and the small
 * lists most screens need (branches, services, staff, home counters).
 * All server calls go through ../lib/api.
 */
import { api, ApiError, isSuperAdmin, tokenStore, VEHICLE_SIZE_LABEL, VEHICLE_SIZES, type Branch, type QueueSummary, type Service, type User, type VehicleSize } from '../lib/api';
import type { Session } from '../types';

const SESSION_KEY = 'vcl-carcare-session';
const BRANCH_KEY = 'vcl-carcare-branch';

export type Base = {
  /** size selector, in display order (api.vehicleSizes) */
  sizes: { code: VehicleSize; label: string }[];
  branches: Branch[];
  services: Service[];
  staff: User[];
  summary: QueueSummary | null;
  lowStockCount: number;
  loaded: boolean;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let session: Session | null = readSession();
let selectedBranchId: string | null = readStoredBranch();
let base: Base = emptyBase();
let toast: string | null = null;
let toastTimer = 0;
let version = 0;
let bumpTimer = 0;
let baseGen = 0;

function emptyBase(): Base {
  return {
    sizes: VEHICLE_SIZES.map((code) => ({ code, label: VEHICLE_SIZE_LABEL[code] })),
    branches: [],
    services: [],
    staff: [],
    summary: null,
    lowStockCount: 0,
    loaded: false,
  };
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const item = value as Session;
  return typeof item.userId === 'string' && typeof item.name === 'string' && (item.role === 'SUPER_ADMIN' || item.role === 'ADMIN' || item.role === 'USER');
}

function readSession() {
  if (typeof localStorage === 'undefined' || !tokenStore.get()) return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) || '');
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readStoredBranch() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(BRANCH_KEY);
  if (!raw || raw === 'all') return null;
  return raw;
}

function toSession(user: User): Session {
  return {
    userId: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    position: user.position ?? null,
    branchId: user.branch?.id ?? user.branchId ?? null,
    branchName: user.branch?.name ?? null,
    branchCode: user.branch?.code ?? null,
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function saveSession(next: Session | null) {
  session = next;
  if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  else {
    localStorage.removeItem(SESSION_KEY);
    tokenStore.clear();
  }
  emit();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSession = () => session;
export const getBase = () => base;
export const getToast = () => toast;
export const getVersion = () => version;

/** USER / ADMIN: always their own branch. SUPER_ADMIN: the branch in the header, or null for "ທຸກສາຂາ" */
export function getSelectedBranchId() {
  if (!isSuperAdmin(session)) return session?.branchId ?? null;
  return selectedBranchId;
}

/** `branchId` to send to the API: SUPER_ADMIN only (ADMIN / USER never send it) */
export function branchParam() {
  return isSuperAdmin(session) ? selectedBranchId ?? undefined : undefined;
}

/** SUPER_ADMIN with "ທຸກສາຂາ" selected cannot receive cars, sell or receive stock */
export function needsBranch() {
  return isSuperAdmin(session) && !selectedBranchId;
}

export function requireBranch() {
  if (needsBranch()) throw new Error('ກະລຸນາເລືອກສາຂາ');
  return branchParam();
}

export function branchName(id?: string | null) {
  if (!id) return isSuperAdmin(session) ? 'ທຸກສາຂາ' : session?.branchName ?? '';
  return base.branches.find((branch) => branch.id === id)?.name ?? session?.branchName ?? '';
}

export function notify(message: string) {
  toast = message;
  emit();
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (toast === message) {
      toast = null;
      emit();
    }
  }, 2800);
}

const CODE_LABEL: Record<string, string> = {
  INSUFFICIENT_STOCK: 'ສິນຄ້າບໍ່ພໍ',
  USER_HAS_HISTORY: 'ມີປະຫວັດການເຮັດວຽກ — ປິດບັນຊີແທນ',
  DUPLICATE: 'ຂໍ້ມູນຊ້ຳ',
  ALREADY_PAID: 'ຈ່າຍແລ້ວ',
  MONTH_LOCKED: 'ເດືອນນີ້ຈ່າຍເງິນເດືອນແລ້ວ ແກ້ໄຂບໍ່ໄດ້',
  ADVANCE_TOO_LARGE: 'ເບີກເກີນເງິນເດືອນທີ່ເຫຼືອ',
  LAST_SUPER_ADMIN: 'ຕ້ອງມີເຈົ້າຂອງຮ້ານ (SUPER_ADMIN) ຢ່າງໜ້ອຍ 1 ຄົນ',
};

export function errorCode(reason: unknown) {
  return reason instanceof ApiError ? reason.body?.code ?? '' : '';
}

/** Lao text for any error thrown by the API or by the app */
export function errorMessage(reason: unknown, fallback = 'ບໍ່ສຳເລັດ') {
  if (reason instanceof ApiError) {
    const { status } = reason;
    const code = reason.body?.code ?? '';
    const message = reason.body?.message ?? '';
    if (status === 403) return 'ທ່ານບໍ່ມີສິດເຮັດລາຍການນີ້';
    if (status === 401) return /invalid username or password/i.test(message) ? 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' : 'ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່';
    if (code === 'VALIDATION_ERROR' && reason.body.details?.length) return reason.body.details.join('\n');
    if (code === 'USER_HAS_HISTORY' || code === 'LAST_SUPER_ADMIN') return CODE_LABEL[code];
    if (CODE_LABEL[code]) return message ? `${CODE_LABEL[code]} — ${message}` : CODE_LABEL[code];
    return message || fallback;
  }
  if (reason instanceof TypeError) return 'ເຊື່ອມຕໍ່ API ບໍ່ໄດ້';
  if (reason instanceof Error) return reason.message || fallback;
  return fallback;
}

/** 400 VALIDATION_ERROR details → { field: message }. Details look like "code must be ..." */
export function fieldErrors(reason: unknown): Record<string, string> {
  if (!(reason instanceof ApiError) || reason.body?.code !== 'VALIDATION_ERROR') return {};
  const out: Record<string, string> = {};
  (reason.body.details ?? []).forEach((detail) => {
    const field = detail.split(' ')[0]?.split('.')[0] ?? '';
    if (field && !out[field]) out[field] = detail;
  });
  return out;
}

/** Log the failing request and show a toast. Returns the Lao message. */
export function report(reason: unknown, fallback?: string) {
  const message = errorMessage(reason, fallback);
  if (reason instanceof ApiError) {
    console.error('[API]', reason.request, reason.status, reason.body);
  } else {
    console.error(reason);
  }
  notify(message);
  return message;
}

/** Something changed on the server: refetch the shared lists and every live screen */
export function bump() {
  window.clearTimeout(bumpTimer);
  bumpTimer = window.setTimeout(() => {
    version += 1;
    emit();
    void refreshBase();
  }, 250);
}

export async function refreshBase() {
  if (!session || !tokenStore.get()) return;
  const gen = ++baseGen;
  const branchId = branchParam();
  const [sizes, branches, services, staff, summary, low] = await Promise.all([
    api.vehicleSizes().catch(() => base.sizes),
    api.branches.list().catch(() => base.branches),
    api.services.list(branchId).catch(() => base.services),
    api.users.list(branchId).catch(() => base.staff),
    api.jobs.summary(branchId).catch(() => base.summary),
    api.products.lowStockCount(branchId).catch(() => ({ count: base.lowStockCount })),
  ]);
  if (gen !== baseGen) return;
  base = {
    sizes: sizes.map((size) => ({ code: size.code, label: size.label })),
    branches,
    services: services.filter((service) => service.active !== false),
    staff: staff.filter((user) => user.active !== false),
    summary,
    lowStockCount: low.count,
    loaded: true,
  };
  emit();
}

export async function login(username: string, password: string) {
  const user = await api.auth.login(username.trim(), password);
  base = emptyBase();
  if (isSuperAdmin(user)) {
    if (localStorage.getItem(BRANCH_KEY) === null) selectedBranchId = null;
  } else {
    selectedBranchId = user.branch?.id ?? user.branchId ?? null;
  }
  saveSession(toSession(user));
  await refreshBase();
  return session;
}

export function logout() {
  api.auth.logout();
  base = emptyBase();
  saveSession(null);
}

export function setSelectedBranch(id: string | null) {
  selectedBranchId = id;
  localStorage.setItem(BRANCH_KEY, id ?? 'all');
  version += 1;
  emit();
  void refreshBase();
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await api.auth.changePassword(currentPassword, newPassword);
  notify('ປ່ຽນລະຫັດຜ່ານແລ້ວ');
}

if (session && tokenStore.get()) {
  void api.auth
    .me()
    .then((user) => {
      saveSession(toSession(user));
      return refreshBase();
    })
    .catch((reason: unknown) => {
      if (!(reason instanceof ApiError)) notify('ເຊື່ອມຕໍ່ API ບໍ່ໄດ້');
    });
}
