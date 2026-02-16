import * as React from "react";

import { DynamicSidebar } from "@/components/navigation/sidebar/dynamic-sidebar-popup";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  // SidebarRail,
} from "@/components/ui/sidebar";
import { OrganizationYearSwitcher } from "../organization-year-switcher";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationYearSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <DynamicSidebar />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
