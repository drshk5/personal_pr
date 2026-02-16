import { useMemo } from "react";
import { FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserRights } from "@/hooks";
import { getIconByName } from "@/lib/icon-map";

export function useMenuIcon(
  mapKey: string,
  fallbackIcon?: LucideIcon
): LucideIcon {
  const { menuItems } = useUserRights();

  return useMemo(() => {
    const menuItem = menuItems.find((item) => item.strMapKey === mapKey);

    if (menuItem?.strIconName) {
      return getIconByName(menuItem.strIconName) || fallbackIcon || FileText;
    }

    return fallbackIcon || FileText;
  }, [menuItems, mapKey, fallbackIcon]);
}

export function useMenuIconByPath(
  path: string,
  fallbackIcon?: LucideIcon
): LucideIcon {
  const { menuItems } = useUserRights();

  return useMemo(() => {
   
    const menuItem = menuItems.find((item) => {
      if (item.strPath === path) return true;

      const routePattern = item.strPath.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });

    if (menuItem?.strIconName) {
      return getIconByName(menuItem.strIconName) || fallbackIcon || FileText;
    }

    return fallbackIcon || FileText;
  }, [menuItems, path, fallbackIcon]);
}
