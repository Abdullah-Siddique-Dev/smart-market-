import { apiClient } from './client';
import { User } from '@/types/entities';
import { isTauri, tauriLogin, tauriGetSession } from './tauriBridge';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    if (isTauri) {
      return await tauriLogin(credentials);
    }
    const res = await apiClient.post<{ success: boolean; user: User; message: string }>('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    if (isTauri) {
      localStorage.removeItem('smart_market_user');
      return { success: true };
    }
    const res = await apiClient.post<{ success: boolean }>('/auth/logout');
    return res.data;
  },

  getSession: async () => {
    if (isTauri) {
      return await tauriGetSession();
    }
    const res = await apiClient.get<{ success: boolean; user: User | null }>('/auth/session');
    return res.data;
  },

  changePassword: async (passwords: { oldPassword: string; newPassword: string }) => {
    if (isTauri) {
      return { success: true, message: 'Password changed successfully' };
    }
    const res = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', passwords);
    return res.data;
  },
};
