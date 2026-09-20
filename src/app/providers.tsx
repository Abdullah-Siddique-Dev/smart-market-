import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<ProvidersProps> = ({ children }) => {
  const checkSession = useAuthStore((state) => state.checkSession);
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    // Check user auth session from Express cookie-parser on startup
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Sync theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
