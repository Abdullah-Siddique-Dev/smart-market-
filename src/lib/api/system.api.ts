import { apiClient } from './client';
import { User } from '@/types/entities';
import { ApiResponse } from '@/types/api';

export const systemApi = {
  getStatus: async () => {
    const res = await apiClient.get<ApiResponse<{
      status: string;
      uptime_seconds: number;
      database: { path: string; journal_mode: string; foreign_keys: boolean; integrity: string };
      latest_backup: string | null;
      records: { products: number; retail_shops: number; order_bookers: number; orders: number; bills: number; inventory_ledger: number };
    }>>('/system/status');
    return res.data.data;
  },

  triggerBackup: async () => {
    const res = await apiClient.post<ApiResponse<{ backup_file: string; size_bytes: number }>>('/system/backup');
    return res.data.data;
  },

  getUsers: async () => {
    const res = await apiClient.get<ApiResponse<User[]>>('/system/users');
    return res.data.data || [];
  },

  createUser: async (data: { username: string; password: string; full_name: string; role: string }) => {
    const res = await apiClient.post<ApiResponse<User>>('/system/users', data);
    return res.data.data;
  },
};
