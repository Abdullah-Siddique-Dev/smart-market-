import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, User as UserIcon, Store, ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser, isAuthenticated, user } = useAuthStore();

  // If already logged in, redirect straight to the terminal
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/billing', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.login({ username, password });
      if (res.success && res.user) {
        setUser(res.user);
        navigate('/billing', { replace: true });
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 select-none">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Smart Market OS</h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Wholesale & Import Distribution ERP • Offline-First
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border-border/80 shadow-xl backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In to Terminal</CardTitle>
            <CardDescription className="text-xs">
              Enter your authorized staff credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" /> Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. admin or operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-10 text-sm font-mono"
                />
              </div>

              <Button type="submit" className="w-full h-10 font-semibold gap-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Secure Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Quick Login Helpers for Development & Initial Setup */}
            <div className="mt-6 pt-5 border-t border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2.5 uppercase tracking-wider text-center">
                Pre-configured Local Profiles
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-primary/5 hover:border-primary/40 transition-all text-left group"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">
                    Owner / Admin
                  </span>
                  <span className="text-[10px] text-muted-foreground">Full ERP Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('operator', 'operator123')}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-primary/5 hover:border-primary/40 transition-all text-left group"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-primary">
                    POS Operator
                  </span>
                  <span className="text-[11px] text-muted-foreground">Billing & Orders Only</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-muted-foreground">
          Local SQLite Database • Port 4000 • High-Speed POS Mode
        </div>
      </div>
    </div>
  );
};
