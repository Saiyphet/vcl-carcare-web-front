import { cls } from '../utils/format';

/** The shop's logo (public/logo.png, dark background) */
export function Logo({ size = 'lg' }: { size?: 'lg' | 'sm' | 'xs' }) {
  return <img className={cls('logo-img', size)} src="/logo.png" alt="VCL CARCARE · Car Wash & Detailing Center" />;
}
