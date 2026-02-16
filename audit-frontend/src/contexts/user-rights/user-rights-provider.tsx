import type { ReactNode } from "react";

import type { MenuItem } from "@/types/central/user-rights";
import { useUserMenuRights } from "@/hooks/api/central/use-user-rights";

import { UserRightsContext } from "./user-rights-context";

interface UserRightsProviderProps {
  children: ReactNode;
}

export function UserRightsProvider({ children }: UserRightsProviderProps) {
  const { data, isLoading, error, refetch } = useUserMenuRights();

  const refetchUserRights = async () => {
    await refetch();
  };

  // Recursively flatten menu items to make all nested items accessible
  const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.reduce((acc: MenuItem[], item: MenuItem) => {
      acc.push(item);
      if (item.children && item.children.length > 0) {
        acc.push(...flattenMenuItems(item.children));
      }
      return acc;
    }, []);
  };

  const flattenedMenuItems = data ? flattenMenuItems(data) : [];

  const value = {
    menuItems: flattenedMenuItems || [],
    isLoading,
    error: error as Error | null,
    refetchUserRights,
  };

  return (
    <UserRightsContext.Provider value={value}>
      {children}
    </UserRightsContext.Provider>
  );
}
