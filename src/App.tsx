import { ThemeProvider } from "@/components/theme-provider"
import LandingPage from "@/components/landing/LandingPage"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import DashboardPage from "@/pages/DashboardPage"
import CustomersPage from "@/pages/CustomersPage"
import AddCustomerPage from "@/pages/AddCustomerPage"
import CustomerDetailPage from "@/pages/CustomerDetailPage"
import ZonesPage from "@/pages/ZonesPage"
import AddZonePage from "@/pages/AddZonePage"
import ZoneDetailPage from "@/pages/ZoneDetailPage"
import ConnectionTypesPage from "@/pages/ConnectionTypesPage"
import RoutersPage from "@/pages/mikrotik/RoutersPage"
import AddRouterPage from "@/pages/mikrotik/AddRouterPage"
import QueueProfilesPage from "@/pages/mikrotik/QueueProfilesPage"
import SyncLogsPage from "@/pages/mikrotik/SyncLogsPage"
import PackagesPage from "@/pages/PackagesPage"
import AddPackagePage from "@/pages/AddPackagePage"
import SubscriptionsPage from "@/pages/SubscriptionsPage"
import AddSubscriptionPage from "@/pages/AddSubscriptionPage"
import SubscriptionDetailPage from "@/pages/SubscriptionDetailPage"
import BillsPage from "@/pages/billing/BillsPage"
import PaymentsPage from "@/pages/billing/PaymentsPage"
import InvoicesPage from "@/pages/billing/InvoicesPage"
import AdvancePaymentsPage from "@/pages/billing/AdvancePaymentsPage"
import DiscountsPage from "@/pages/billing/DiscountsPage"
import RefundsPage from "@/pages/billing/RefundsPage"
import AddDiscountPage from "@/pages/billing/AddDiscountPage"
import AddRefundPage from "@/pages/billing/AddRefundPage"
import AddBillPage from "@/pages/billing/AddBillPage"
import BillDetailPage from "@/pages/billing/BillDetailPage"
import AddPaymentPage from "@/pages/billing/AddPaymentPage"
import ConnectionFeesPage from "@/pages/billing/ConnectionFeesPage"
import AddAdvancePaymentPage from "@/pages/billing/AddAdvancePaymentPage"
import SettingsPage from "@/pages/SettingsPage"
import UsersPage from "@/pages/UsersPage"
import UserDetailPage from "@/pages/UserDetailPage"
import AddUserPage from "@/pages/AddUserPage"
import LoginHistoryPage from "@/pages/LoginHistoryPage"
import SchedulePage from "@/pages/schedule/SchedulePage"



function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/add" element={<AddCustomerPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/edit" element={<AddCustomerPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/zones/add" element={<AddZonePage />} />
          <Route path="/zones/:id" element={<ZoneDetailPage />} />
          <Route path="/connection-types" element={<ConnectionTypesPage />} />
          <Route path="/mikrotik/routers" element={<RoutersPage />} />
          <Route path="/mikrotik/routers/add" element={<AddRouterPage />} />
          <Route path="/mikrotik/routers/:id" element={<AddRouterPage />} />
          <Route path="/mikrotik/queue-profiles" element={<QueueProfilesPage />} />
          <Route path="/mikrotik/sync-logs" element={<SyncLogsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/add" element={<AddPackagePage />} />
          <Route path="/packages/:id" element={<AddPackagePage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/add" element={<AddSubscriptionPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/subscriptions/:id/edit" element={<AddSubscriptionPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/bills/add" element={<AddBillPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />
          <Route path="/billing/payments" element={<PaymentsPage />} />
          <Route path="/billing/payments/add" element={<AddPaymentPage />} />
          <Route path="/billing/connection-fees" element={<ConnectionFeesPage />} />
          <Route path="/billing/invoices" element={<InvoicesPage />} />
          <Route path="/billing/advance-payments" element={<AdvancePaymentsPage />} />
          <Route path="/billing/advance-payments/add" element={<AddAdvancePaymentPage />} />
          <Route path="/billing/discounts" element={<DiscountsPage />} />
          <Route path="/billing/discounts/add" element={<AddDiscountPage />} />
          <Route path="/billing/refunds" element={<RefundsPage />} />
          <Route path="/billing/refunds/add" element={<AddRefundPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/create" element={<AddUserPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/users/:id/edit" element={<AddUserPage />} />
          <Route path="/users/login-history" element={<LoginHistoryPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
