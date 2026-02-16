import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

/**
 * Skeleton component for the sidebar when menu items are loading
 * Simulates the structure of a sidebar with placeholder items
 */
export function SidebarSkeleton() {
  // Create arrays with skeleton items
  const mainItems = Array(5).fill(0);
  const subItems = Array(3).fill(0);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Skeleton className="h-4 w-16 group-data-[collapsible=icon]:hidden" />
      </SidebarGroupLabel>
      <SidebarMenu className="skeleton-pulse">
        {mainItems.map((_, index) => (
          <SidebarMenuItem key={`main-${index}`}>
            <SidebarMenuButton>
              <Skeleton className="h-4 w-4 mr-2 rounded-md" />
              <Skeleton className="h-4 w-full max-w-28 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
            {/* For each main item, create a submenu with placeholder items */}
            {index === 0 && (
              <SidebarMenu>
                {subItems.map((_, subIndex) => (
                  <SidebarMenuItem key={`sub-${subIndex}`}>
                    <SidebarMenuButton>
                      <Skeleton className="h-3 w-3 mr-2 rounded-md" />
                      <Skeleton className="h-3 w-full max-w-24 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
