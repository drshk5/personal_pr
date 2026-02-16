import {createContext} from 'react';
import type {MenuItem} from '@/types/central/user-rights';

interface UserRightsContextType {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: Error | null;
  refetchUserRights: () => Promise<void>;
}

export const UserRightsContext = createContext<UserRightsContextType>({
  menuItems: [],
  isLoading: false,
  error: null,
  refetchUserRights: async () => {},
});
