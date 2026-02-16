import { useContext } from "react";

import type { MenuItem } from "@/types/central/user-rights";

import { UserRightsContext } from "@/contexts/user-rights/user-rights-context";

export function useUserRights() {
  const context = useContext(UserRightsContext);

  if (!context) {
    throw new Error("useUserRights must be used within a UserRightsProvider");
  }

  const getSidebarMenuItems = (): MenuItem[] => {
    return context.menuItems
      .filter((item) => item.strMenuPosition === "sidebar")
      .sort((a, b) => a.dblSeqNo - b.dblSeqNo);
  };

  const getUserbarMenuItems = (): MenuItem[] => {
    return context.menuItems
      .filter((item) => item.strMenuPosition === "userbar")
      .sort((a, b) => a.dblSeqNo - b.dblSeqNo);
  };

  const getHiddenMenuItems = (): MenuItem[] => {
    return context.menuItems
      .filter((item) => item.strMenuPosition === "hidden")
      .sort((a, b) => a.dblSeqNo - b.dblSeqNo);
  };

  return {
    ...context,
    getSidebarMenuItems,
    getUserbarMenuItems,
    getHiddenMenuItems,
  };
}
