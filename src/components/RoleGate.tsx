import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

/** Renders children for ADMIN + SUPER_ADMIN, or SUPER_ADMIN only when `owner` */
export function RoleGate({ children, owner }: { children: ReactNode; owner?: boolean }) {
  const { admin, superAdmin } = useStore();
  return (owner ? superAdmin : admin) ? <>{children}</> : null;
}

/** Route wrapper: USER is sent back to the home page */
export function AdminRoute() {
  const { session, admin } = useStore();
  if (session && !admin) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Route wrapper: only SUPER_ADMIN */
export function SuperAdminRoute() {
  const { session, superAdmin } = useStore();
  if (session && !superAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
