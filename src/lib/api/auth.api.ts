import { apiClient } from './client';
import { User } from '@/types/entities';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; user: User; message: string }>('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post<{ success: boolean }>('/auth/logout');
    return res.data;
  },

  getSession: async () => {
    const res = await apiClient.get<{ success: boolean; user: User | null }>('/auth/session');
    return res.data;
  },

  changePassword: async (passwords: { oldPassword: string; newPassword: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', passwords);
    return res.data;
  },
};
