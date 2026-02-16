"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  LogOut,
  User as UserIcon,
  FileText,
  Palette,
} from "lucide-react";
import { getIconByName } from "@/lib/icon-map";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthContext, useUserRights } from "@/hooks";
import { useUser } from "@/hooks/api/central/use-users";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import { getImagePath } from "@/lib/utils";
import { getInitials } from "@/lib/task/task";
import { ThemeToggle } from "@/components/shared/theme-switcher";

export function NavUser() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { user: authUser, logout } = useAuthContext();
  const { isSwitchingModule, isSwitchingOrg } = useContextSwitches();
  const [themeOpen, setThemeOpen] = React.useState(false);
  // Only call useUser API if not a superadmin
  const { data: user } = useUser(
    authUser?.bolIsSuperAdmin ? undefined : authUser?.strUserGUID
  );
  const { getUserbarMenuItems, isLoading: rightsLoading } = useUserRights();

  // Determine which user object to use - authUser for superadmin, otherwise user
  const activeUser = authUser?.bolIsSuperAdmin ? authUser : user;

  // We'll use these values with fallbacks to handle the case where user is null/undefined
  const isLoading =
     isSwitchingModule || isSwitchingOrg;
  const userName = activeUser?.strName || (isLoading ? "Loading..." : "User");
  const userEmail =
    activeUser?.strEmailId || (isLoading ? "Loading..." : "No email");
  const userAvatar = activeUser?.strProfileImg
    ? getImagePath(activeUser.strProfileImg)
    : "";

  const userInitials = getInitials(userName);

  const handleLogout = () => {
    logout();
  };

  // Close mobile sidebar when a link is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Get userbar menu items for the dropdown
  const userbarMenuItems = getUserbarMenuItems();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <SidebarMenuButton
              size="lg"
              disabled={isLoading}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-tour="user-settings"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className={`truncate font-medium ${
                    isLoading ? "text-muted-foreground animate-pulse" : ""
                  }`}
                >
                  {userName}
                </span>
                <span
                  className={`truncate text-xs ${
                    isLoading ? "text-muted-foreground animate-pulse" : ""
                  }`}
                >
                  {userEmail}
                </span>
              </div>
              <ChevronsUpDown
                className={`ml-auto size-4 ${isLoading ? "opacity-50" : ""}`}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            data-tour="user-settings-content"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span
                    className={`truncate font-medium ${
                      isLoading ? "text-muted-foreground animate-pulse" : ""
                    }`}
                  >
                    {userName}
                  </span>
                  <span
                    className={`truncate text-xs ${
                      isLoading ? "text-muted-foreground animate-pulse" : ""
                    }`}
                  >
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className=" border-border" />
            <DropdownMenuGroup>
              {/* Default Profile link that always appears */}
              <DropdownMenuItem asChild onClick={handleNavClick}>
                <Link to="/profile" className="flex w-full items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              {/* Render dynamic userbar menu items */}
              {!rightsLoading &&
                userbarMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.strMapKey}
                    asChild
                    onClick={handleNavClick}
                  >
                    <Link
                      to={item.strPath}
                      className="flex w-full items-center"
                    >
                      {React.createElement(
                        getIconByName(item.strIconName) || FileText,
                        {
                          className: "mr-2 h-4 w-4",
                        }
                      )}
                      {item.strName}
                    </Link>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setThemeOpen(true)} data-tour="theme-switcher">
              <Palette className="mr-2 h-4 w-4" />
              Customize Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 hover:text-red-600 data-highlighted:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4 text-red-600 group-hover:text-red-600" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle open={themeOpen} onOpenChange={setThemeOpen} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
