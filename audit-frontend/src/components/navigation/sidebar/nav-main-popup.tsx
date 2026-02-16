import { ChevronRight, ChevronDown, type LucideIcon } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface NavMenuItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavMenuItem[];
}

export interface NavMenuSeparator {
  type: "separator";
}

export type NavMenuItemType = NavMenuItem | NavMenuSeparator;

interface NavMainProps {
  items: NavMenuItemType[];
}

export function NavMain({ items }: NavMainProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, idx) => {
          if ("type" in item && item.type === "separator") {
            return <Separator key={`separator-${idx}`} className="my-2" />;
          }

          const navItem = item as NavMenuItem;

          const hasChildren = navItem.items && navItem.items.length > 0;

          if (hasChildren) {
            if (isCollapsed) {
              return (
                <SidebarMenuItem key={navItem.title}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        tooltip={{
                          children: navItem.title,
                          side: "top", // Position tooltip above the menu item
                          align: "center",
                          sideOffset: 5,
                        }}
                        data-active={navItem.isActive}
                        className="w-full"
                      >
                        <button className="w-full flex items-center justify-center relative">
                          {navItem.icon && (
                            <navItem.icon className="shrink-0" />
                          )}
                          <span className="truncate flex-1 group-data-[collapsible=icon]:hidden">
                            {navItem.title}
                          </span>
                          {/* Folder indicator (small arrow) in collapsed state - styled like Zoho */}
                          <span className="absolute bottom-0 right-0 size-2.5 group-data-[collapsible=icon]:block hidden">
                            <ChevronDown
                              className="h-1.5 w-1.5 shrink-0"
                              style={{ color: "#9BA2C1" }}
                            />
                          </span>
                        </button>
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="p-2 w-54 max-h-80 overflow-y-auto z-90"
                      sideOffset={10}
                    >
                      {/* Folder name header */}
                      <div className="px-3 py-1.5 mb-1 font-medium text-sm border-b border-border">
                        {navItem.title}
                      </div>
                      <div className="flex flex-col gap-1">
                        {navItem.items?.map((subItem) => {
                          const hasNestedChildren =
                            subItem.items && subItem.items.length > 0;

                          if (hasNestedChildren) {
                            return (
                              <div
                                key={subItem.title}
                                className="flex flex-col gap-1"
                              >
                                <div className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/70">
                                  {subItem.title}
                                </div>
                                {subItem.items?.map((nestedItem) => (
                                  <Link
                                    key={nestedItem.title}
                                    to={nestedItem.url}
                                    onClick={handleNavClick}
                                    className={`px-3 py-2 pl-5 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                      nestedItem.isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      {nestedItem.icon && (
                                        <nestedItem.icon className="mr-2 h-4 w-4" />
                                      )}
                                      <span>{nestedItem.title}</span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={subItem.title}
                              to={subItem.url}
                              onClick={handleNavClick}
                              className={`px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                subItem.isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
                                {subItem.icon && (
                                  <subItem.icon className="mr-2 h-4 w-4" />
                                )}
                                <span>{subItem.title}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              );
            }

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
                      tooltip={{
                        children: navItem.title,
                        side: "top",
                        align: "center",
                        sideOffset: 5,
                      }}
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
                        const hasNestedChildren =
                          subItem.items && subItem.items.length > 0;

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

          return (
            <SidebarMenuItem key={navItem.title}>
              <SidebarMenuButton
                asChild
                tooltip={{
                  children: navItem.title,
                  side: "top", // Position tooltip above the menu item
                  align: "center",
                  sideOffset: 5,
                }}
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
