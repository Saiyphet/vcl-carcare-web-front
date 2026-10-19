/**
 * VCL CarCare API client.
 * Based on examples/nextjs/lib/api.ts (vcl-carcare-api on the Desktop). Endpoints that copy
 * leaves out were added to match docs/openapi.json and the running API.
 *
 * .env:  VITE_API_URL=https://vcl-carcare-api.onrender.com
 * Leave empty in local .env to proxy through Vite → http://localhost:4000.
 */
function apiOrigin(raw?: string) {
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!value) return '';
  return value.replace(/\/health$/i, '');
}
/** Dev: same-origin `/api` via the Vite proxy (avoids CORS). Production: the public API origin. */
export const API_URL = apiOrigin(import.meta.env.VITE_API_URL);
const BASE = `${API_URL}/api/v1`;

// ───────── Types (match the API) ─────────
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export const ROLE_LABEL: Record<Role, string> = { SUPER_ADMIN: 'ເຈົ້າຂອງຮ້ານ', ADMIN: 'ແອັດມິນສາຂາ', USER: 'ພະນັກງານ' };
export type JobStatus = 'WAITING' | 'IN_PROGRESS' | 'READY' | 'DONE' | 'CANCELLED';
export type JobType = 'SERVICE' | 'RETAIL';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QR';
/** SMALL ເກັງ · MEDIUM SUV · LARGE ກະບະ · VAN ລົດຕູ້ */
export type VehicleSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'VAN';
export const VEHICLE_SIZE_LABEL: Record<VehicleSize, string> = { SMALL: 'ເກັງ', MEDIUM: 'SUV', LARGE: 'ກະບະ', VAN: 'ລົດຕູ້' };
export const VEHICLE_SIZES: VehicleSize[] = ['SMALL', 'MEDIUM', 'LARGE', 'VAN'];
export type ProductCategory = 'CHEMICAL' | 'EQUIPMENT';
export type AdjustmentType = 'DEDUCTION' | 'ADVANCE';

export interface Meta { page: number; limit: number; total: number; totalPages: number }
export interface ApiErrorBody { statusCode: number; code: string; message: string; details?: string[] }

export interface Branch { id: string; code: string; name: string; address?: string | null; phone?: string | null; active: boolean }
export interface User {
  id: string; username: string; name: string; nickname?: string | null; role: Role; position?: string | null;
  phone?: string | null; baseSalary?: number; active?: boolean;
  /** USER / ADMIN: their branch. SUPER_ADMIN: optional home branch (null = every branch) */
  branchId: string | null; branch?: Pick<Branch, 'id' | 'code' | 'name' | 'active'> | null;
}
export const isSuperAdmin = (u?: Pick<User, 'role'> | null) => u?.role === 'SUPER_ADMIN';
/** ADMIN or SUPER_ADMIN */
export const isAdmin = (u?: Pick<User, 'role'> | null) => u?.role === 'ADMIN' || u?.role === 'SUPER_ADMIN';
export interface Service {
  id: string; name: string; description?: string | null; basePrice: number; priceType: 'FIXED' | 'FROM'; durationMin: number;
  commissionPercent?: number; sortOrder?: number; active?: boolean;
  prices: { size: VehicleSize; price: number }[];
  /** SUPER_ADMIN: all branches. ADMIN: own branch */
  branchPrices?: { branchId: string; size: VehicleSize; price: number; branch?: Pick<Branch, 'id' | 'code' | 'name'> }[];
  materials?: { productId: string; qtyPerUse: number; product?: { id: string; name: string; unit: string } }[];
  /** Price per size for the requested branch (USER: own branch) */
  effectivePrices: Record<VehicleSize, number>;
}
export interface JobItem {
  id: string; kind?: 'SERVICE' | 'PRODUCT'; serviceId?: string | null; productId?: string | null; serviceName: string;
  qty?: number; unitPrice?: number; price: number; commissionAmount?: number;
  staffId?: string | null; staff?: { id: string; name: string } | null;
}
export interface Job {
  id: string; code: string; type?: JobType; status: JobStatus; branchId: string;
  branch: Pick<Branch, 'id' | 'code' | 'name'> & { address?: string | null; phone?: string | null };
  subtotal: number; discount: number; total: number;
  note?: string | null; receivedAt: string; startedAt?: string | null; finishedAt?: string | null; paidAt?: string | null;
  cancelReason?: string | null;
  /** null for counter sales (RETAIL) */
  vehicle: { id: string; plateNo: string; province: string; brand?: string | null; model?: string | null; color?: string | null; size: VehicleSize } | null;
  customer?: { id: string; name: string; phone: string | null; tier: 'NORMAL' | 'MEMBER' } | null;
  assignedStaff?: { id: string; name: string; nickname?: string | null } | null;
  items: JobItem[];
  photos: { id: string; url: string; type: 'BEFORE' | 'AFTER' }[];
  payment?: { method: PaymentMethod; amount: number; received: number; change: number; receiptNo: string; refNo?: string | null } | null;
}
export interface QueueSummary { date: string; branchId: string | null; unpaid: number; unpaidTotal: number; doneToday: number }
export interface ReportService { serviceId: string; name: string; count: number; amount: number }
export interface ReportProduct { productId: string; name: string; qty: number; amount: number }
export interface DailyReport {
  date: string; revenue: number; grossSales: number; discount: number; serviceRevenue: number; productRevenue: number;
  cars: number; retailSales: number; avgPerCar: number;
  byMethod: Record<PaymentMethod, number>; services: ReportService[]; products: ReportProduct[];
  cancelled: number; inQueue: number;
  /** Only when ADMIN looks at all branches */
  byBranch?: { id: string; code: string; name: string; revenue: number; cars: number; retailSales: number }[];
}
export interface MonthlyReport extends Omit<DailyReport, 'date' | 'cancelled' | 'inQueue'> {
  year: number; month: number; daily: { date: string; revenue: number; cars: number }[];
  byBranch?: DailyReport['byBranch'];
}

