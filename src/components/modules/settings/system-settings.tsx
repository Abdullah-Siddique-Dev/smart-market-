import React, { useState } from 'react';
import { useSystemStatus, useSystemUsers, useSystemMutations } from '@/lib/queries/use-system';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { authApi } from '@/lib/api/auth.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Server,
  Layers,
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === 'OWNER';
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  const { data: status, isLoading: isStatusLoading, refetch: refetchStatus } = useSystemStatus();
  const { data: users = [], isLoading: isUsersLoading, refetch: refetchUsers } = useSystemUsers();
  const { triggerBackup, createUser } = useSystemMutations();

  // Create User State
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'OPERATOR' | 'OWNER'>('OPERATOR');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [isPwdPending, setIsPwdPending] = useState(false);

  // Backup State
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const handleBackup = async () => {
    try {
      setBackupMsg(null);
      const res = await triggerBackup.mutateAsync();
      setBackupMsg(`Backup snapshot created successfully: ${res?.backup_file}`);
      refetchStatus();
    } catch (err: any) {
      setBackupMsg(`Backup failed: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
      setUserError('All fields are required');
      return;
    }

    try {
      setUserError(null);
      await createUser.mutateAsync({
        username: newUsername.trim(),
        password: newPassword.trim(),
        full_name: newFullName.trim(),
        role: newRole,
      });

      setUserSuccess(`Staff profile created for "${newUsername}"`);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      refetchUsers();
    } catch (err: any) {
      setUserError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newAccountPassword) {
      setPwdError('Please enter current and new password');
      return;
    }

    try {
      setIsPwdPending(true);
      setPwdError(null);
      const res = await authApi.changePassword({
        oldPassword: currentPassword,
        newPassword: newAccountPassword,
      });

      if (res.success) {
        setPwdSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewAccountPassword('');
      } else {
        setPwdError(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsPwdPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <span>System & Database Settings</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Local SQLite backup triggers, staff credentials, security policies, and interface theme
        </p>
      </div>

      {/* 1. Database & Backup Status */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Local SQLite Database Engine</span>
              </CardTitle>
              <CardDescription className="text-xs">
                WAL mode (Write-Ahead Logging) • Local Zero-Cloud Storage
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={handleBackup}
              disabled={triggerBackup.isPending}
              className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {triggerBackup.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating Snapshot...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Create Live Backup Now</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          {backupMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          {isStatusLoading || !status ? (
            <div className="py-4 text-muted-foreground">Loading database status...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                  WAL Journal Mode
                </div>
                <div className="text-sm font-bold text-foreground mt-1">
                  {status.database.journal_mode}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                  Integrity Check
                </div>
                <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{status.database.integrity}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                  Foreign Keys Enforced
                </div>
                <div className="text-sm font-bold text-foreground mt-1">
                  {status.database.foreign_keys ? 'ENABLED (ON)' : 'OFF'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="text-[10px] text-muted-foreground uppercase font-sans font-semibold">
                  Total Ledger Records
                </div>
                <div className="text-sm font-bold text-foreground mt-1">
                  {status.records.inventory_ledger}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Staff & User Management (Owner Only) */}
      {isOwner && (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Authorized Staff Accounts & Roles</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage operators (POS terminal access) and owners (full access)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Registered Users Table */}
            <div className="border border-border/80 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/60">
                  <tr>
                    <th className="p-2.5">Full Name</th>
                    <th className="p-2.5">Username</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="p-2.5 font-semibold text-foreground">{u.full_name}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{u.username}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={u.role === 'OWNER' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-2.5">
                        <span className="text-emerald-600 font-semibold">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create New Staff User */}
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
              <div className="font-bold text-xs text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>Create New Staff Account</span>
              </div>

              {userError && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                  {userError}
                </div>
              )}
              {userSuccess && (
                <div className="p-2 rounded bg-emerald-50 text-emerald-700 text-xs">
                  {userSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                <Input
                  type="text"
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="h-8 text-xs"
                >
                  <option value="OPERATOR">OPERATOR (POS Only)</option>
                  <option value="OWNER">OWNER (Full Admin)</option>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={createUser.isPending} className="font-semibold text-xs">
                  {createUser.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. Change Account Password */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Update Account Password</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Change credentials for logged-in user: {user?.username} ({user?.role})
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            {pwdError && (
              <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="p-2 rounded bg-emerald-50 text-emerald-700 text-xs">
                {pwdSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">New Password</label>
              <Input
                type="password"
                value={newAccountPassword}
                onChange={(e) => setNewAccountPassword(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <Button type="submit" size="sm" disabled={isPwdPending} className="font-semibold text-xs">
              {isPwdPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 4. Display Appearance */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Appearance & Display</span>
          </CardTitle>
          <CardDescription className="text-xs">
            High-contrast dark mode for warehouse terminals or light theme for office use
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-foreground">Current Theme Mode: {theme.toUpperCase()}</div>
            <div className="text-muted-foreground">Toggle between Dark Mode and Light Mode</div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Switch to Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-primary" />
                <span>Switch to Dark</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
