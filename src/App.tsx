import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AdminRoute } from './components/RoleGate';
import { Frame } from './components/Shell';
import { useStore } from './hooks/useStore';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { BranchesPage } from './pages/BranchesPage';
import { BranchReportPage } from './pages/BranchReportPage';
import { CustomerPage } from './pages/CustomerPage';
import { CustomersPage } from './pages/CustomersPage';
import { HomePage } from './pages/HomePage';
import { IntakePage } from './pages/IntakePage';
import { JobPage } from './pages/JobPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentPage } from './pages/PaymentPage';
import { PayrollPage } from './pages/PayrollPage';
import { PayslipPage } from './pages/PayslipPage';
import { PosPage } from './pages/PosPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPage } from './pages/SalesPage';
import { ServicesPage } from './pages/ServicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffPage } from './pages/StaffPage';
import { StockPage } from './pages/StockPage';
import { UnpaidPage } from './pages/UnpaidPage';
import { UsersPage } from './pages/UsersPage';

function Private() {
  const { session } = useStore();
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Old links (/pay/:id, /receipt/:id) */
function JobRedirect({ to }: { to: 'pay' | 'receipt' }) {
  const { id } = useParams();
  return <Navigate to={`/jobs/${id}/${to}`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Frame />}>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Private />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/receive" element={<IntakePage />} />
            <Route path="/unpaid" element={<UnpaidPage />} />
            <Route path="/jobs/:id" element={<JobPage />} />
            <Route path="/jobs/:id/pay" element={<PaymentPage />} />
            <Route path="/jobs/:id/receipt" element={<ReceiptPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/sales/today" element={<SalesPage />} />
            <Route path="/me/payslip" element={<PayslipPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/reports/monthly" element={<ReportsPage />} />
              <Route path="/reports/branches" element={<BranchReportPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/admin/payroll" element={<PayrollPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/admin/services" element={<ServicesPage />} />
            </Route>
            <Route path="/intake" element={<Navigate to="/receive" replace />} />
            <Route path="/queue" element={<Navigate to="/unpaid" replace />} />
            <Route path="/sales" element={<Navigate to="/sales/today" replace />} />
            <Route path="/reports" element={<Navigate to="/reports/monthly" replace />} />
            <Route path="/pay/:id" element={<JobRedirect to="pay" />} />
            <Route path="/receipt/:id" element={<JobRedirect to="receipt" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