export interface BranchSummary {
  from: string; to: string;
  total: {
    revenue: number; grossSales: number; discount: number; serviceRevenue: number; productRevenue: number;
    cars: number; retailSales: number; avgPerCar: number; byMethod: Record<PaymentMethod, number>;
  };
  branches: {
    branch: Pick<Branch, 'id' | 'code' | 'name' | 'active'>;
    revenue: number; grossSales: number; discount: number; serviceRevenue: number; productRevenue: number;
    cars: number; retailSales: number; avgPerCar: number;
    byMethod: Record<PaymentMethod, number>;
    topServices: ReportService[];
    topProducts: ReportProduct[];
    cancelled: number;
    /** % of total revenue */
    share: number;
  }[];
}

export interface StaffReportRow {
  id: string; name: string; nickname?: string | null; position?: string | null; role: Role;
  branch?: Pick<Branch, 'id' | 'code' | 'name'> | null; items: number; sales: number; commission: number; cars: number;
}
export interface StaffReport { from: string; to: string; branchId: string | null; totalCommission: number; staff: StaffReportRow[] }
export type MyReport = StaffReportRow & { from: string; to: string };

export interface ProductStock { branchId: string; branchCode: string; branchName: string; qty: number; isLow: boolean; price: number }
export interface Product {
  id: string; name: string; category: ProductCategory; unit: string; minQty: number;
  /** ADMIN only */
  cost?: number;
  price: number; sellable: boolean; barcode: string | null; commissionPercent: number; imageUrl?: string | null; active: boolean;
  branchId?: string; qty: number; isLow: boolean; effectivePrice: number;
  /** ADMIN without branchId */
  stocks?: ProductStock[];
}
/** GET /products/:id (ADMIN): stock per branch and branch price overrides */
export interface ProductDetail extends Omit<Product, 'stocks' | 'qty' | 'isLow' | 'effectivePrice'> {
  stocks: { branchId: string; qty: number; branch?: Pick<Branch, 'id' | 'code' | 'name'> }[];
  branchPrices: { branchId: string; price: number }[];
}
export interface ProductInput {
  name: string; category: ProductCategory; unit: string; minQty?: number; cost?: number; price?: number;
  sellable?: boolean; barcode?: string | null; commissionPercent?: number; imageUrl?: string; active?: boolean;
}
export interface StockMovement {
  id: string; productId: string; branchId: string; type: string; qty: number; balance: number;
  jobId: string | null; note: string | null; createdAt: string;
  branch?: Pick<Branch, 'id' | 'code' | 'name'> | null; job?: { id: string; code: string } | null; user?: { id: string; name: string } | null;
}

