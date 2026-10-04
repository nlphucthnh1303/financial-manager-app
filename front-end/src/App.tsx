import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { DateRangeProvider } from '@/lib/date-range';
import { LoginPage, RegisterPage } from '@/pages/auth/AuthPages';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { TransactionsPage } from '@/pages/transactions/TransactionsPage';
import { AccountsPage } from '@/pages/accounts/AccountsPage';
import { PiggyBanksPage } from '@/pages/piggybanks/PiggyBanksPage';
import { BudgetsPage, BillsPage } from '@/pages/budgets/BudgetsPage';
import { StatisticsPage, CurrenciesPage } from '@/pages/stats/OtherPages';
import { CategoriesPage } from '@/pages/categories/CategoriesPage';
import { DebtsPage } from '@/pages/debts/DebtsPage';
import { FinancialCalendarPage } from '@/pages/calendar/FinancialCalendarPage';
import { FrameworksPage } from '@/pages/frameworks/FrameworksPage';
import { UtilitiesPage } from '@/pages/utilities/UtilitiesPage';
import { localDb } from '@/lib/localDb';

const isMobileOrCapacitor = () => {
  return (
    typeof window !== 'undefined' &&
    ((window as any).Capacitor?.isNativePlatform() ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let token = localStorage.getItem('accessToken');
  
  // Auto-activate offline guest mode on mobile or when running in native app
  if (!token && isMobileOrCapacitor()) {
    token = 'offline-local-token';
    localStorage.setItem('accessToken', token);
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({
        id: 'local-mobile-user',
        email: 'offline@financialmanager.local',
        fullName: 'Người dùng Ngoại tuyến'
      }));
    }
  }

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppWithLayout: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Pre-initialize Local IndexedDB engine
    localDb.openDB().catch(() => {});
  }, []);

  return (
    <AppLayout 
      onOpenQuickAddTx={() => setShowQuickAdd(true)} 
      onDataCleared={() => setRefreshKey(k => k + 1)}
    >
      <Routes key={refreshKey}>
        {/* Main */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/calendar" element={<FinancialCalendarPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        
        {/* Planning & Frameworks */}
        <Route path="/debts" element={<DebtsPage />} />
        <Route path="/frameworks" element={<FrameworksPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/piggy-banks" element={<PiggyBanksPage />} />

        {/* Tools & Reports */}
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/currencies" element={<CurrenciesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <CreateTransactionModal
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="pfm-theme">
      <BrowserRouter>
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DateRangeProvider>
                  <AppWithLayout />
                </DateRangeProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
