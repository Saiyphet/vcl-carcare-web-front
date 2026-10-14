export type { JobStatus, PaymentMethod, ProductCategory, VehicleSize } from './lib/api';

export type Role = 'admin' | 'user';

export type Session = {
  userId: string;
  name: string;
  username: string;
  role: Role;
  position: string | null;
  branchId: string | null;
  branchName: string | null;
  branchCode: string | null;
};