export interface Customer {
  id: string; name: string; phone: string | null; tier: 'NORMAL' | 'MEMBER'; note?: string | null;
  totalVisits: number; totalSpent: number; lastVisitAt: string | null;
  vehicles?: { id: string; plateNo: string; province?: string | null; brand?: string | null; model?: string | null; color?: string | null; size: VehicleSize }[];
}
export interface CustomerDetail extends Customer { history: Job[]; nextAppointment: Appointment | null }
export interface Appointment {
  id: string; branchId: string; customerId: string; vehicleId?: string | null; serviceId?: string | null;
  scheduledAt: string; note?: string | null; status: 'BOOKED' | 'DONE' | 'CANCELLED';
  customer?: { id: string; name: string; phone: string | null } | null;
  vehicle?: { id: string; plateNo: string } | null; service?: { id: string; name: string } | null;
  branch?: Pick<Branch, 'id' | 'code' | 'name'> | null;
}

export interface PaymentInput { method: PaymentMethod; discount?: number; received?: number; refNo?: string }
export interface JobItemInput { serviceId?: string; productId?: string; qty?: number; price?: number; staffId?: string }

export interface Receipt {
  title?: string; receiptNo?: string; jobCode?: string; type?: JobType; paidAt?: string | null; receivedAt?: string;
  shop?: { name?: string; branch?: string; address?: string | null; phone?: string | null };
  customer?: { name?: string; phone?: string | null } | null;
  vehicle?: { plateNo?: string; province?: string | null; brand?: string | null; model?: string | null; color?: string | null; size?: VehicleSize } | null;
  items?: { name: string; kind?: string; qty?: number; unit?: string | null; unitPrice?: number; price: number }[];
  subtotal?: number; discount?: number; total?: number;
  method?: PaymentMethod | null; received?: number | null; change?: number | null; refNo?: string | null;
  staff?: string | null;
}

export interface PayrollUser {
  id: string; name: string; nickname?: string | null; position?: string | null; role: Role; active: boolean; baseSalary: number;
  branch: Pick<Branch, 'id' | 'code' | 'name'> | null;
}
export interface PayrollAdjustment { id: string; userId: string; type: AdjustmentType; amount: number; reason: string; date: string; month: string }
export interface PayrollRow {
  user: PayrollUser; month: string; status: 'PAID' | 'UNPAID'; baseSalary: number; totalDeductions: number; totalAdvances: number;
  netPay: number; payrollId: string | null; paidAt: string | null; method: PaymentMethod | null; adjustments: PayrollAdjustment[];
}
export interface PayrollSheet {
  month: string; branchId: string | null;
  totals: { staff: number; baseSalary: number; totalDeductions: number; totalAdvances: number; netPay: number; paid: number; remaining: number };
  rows: PayrollRow[];
}
export interface Payslip {
  user: PayrollUser; month: string; status: 'PAID' | 'UNPAID'; baseSalary: number; totalDeductions: number; totalAdvances: number;
  netPay: number; payrollId?: string | null; paidAt: string | null; method: PaymentMethod | null; note: string | null;
  deductions: PayrollAdjustment[]; advances: PayrollAdjustment[];
}

// ───────── Token storage ─────────
const TOKEN_KEY = 'vcl_token';
export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  /** e.g. "POST /jobs/123/payment" */
  request?: string;
  constructor(public status: number, public body: ApiErrorBody) {
    super(body.message);
  }
}

// ───────── Core request ─────────
async function request<T>(method: string, path: string, body?: unknown): Promise<{ data: T; meta?: Meta }> {
  const token = tokenStore.get();
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new TypeError('ເຊື່ອມຕໍ່ API ບໍ່ໄດ້');
  }
  let json: { success?: boolean; data?: T; meta?: Meta; error?: ApiErrorBody };
  try {
    json = await res.json();
  } catch {
    throw new TypeError('ເຊື່ອມຕໍ່ API ບໍ່ໄດ້');
  }
  if (!json.success) {
    // A wrong password is also 401; stay on the login page so the error can be shown
    if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/login') {
      tokenStore.clear();
      window.location.href = '/login';
    }
    const err = new ApiError(res.status, json.error);
    err.request = `${method} ${path}`;
    throw err;
  }
  return { data: json.data as T, meta: json.meta };
}
const get = <T>(p: string) => request<T>('GET', p).then((r) => r.data);
const qs = (o: Record<string, unknown>) => {
  const s = new URLSearchParams(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]),
  ).toString();
  return s ? `?${s}` : '';
};

