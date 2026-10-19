import type { IconName } from './Icon';
import type { Role } from '../lib/api';

export type MenuItem = { to: string; label: string; icon: IconName; minRole?: 'ADMIN' | 'SUPER_ADMIN'; end?: boolean };

export const MENU: MenuItem[] = [
  { to: '/', label: 'ໜ້າຫຼັກ', icon: 'home', end: true },
  { to: '/receive', label: 'ຮັບລົດ', icon: 'car' },
  { to: '/pos', label: 'ຂາຍໜ້າຮ້ານ', icon: 'bag' },
  { to: '/unpaid', label: 'ລໍຖ້າຊຳລະ', icon: 'card' },
  { to: '/stock', label: 'ສະຕັອກ', icon: 'box' },
  { to: '/customers', label: 'ລູກຄ້າ', icon: 'users' },
  { to: '/appointments', label: 'ນັດໝາຍ', icon: 'calendar' },
  { to: '/sales/today', label: 'ຍອດມື້ນີ້', icon: 'cash' },
  { to: '/me/payslip', label: 'ສະລິບເງິນເດືອນ', icon: 'wallet' },
  { to: '/reports/monthly', label: 'ລາຍງານລາຍເດືອນ', icon: 'chart', minRole: 'ADMIN' },
  { to: '/reports/branches', label: 'ສະຫຼຸບແຕ່ລະສາຂາ', icon: 'store', minRole: 'SUPER_ADMIN' },
  { to: '/staff', label: 'ຄ່າຄອມພະນັກງານ', icon: 'user', minRole: 'ADMIN' },
  { to: '/admin/payroll', label: 'ເງິນເດືອນ', icon: 'wallet', minRole: 'ADMIN' },
  { to: '/admin/users', label: 'ຈັດການພະນັກງານ', icon: 'users', minRole: 'ADMIN' },
  { to: '/admin/branches', label: 'ຈັດການສາຂາ', icon: 'store', minRole: 'SUPER_ADMIN' },
  { to: '/admin/services', label: 'ບໍລິການ ແລະ ລາຄາ', icon: 'tag', minRole: 'ADMIN' },
  { to: '/settings', label: 'ຕັ້ງຄ່າ', icon: 'settings' },
];

function allowed(item: MenuItem, role: Role) {
  if (!item.minRole) return true;
  if (item.minRole === 'SUPER_ADMIN') return role === 'SUPER_ADMIN';
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function menuFor(role: Role) {
  return MENU.filter((item) => allowed(item, role)).map((item) => {
    if (item.to === '/admin/services' && role === 'ADMIN') return { ...item, label: 'ລາຄາສາຂາ' };
    if (item.to === '/admin/users' && role === 'SUPER_ADMIN') return { ...item, label: 'ຈັດການຜູ້ໃຊ້' };
    return item;
  });
}
