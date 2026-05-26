import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

export const userKeys = {
  all: ['users'] as const,
  list: (search: string, status: string) => [...userKeys.all, 'list', { search, status }] as const,
  detail: (email: string) => [...userKeys.all, 'detail', email] as const,
};

export const useUsers = (search: string, status: string) => {
  return useInfiniteQuery({
    queryKey: userKeys.list(search, status),
    queryFn: ({ pageParam = 0 }) => userService.getUsers(search, status, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserDetail = (email: string) => {
  return useQuery({
    queryKey: userKeys.detail(email),
    queryFn: () => userService.getUserDetails(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, data }: { email: string; data: any }) => 
      userService.updateUserDetails(email, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.email) });
    },
  });
};