// ───────── Endpoints ─────────
export const api = {
  auth: {
    async login(username: string, password: string) {
      const { data } = await request<{ accessToken: string; user: User }>('POST', '/auth/login', { username, password });
      tokenStore.set(data.accessToken);
      return data.user;
    },
    me: () => get<User>('/auth/me'),
    logout: () => tokenStore.clear(),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<unknown>('POST', '/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  },

  /** [{ code, label, labelEn }] in display order — for the size selector */
  vehicleSizes: () => get<{ code: VehicleSize; label: string; labelEn: string }[]>('/services/vehicle-sizes'),

  /** USER / ADMIN: own branch. SUPER_ADMIN: all branches. */
  branches: {
    list: (includeInactive?: boolean) => get<Branch[]>(`/branches${qs({ includeInactive })}`),
    create: (body: { code: string; name: string; address?: string; phone?: string }) =>
      request<Branch>('POST', '/branches', body).then((r) => r.data),
    update: (id: string, body: Partial<Branch>) => request<Branch>('PATCH', `/branches/${id}`, body).then((r) => r.data),
    remove: (id: string) => request<unknown>('DELETE', `/branches/${id}`).then((r) => r.data),
  },

  services: {
    /** branchId: SUPER_ADMIN only — which branch's prices to show in effectivePrices */
    list: (branchId?: string, includeInactive?: boolean) => get<Service[]>(`/services${qs({ branchId, includeInactive })}`),
    create: (body: Partial<Omit<Service, 'id' | 'effectivePrices' | 'branchPrices' | 'materials'>> & { name: string; basePrice: number }) =>
      request<Service>('POST', '/services', body).then((r) => r.data),
    update: (id: string, body: Partial<Omit<Service, 'id' | 'effectivePrices' | 'branchPrices' | 'materials'>>) =>
      request<Service>('PATCH', `/services/${id}`, body).then((r) => r.data),
    remove: (id: string) => request<unknown>('DELETE', `/services/${id}`).then((r) => r.data),
    setBranchPrices: (serviceId: string, branchId: string, prices: { size: VehicleSize; price: number }[]) =>
      request<Service>('PUT', `/services/${serviceId}/branch-prices`, { branchId, prices }).then((r) => r.data),
    setMaterials: (serviceId: string, materials: { productId: string; qtyPerUse: number }[]) =>
      request<Service>('PUT', `/services/${serviceId}/materials`, { materials }).then((r) => r.data),
  },

  users: {
    list: (branchId?: string, includeInactive?: boolean) => get<User[]>(`/users${qs({ branchId, includeInactive })}`),
    create: (body: { username: string; password: string; name: string; nickname?: string; phone?: string; role?: Role; branchId?: string; position?: string; baseSalary?: number }) =>
      request<User>('POST', '/users', body).then((r) => r.data),
    update: (id: string, body: Partial<{ name: string; nickname: string; phone: string; password: string; role: Role; branchId: string; active: boolean; position: string; baseSalary: number }>) =>
      request<User>('PATCH', `/users/${id}`, body).then((r) => r.data),
    /** Disable: can no longer log in, history kept */
    disable: (id: string) => request<User>('DELETE', `/users/${id}`).then((r) => r.data),
    /** Re-enable a disabled account */
    activate: (id: string) => request<User>('POST', `/users/${id}/activate`).then((r) => r.data),
    /** Permanent delete — only for users with no work history (otherwise ApiError 409 USER_HAS_HISTORY) */
    remove: (id: string) => request<{ deleted: true }>('DELETE', `/users/${id}/permanent`).then((r) => r.data),
  },

  vehicles: {
    lookup: (plateNo: string) =>
      get<Array<NonNullable<Job['vehicle']> & { customer: Customer | null }>>(`/vehicles/lookup${qs({ plateNo })}`),
  },

  jobs: {
    /** Receive car screen */
    /** USER / ADMIN: branch is automatic. SUPER_ADMIN: pass branchId. With `payment` the job is paid in the same call. */
    create: (body: {
      branchId?: string; plateNo: string; province?: string; brand?: string; model?: string; color?: string; size?: VehicleSize;
      customerName?: string; customerPhone?: string; assignedStaffId?: string; note?: string;
      items: JobItemInput[]; payment?: PaymentInput;
    }) => request<Job>('POST', '/jobs', body).then((r) => r.data),
    /** type defaults to SERVICE (car jobs). Use 'RETAIL' or 'ALL' to include counter sales */
    list: (q: { status?: JobStatus[]; date?: string; search?: string; branchId?: string; customerId?: string; type?: JobType | 'ALL'; page?: number; limit?: number } = {}) =>
      request<Job[]>('GET', `/jobs${qs({ ...q, status: q.status?.join(',') })}`),
    /** Unpaid car bills. Old WAITING / IN_PROGRESS jobs count as unpaid too. */
    unpaid: (branchId?: string) =>
      request<Job[]>('GET', `/jobs${qs({ status: 'WAITING,IN_PROGRESS,READY', type: 'SERVICE', branchId, limit: 100 })}`).then((r) => r.data),
    summary: (branchId?: string) => get<QueueSummary>(`/jobs/summary${qs({ branchId })}`),
    get: (id: string) => get<Job>(`/jobs/${id}`),
    update: (id: string, body: { items?: JobItemInput[]; assignedStaffId?: string; note?: string }) =>
      request<Job>('PATCH', `/jobs/${id}`, body).then((r) => r.data),
    setStatus: (id: string, status: 'CANCELLED', reason?: string) =>
      request<Job>('PATCH', `/jobs/${id}/status`, { status, reason }).then((r) => r.data),
    cancel: (id: string, reason: string) =>
      request<Job>('PATCH', `/jobs/${id}/status`, { status: 'CANCELLED', reason }).then((r) => r.data),
    uploadPhotos: (id: string, files: File[], type: 'BEFORE' | 'AFTER' = 'BEFORE') => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      return request<Job['photos']>('POST', `/jobs/${id}/photos?type=${type}`, fd).then((r) => r.data);
    },
    removePhoto: (id: string, photoId: string) => request<unknown>('DELETE', `/jobs/${id}/photos/${photoId}`).then((r) => r.data),
    pay: (id: string, body: PaymentInput) =>
      request<Job>('POST', `/jobs/${id}/payment`, body).then((r) => r.data),
    receipt: (id: string) => get<Receipt>(`/jobs/${id}/receipt`),
  },

  /** Counter sales (no car). With `payment` the sale is paid in one call → Job type RETAIL. */
  sales: {
    create: (body: {
      branchId?: string; items: { productId: string; qty: number; price?: number }[];
      customerName?: string; customerPhone?: string; note?: string; payment?: PaymentInput;
    }) => request<Job>('POST', '/sales', body).then((r) => r.data),
    list: (q: { date?: string; search?: string; branchId?: string; page?: number; limit?: number } = {}) =>
      request<Job[]>('GET', `/sales${qs(q)}`),
  },

  customers: {
    list: (q: { search?: string; tier?: 'NORMAL' | 'MEMBER'; page?: number; limit?: number } = {}) => request<Customer[]>('GET', `/customers${qs(q)}`),
    get: (id: string) => get<CustomerDetail>(`/customers/${id}`),
    create: (body: { name: string; phone: string; tier?: 'NORMAL' | 'MEMBER'; note?: string }) =>
      request<Customer>('POST', '/customers', body).then((r) => r.data),
    update: (id: string, body: Partial<{ name: string; phone: string; tier: 'NORMAL' | 'MEMBER'; note: string }>) =>
      request<Customer>('PATCH', `/customers/${id}`, body).then((r) => r.data),
  },

  products: {
    /** One branch → qty of that branch. ADMIN without branchId → total + `stocks[]` per branch */
    list: (q: { branchId?: string; category?: ProductCategory; lowStock?: boolean; sellable?: boolean; barcode?: string; search?: string; page?: number; limit?: number } = {}) =>
      request<Product[]>('GET', `/products${qs(q)}`),
    get: (id: string) => get<ProductDetail>(`/products/${id}`),
    /** First sellable product with this barcode, or null */
    byBarcode: (barcode: string, branchId?: string) =>
      request<Product[]>('GET', `/products${qs({ barcode, sellable: true, branchId, limit: 1 })}`).then((r) => r.data[0] ?? null),
    create: (body: ProductInput) => request<Product>('POST', '/products', body).then((r) => r.data),
    update: (id: string, body: Partial<ProductInput>) => request<Product>('PATCH', `/products/${id}`, body).then((r) => r.data),
    remove: (id: string) => request<unknown>('DELETE', `/products/${id}`).then((r) => r.data),
    /** IN = receive (any user, own branch). ADJUST = correction (ADMIN / SUPER_ADMIN) */
    adjust: (id: string, type: 'IN' | 'ADJUST', qty: number, opts: { branchId?: string; note?: string } = {}) =>
      request<unknown>('POST', `/products/${id}/stock`, { type, qty, ...opts }).then((r) => r.data),
    movements: (id: string, q: { branchId?: string; page?: number; limit?: number } = {}) =>
      request<StockMovement[]>('GET', `/products/${id}/movements${qs(q)}`),
    /** price null = remove the branch price (use the base price) */
    setBranchPrice: (id: string, branchId: string, price: number | null) =>
      request<unknown>('PUT', `/products/${id}/branch-prices`, { branchId, price }).then((r) => r.data),
    lowStockCount: (branchId?: string) => get<{ count: number }>(`/products/low-stock/count${qs({ branchId })}`),
  },

  reports: {
    /** USER / ADMIN: own branch. SUPER_ADMIN: branchId or all (+ byBranch) */
    daily: (date?: string, branchId?: string) => get<DailyReport>(`/reports/daily${qs({ date, branchId })}`),
    /** ADMIN / SUPER_ADMIN */
    monthly: (year?: number, month?: number, branchId?: string) => get<MonthlyReport>(`/reports/monthly${qs({ year, month, branchId })}`),
    /** ADMIN / SUPER_ADMIN */
    staff: (from?: string, to?: string, branchId?: string) => get<StaffReport>(`/reports/staff${qs({ from, to, branchId })}`),
    me: (from?: string, to?: string) => get<MyReport>(`/reports/me${qs({ from, to })}`),
    /** SUPER_ADMIN: all branches. ADMIN: own branch only */
    branches: (from?: string, to?: string) => get<BranchSummary>(`/reports/branches${qs({ from, to })}`),
  },

  appointments: {
    list: (q: { from?: string; to?: string; branchId?: string; status?: Appointment['status']; customerId?: string } = {}) =>
      get<Appointment[]>(`/appointments${qs(q)}`),
    create: (body: { branchId?: string; customerId: string; vehicleId?: string; serviceId?: string; scheduledAt: string; note?: string }) =>
      request<Appointment>('POST', '/appointments', body).then((r) => r.data),
    update: (id: string, body: Partial<{ customerId: string; vehicleId: string; serviceId: string; scheduledAt: string; note: string; status: Appointment['status'] }>) =>
      request<Appointment>('PATCH', `/appointments/${id}`, body).then((r) => r.data),
    remove: (id: string) => request<unknown>('DELETE', `/appointments/${id}`).then((r) => r.data),
  },

  /** month = YYYY-MM. netPay = baseSalary − deductions − advances */
  payroll: {
    /** Own payslip (any role) */
    me: (month?: string) => get<Payslip>(`/payroll/me${qs({ month })}`),
    /** ADMIN / SUPER_ADMIN */
    sheet: (month?: string, branchId?: string) => get<PayrollSheet>(`/payroll${qs({ month, branchId })}`),
    /** ADMIN / SUPER_ADMIN */
    payslip: (userId: string, month?: string) => get<Payslip>(`/payroll/users/${userId}${qs({ month })}`),
    adjustments: (q: { month?: string; userId?: string; branchId?: string; type?: AdjustmentType } = {}) =>
      get<PayrollAdjustment[]>(`/payroll/adjustments${qs(q)}`),
    /** 409 MONTH_LOCKED when the month is paid. 400 ADVANCE_TOO_LARGE when an advance exceeds the remaining salary */
    addAdjustment: (body: { userId: string; type: AdjustmentType; amount: number; reason: string; date?: string; month?: string }) =>
      request<PayrollAdjustment>('POST', '/payroll/adjustments', body).then((r) => r.data),
    removeAdjustment: (id: string) => request<unknown>('DELETE', `/payroll/adjustments/${id}`).then((r) => r.data),
    /** Locks the month. 409 ALREADY_PAID when paid twice */
    pay: (body: { userId: string; month: string; method?: PaymentMethod; note?: string }) =>
      request<unknown>('POST', '/payroll/pay', body).then((r) => r.data),
    /** Undo a payment */
    unpay: (payrollId: string) => request<unknown>('DELETE', `/payroll/${payrollId}`).then((r) => r.data),
  },
};

/** Photo URLs from the API are relative (/uploads/...) */
export const fileUrl = (path: string) => (path.startsWith('http') ? path : API_URL + path);

/** 280000 → "280,000 ກີບ" */
export const kip = (n: number) => `${n.toLocaleString('en-US')} ກີບ`;
