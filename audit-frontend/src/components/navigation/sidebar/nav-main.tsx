"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Define types for our menu items
export interface NavMenuItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavMenuItem[]; // Changed to allow recursive nesting
}

export interface NavMenuSeparator {
  type: "separator";
}

export type NavMenuItemType = NavMenuItem | NavMenuSeparator;

interface NavMainProps {
  items: NavMenuItemType[];
}

export function NavMain({ items }: NavMainProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  // Close mobile sidebar when a link is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => {
          // Handle separator items
          if ("type" in item && item.type === "separator") {
            return <Separator key={`separator-${index}`} className="my-2" />;
          }

          // From this point on, we know item is a NavMenuItem
          const navItem = item as NavMenuItem;

          // Check if this item has children
          const hasChildren = navItem.items && navItem.items.length > 0;

          // If it has children, render as a dropdown
          if (hasChildren) {
            return (
              <Collapsible
                key={navItem.title}
                asChild
                defaultOpen={
                  navItem.isActive ||
                  navItem.items?.some((subItem) => subItem.isActive)
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={navItem.title}
                      className="relative w-full flex items-center justify-between"
                    >
                      {navItem.icon && (
                        <navItem.icon className="mr-2 shrink-0" />
                      )}
                      <span className="truncate flex-1">{navItem.title}</span>
                      <ChevronRight className="shrink-0 h-4 w-4 transition-transform duration-400 ease-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {navItem.items?.map((subItem) => {
                        // Check if this subItem has children
                        const hasNestedChildren =
                          subItem.items && subItem.items.length > 0;

                        // If the subItem has its own children, render a nested collapsible
                        if (hasNestedChildren) {
                          return (
                            <Collapsible
                              key={subItem.title}
                              asChild
                              defaultOpen={
                                subItem.isActive ||
                                subItem.items?.some(
                                  (nestedItem) => nestedItem.isActive
                                )
                              }
                              className="group/nested-collapsible w-full"
                            >
                              <SidebarMenuSubItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuSubButton
                                    data-active={subItem.isActive}
                                    className={`relative w-full flex items-center justify-between ${
                                      subItem.isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : ""
                                    }`}
                                  >
                                    <span className="truncate flex-1">
                                      {subItem.title}
                                    </span>
                                    <ChevronRight className="shrink-0 h-4 w-4 transition-transform duration-400 ease-out group-data-[state=open]/nested-collapsible:rotate-90" />
                                  </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub className="pl-4">
                                    {subItem.items?.map((nestedItem) => (
                                      <SidebarMenuSubItem
                                        key={nestedItem.title}
                                      >
                                        <SidebarMenuSubButton
                                          asChild
                                          data-active={nestedItem.isActive}
                                          className={`w-full ${
                                            nestedItem.isActive
                                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                              : ""
                                          }`}
                                        >
                                          <Link
                                            to={nestedItem.url}
                                            onClick={handleNavClick}
                                            className="w-full flex items-center justify-between"
                                          >
                                            <span className="truncate flex-1">
                                              {nestedItem.title}
                                            </span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuSubItem>
                            </Collapsible>
                          );
                        }

                        // Otherwise, render a simple item
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={subItem.isActive}
                              className={`w-full ${
                                subItem.isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : ""
                              }`}
                            >
                              <Link
                                to={subItem.url}
                                onClick={handleNavClick}
                                className="w-full flex items-center justify-between"
                              >
                                <span className="truncate flex-1">
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // If no children, render as a simple link
          return (
            <SidebarMenuItem key={navItem.title}>
              <SidebarMenuButton
                asChild
                tooltip={navItem.title}
                data-active={navItem.isActive}
                className={`w-full ${
                  navItem.isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }`}
              >
                <Link
                  to={navItem.url}
                  onClick={handleNavClick}
                  className="w-full flex items-center justify-between"
                >
                  {navItem.icon && <navItem.icon className="mr-2 shrink-0" />}
                  <span className="truncate flex-1">{navItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
