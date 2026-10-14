import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

/** Renders children only for ADMIN */
export function RoleGate({ children }: { children: ReactNode }) {
  const { admin } = useStore();
  return admin ? <>{children}</> : null;
}

/** Route wrapper: USER is sent back to the home page */
export function AdminRoute() {
  const { session } = useStore();
  if (session && session.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
