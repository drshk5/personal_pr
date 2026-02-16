import { Search, Building, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

// ==================== Organization Year Switcher Skeletons ====================
// All skeleton components used in the organization-year-switcher component

export function OrganizationYearSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
              <Building className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">Loading...</span>
            <span className="truncate text-xs">{"Company"}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function OrganizationYearSwitcherErrorSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
              <Building className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">Error loading</span>
            <span className="truncate text-xs text-red-500">
              {"Check console"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function OrganizationYearSwitcherEmptySkeleton({
  isSuperAdmin = false,
}: {
  isSuperAdmin?: boolean;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
              <Building className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">
              {isSuperAdmin ? "Super Admin" : "No Organizations"}
            </span>
            <span className="truncate text-xs">
              {isSuperAdmin ? "System Administrator" : "Please contact admin"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function YearsLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      <span className="ml-2 text-sm">Loading years...</span>
    </div>
  );
}

// ==================== Empty State Skeleton ====================

interface EmptyStateSkeletonProps {
  icon?: "search" | "building" | "calendar";
  title: string;
  description: string;
}

export function EmptyStateSkeleton({
  icon = "search",
  title,
  description,
}: EmptyStateSkeletonProps) {
  const getIcon = () => {
    switch (icon) {
      case "search":
        return <Search className="size-3.5 text-muted-foreground" />;
      case "building":
        return <Building className="size-3.5 text-muted-foreground" />;
      case "calendar":
        return <CalendarDays className="size-3.5 text-muted-foreground" />;
      default:
        return <Search className="size-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-3 flex items-center gap-2">
      <Avatar className="h-6 w-6 rounded">
        <AvatarFallback className="rounded bg-muted">
          {getIcon()}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}
