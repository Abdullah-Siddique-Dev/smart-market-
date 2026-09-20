import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '../api/system.api';

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemApi.getStatus(),
    refetchInterval: 15000,
  });
}

export function useSystemUsers() {
  return useQuery({
    queryKey: ['system-users'],
    queryFn: () => systemApi.getUsers(),
  });
}

export function useSystemMutations() {
  const queryClient = useQueryClient();

  const triggerBackup = useMutation({
    mutationFn: systemApi.triggerBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });

  const createUser = useMutation({
    mutationFn: systemApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    },
  });

  return { triggerBackup, createUser };
}
