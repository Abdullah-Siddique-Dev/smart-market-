import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Package,
  Truck,
  Boxes,
  Users,
  Store,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Database,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const AppLayout: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isOwner = user?.role === 'OWNER';

  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  // Attach global keyboard shortcuts F1-F8
  useGlobalShortcuts();

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/billing', label: 'Billing POS', key: 'F1', icon: CreditCard },
    { to: '/orders', label: 'Orders', key: 'F2', icon: Package },
    { to: '/dispatch', label: 'Dispatch', key: 'F3', icon: Truck },
    { to: '/inventory', label: 'Inventory', key: 'F4', icon: Boxes },
    { to: '/bookers', label: 'Order Bookers', key: 'F5', icon: Users },
    { to: '/shops', label: 'Shops & Khata', key: 'F6', icon: Store },
    ...(isOwner
      ? [
          { to: '/reports', label: 'Profit Reports', key: 'F7', icon: BarChart3 },
          { to: '/audit', label: 'Audit Ledger', key: 'F8', icon: ShieldCheck },
        ]
      : []),
    { to: '/settings', label: 'System Settings', key: null, icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border/80 bg-card transition-all duration-200 z-20 shrink-0 shadow-sm',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
              <Store className="h-4 w-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h2 className="font-black text-sm tracking-tight text-foreground truncate">
                  Smart Market OS
                </h2>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  Wholesale ERP v1.0
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="h-7 w-7 rounded-md hover:bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: active }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group',
                    active || isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.key && (
                      <span
                        className={cn(
                          'font-mono text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors',
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {item.key}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Local Storage Indicator */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-border/60 bg-muted/20">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Offline SQLite (WAL Mode)</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main App Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top App Status Bar */}
        <header className="h-14 border-b border-border/80 bg-card px-4 flex items-center justify-between shrink-0 z-10 shadow-xs">
          {/* Live Date & Time */}
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="hidden sm:inline opacity-60">•</span>
            <span className="hidden sm:inline">
              {currentTime.toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Current User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-foreground leading-none">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    @{user.username}
                  </div>
                </div>
                <Badge
                  variant={isOwner ? 'default' : 'secondary'}
                  className="text-[10px] font-mono tracking-wider font-bold"
                >
                  {user.role}
                </Badge>
              </div>
            )}

            {/* Logout Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Viewport for Routes */}
        <main className="flex-1 overflow-y-auto bg-background min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
