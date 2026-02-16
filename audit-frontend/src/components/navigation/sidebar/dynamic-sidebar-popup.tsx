import { NavMain as NavMainStandard } from "@/components/navigation/sidebar/nav-main";
import { NavMain as NavMainPopup } from "@/components/navigation/sidebar/nav-main-popup";
import type {
  NavMenuItem,
  NavMenuItemType,
} from "@/components/navigation/sidebar/nav-main-popup";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import { SidebarSkeleton } from "@/components/navigation/sidebar/sidebar-skeleton";
import { getIconByName } from "@/lib/icon-map";
import { useLocation } from "react-router-dom";
import { useUserRights } from "@/hooks";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import type { MenuItem } from "@/types/central/user-rights";
import { useSidebar } from "@/components/ui/sidebar";

export function DynamicSidebar() {
  const { menuItems, isLoading, error } = useUserRights();
  const { isSwitchingContext } = useContextSwitches();
  const location = useLocation();
  const { state, isMobile } = useSidebar();

  // Show skeleton during user rights loading or during context switching
  if (isLoading || isSwitchingContext) {
    return <SidebarSkeleton />;
  }

  // Get only root-level sidebar menu items (those not children of any other item)
  const rootSidebarMenuItems = !error
    ? menuItems.filter(
        (item) =>
          item.strMenuPosition === "sidebar" &&
          !menuItems.some((parent) =>
            parent.children?.some((child) => child.strMapKey === item.strMapKey)
          )
      )
    : [];

  // Create welcome page item
  const welcomeItem: NavMenuItem = {
    title: "Welcome",
    url: "/welcome",
    icon: getIconByName("Dashboard"), // Using Dashboard icon for welcome page
    isActive: location.pathname === "/welcome",
  };

  // Create a separator item (this will render as a separator in NavMain)
  const separatorItem: NavMenuItemType = {
    type: "separator" as const,
  };

  // Helper function to transform menu items recursively
  const transformMenuItem = (item: MenuItem): NavMenuItem => {
    // Get the appropriate icon component
    // Use a fallback to a basic icon if the specified icon is not found
    const IconComponent: LucideIcon =
      getIconByName(item.strIconName) || FileText;

    // Check if the current route matches this item's path
    const isActive =
      location.pathname === item.strPath ||
      location.pathname.startsWith(`${item.strPath}/`);

    // Always check for children regardless of bolHasSubMenu flag
    const hasChildren = item.children && item.children.length > 0;

    // Filter out hidden children and only process visible sidebar children
    const visibleChildren = hasChildren
      ? item.children.filter((child) => child.strMenuPosition === "sidebar")
      : [];

    // Process visible children recursively if they exist
    const childItems =
      visibleChildren.length > 0
        ? visibleChildren.map((child) => transformMenuItem(child))
        : undefined;

    // Create the item with appropriate format
    return {
      title: item.strName,
      url: item.strPath,
      icon: IconComponent,
      isActive,
      items: childItems,
    };
  };

  // Transform sidebar menu items with proper recursive processing
  const dynamicSidebarItems = rootSidebarMenuItems.map(transformMenuItem);

  // Always include the welcome item, regardless of API errors or empty menu items
  const sidebarItems: NavMenuItemType[] = [welcomeItem];

  // Only add separator and other items if there are dynamic items to show
  // This ensures we always have at least the Welcome page even if API fails
  if (dynamicSidebarItems.length > 0) {
    sidebarItems.push(separatorItem, ...dynamicSidebarItems);
  }

  return (
    <>
      {isMobile || state === "expanded" ? (
        <NavMainStandard items={sidebarItems} />
      ) : (
        <NavMainPopup items={sidebarItems} />
      )}
    </>
  );
}
