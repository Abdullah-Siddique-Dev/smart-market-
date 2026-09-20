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
  Circle,
  Zap,
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

  useGlobalShortcuts();

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
    { to: '/settings', label: 'Settings', key: null, icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground select-none font-sans">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/95 backdrop-blur-md transition-all duration-300 z-20 shrink-0 shadow-sm',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/25">
              <Store className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-sm tracking-tight text-foreground truncate">
                    Smart Market OS
                  </h2>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>Wholesale ERP v1.0</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: active }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative',
                    active || isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                    {item.key && (
                      <kbd
                        className={cn(
                          'transition-colors',
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 shadow-none'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {item.key}
                      </kbd>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Local Storage Indicator in Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Database className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>SQLite (WAL Active)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Local
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main App Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        {/* Top App Status Bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-10 shadow-xs">
          {/* Left: Clock & Terminal Mode */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/80 text-xs font-mono font-medium text-foreground shadow-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="opacity-40">•</span>
              <span className="hidden sm:inline font-sans text-muted-foreground text-[11px]">
                {currentTime.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-lg">
              <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              <span>High-Speed Wholesale POS</span>
            </div>
          </div>

          {/* Right Header Actions: Theme, User Profile, Logout */}
          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border bg-card hover:bg-muted transition-colors shadow-xs"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-500 transition-transform rotate-0 scale-100" />
              ) : (
                <Moon className="h-4 w-4 text-primary transition-transform rotate-0 scale-100" />
              )}
            </Button>

            {/* Current User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-border">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">
                  {user.full_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-foreground leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                    <span>@{user.username}</span>
                  </div>
                </div>
                <Badge
                  variant={isOwner ? 'default' : 'secondary'}
                  className={cn(
                    'text-[10px] font-mono tracking-wider font-bold ml-1',
                    isOwner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
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
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Viewport for Child Routes */}
        <main className="flex-1 overflow-y-auto bg-background min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
