import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import AuditLogPage from "./pages/AuditLogPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import UnitTypesPage from "./pages/UnitTypesPage";
import JournalPage from "./pages/JournalPage";
import CashAccountsPage from "./pages/CashAccountsPage";
import PartiesPage from "./pages/PartiesPage";
import PartyDetailPage from "./pages/PartyDetailPage";
import SalesPage from "./pages/SalesPage";
import SaleDetailPage from "./pages/SaleDetailPage";
import RentalsPage from "./pages/RentalsPage";
import RentalDetailPage from "./pages/RentalDetailPage";
import ExpensesPage from "./pages/ExpensesPage";
import PurchasesPage from "./pages/PurchasesPage";
import PurchaseDetailPage from "./pages/PurchaseDetailPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import ExchangePage from "./pages/ExchangePage";
import PartnersPage from "./pages/PartnersPage";
import PartnerDetailPage from "./pages/PartnerDetailPage";
import ProfitLossPage from "./pages/ProfitLossPage";
import GeneralReportPage from "./pages/GeneralReportPage";
import DailyCashJournalPage from "./pages/DailyCashJournalPage";
import CustomersLandingPage from "./pages/CustomersLandingPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading, justLoggedIn } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">... بارېدل</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (justLoggedIn && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(role) && !hasRole("admin")) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/welcome"
          element={
            <Protected>
              <WelcomePage />
            </Protected>
          }
        />
        <Route
          path="/"
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="unit-types" element={<UnitTypesPage />} />
          <Route path="parties" element={<PartiesPage />} />
          <Route path="parties/:id" element={<PartyDetailPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/:id" element={<SaleDetailPage />} />
          <Route path="rentals" element={<RentalsPage />} />
          <Route path="rentals/:id" element={<RentalDetailPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="purchases/:id" element={<PurchaseDetailPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="exchange" element={<ExchangePage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="partners/:id" element={<PartnerDetailPage />} />
          <Route path="roznamcha" element={<DailyCashJournalPage />} />
          <Route path="customers" element={<CustomersLandingPage />} />
          <Route path="shops" element={<div style={{padding:40,color:"var(--muted)",textAlign:"center"}}>د دوکانونو برخه ډیره ژر راځي...</div>} />
          <Route path="reports/profit-loss" element={<ProfitLossPage />} />
          <Route path="reports/general" element={<GeneralReportPage />} />
          <Route
            path="journal"
            element={
              <RequireRole role="admin">
                <JournalPage />
              </RequireRole>
            }
          />
          <Route
            path="cash-accounts"
            element={
              <RequireRole role="admin">
                <CashAccountsPage />
              </RequireRole>
            }
          />
          <Route
            path="users"
            element={
              <RequireRole role="admin">
                <UsersPage />
              </RequireRole>
            }
          />
          <Route
            path="roles"
            element={
              <RequireRole role="admin">
                <RolesPage />
              </RequireRole>
            }
          />
          <Route
            path="audit-log"
            element={
              <RequireRole role="admin">
                <AuditLogPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
