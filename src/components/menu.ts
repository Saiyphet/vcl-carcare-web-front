import type { IconName } from './Icon';

export type MenuItem = { to: string; label: string; icon: IconName; admin?: boolean; end?: boolean };

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
  { to: '/reports/monthly', label: 'ລາຍງານລາຍເດືອນ', icon: 'chart', admin: true },
  { to: '/reports/branches', label: 'ສະຫຼຸບແຕ່ລະສາຂາ', icon: 'store', admin: true },
  { to: '/staff', label: 'ຄ່າຄອມພະນັກງານ', icon: 'user', admin: true },
  { to: '/admin/payroll', label: 'ເງິນເດືອນ', icon: 'wallet', admin: true },
  { to: '/admin/users', label: 'ຈັດການຜູ້ໃຊ້', icon: 'users', admin: true },
  { to: '/admin/branches', label: 'ຈັດການສາຂາ', icon: 'store', admin: true },
  { to: '/admin/services', label: 'ບໍລິການ ແລະ ລາຄາ', icon: 'tag', admin: true },
  { to: '/settings', label: 'ຕັ້ງຄ່າ', icon: 'settings' },
];

export function menuFor(admin: boolean) {
  return MENU.filter((item) => admin || !item.admin);
}
