import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AppLayout } from './layout';
import { LoginPage } from '@/components/modules/auth/login-page';
import { PosTerminal } from '@/components/modules/billing/pos-terminal';
import { OrderList } from '@/components/modules/orders/order-list';
import { SlipList } from '@/components/modules/dispatch/slip-list';
import { ProductList } from '@/components/modules/inventory/product-list';
import { BookerList } from '@/components/modules/bookers/booker-list';
import { ShopList } from '@/components/modules/shops/shop-list';
import { ProfitDashboard } from '@/components/modules/reports/profit-dashboard';
import { LedgerViewer } from '@/components/modules/audit/ledger-viewer';
import { SystemSettings } from '@/components/modules/settings/system-settings';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">
          Checking local authentication session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected ERP Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/billing" replace />} />
        <Route path="billing" element={<PosTerminal />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="dispatch" element={<SlipList />} />
        <Route path="inventory" element={<ProductList />} />
        <Route path="bookers" element={<BookerList />} />
        <Route path="shops" element={<ShopList />} />
        <Route path="reports" element={<ProfitDashboard />} />
        <Route path="audit" element={<LedgerViewer />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/billing" replace />} />
    </Routes>
  );
};
