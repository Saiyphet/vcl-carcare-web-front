export type { JobStatus, PaymentMethod, ProductCategory, Role, VehicleSize } from './lib/api';
import type { Role } from './lib/api';

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
