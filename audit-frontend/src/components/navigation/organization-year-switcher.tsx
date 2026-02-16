import {
  ChevronsUpDown,
  Building,
  Search,
  Check,
  CalendarDays,
} from "lucide-react";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { yearService } from "@/services/central/year.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuthContext } from "@/hooks";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import {
  useSwitchOrganization,
  useUserOrganizations,
} from "@/hooks/api/central/use-organizations";
import { useYearsByOrganization } from "@/hooks/api/central/use-years";
import {
  OrganizationYearSwitcherSkeleton,
  OrganizationYearSwitcherErrorSkeleton,
  OrganizationYearSwitcherEmptySkeleton,
  YearsLoadingSkeleton,
  EmptyStateSkeleton,
} from "@/components/data-display/skeleton/organization-year-switcher-skeleton";
import type { UserOrganization } from "@/types/central/organization";
import type { YearSimple } from "@/types/central/year";
import { getImagePath } from "@/lib/utils";
import { Input } from "../ui/input";

export function OrganizationYearSwitcher() {
  const { isMobile } = useSidebar();
  const { user } = useAuthContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { mutateAsync: switchOrganization } = useSwitchOrganization();
  const { isSwitchingContext: isSwitching } = useContextSwitches();

  const {
    data: organizations = [],
    isLoading,
    error,
  } = useUserOrganizations({
    enabled: isDropdownOpen,
  });

  const [activeOrganization, setActiveOrganization] =
    useState<UserOrganization | null>(null);
  const [activeYear, setActiveYear] = useState<YearSimple | null>(null);

  const { data: years = [], isLoading: isLoadingYears } =
    useYearsByOrganization(activeOrganization?.strOrganizationGUID, {
      enabled: isDropdownOpen,
    });

  useEffect(() => {
    if (user?.bolIsSuperAdmin) {
      return;
    }

    if (
      organizations.length > 0 &&
      !activeOrganization &&
      user?.strLastOrganizationGUID
    ) {
      const lastOrgId = user?.strLastOrganizationGUID;
      const lastSelectedOrg = organizations.find(
        (org: { strOrganizationGUID: string }) =>
          org.strOrganizationGUID === lastOrgId
      );

      if (lastSelectedOrg) {
        setActiveOrganization(lastSelectedOrg);
      }
    }
  }, [organizations, user, activeOrganization]);

  useEffect(() => {
    if (years.length === 0 || activeYear) {
      return;
    }

    if (user?.strLastYearGUID) {
      const lastYearMatch = years.find(
        (y) => y.strYearGUID === user.strLastYearGUID
      );
      if (lastYearMatch) {
        setActiveYear(lastYearMatch);
        return;
      }
    }

    setActiveYear(years[0]);
  }, [years, activeYear, user?.strLastYearGUID]);

  const switchToOrganizationAndYear = useCallback(
    async (org: UserOrganization, year: YearSimple): Promise<boolean> => {
      await switchOrganization({
        organizationId: org.strOrganizationGUID,
        yearId: year.strYearGUID,
      });

      setActiveOrganization(org);
      setActiveYear(year);

      return true;
    },
    [switchOrganization]
  );

  const [tempSelectedOrg, setTempSelectedOrg] =
    useState<UserOrganization | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: tempOrgYears = [],
    isLoading: isLoadingTempOrgYears,
    isFetching: isFetchingTempOrgYears,
  } = useQuery({
    queryKey: ["yearsByOrganization", tempSelectedOrg?.strOrganizationGUID],
    queryFn: () =>
      tempSelectedOrg
        ? yearService.getYearsByOrganization(
            tempSelectedOrg.strOrganizationGUID
          )
        : Promise.resolve([]),
    enabled: !!tempSelectedOrg && isDropdownOpen,
  });

  const displayYears = tempSelectedOrg ? tempOrgYears : years;

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    return organizations.filter((org: UserOrganization) =>
      org.strOrganizationName.toLowerCase().includes(lowercasedQuery)
    );
  }, [organizations, searchQuery]);

  const handleDropdownToggle = (open: boolean) => {
    setIsDropdownOpen(open);

    if (!open) {
      setTempSelectedOrg(null);
    }
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
    },
    []
  );

  const handleOrganizationSelect = useCallback(
    (org: UserOrganization) => {
      setTempSelectedOrg(org);

      if (organizations.length === 1 && years.length === 1) {
        setActiveOrganization(org);
        switchToOrganizationAndYear(org, years[0]);
        setTempSelectedOrg(null);
        setIsDropdownOpen(false);
      }
    },
    [
      organizations.length,
      years,
      setActiveOrganization,
      switchToOrganizationAndYear,
      setIsDropdownOpen,
    ]
  );

  const handleYearSelect = useCallback(
    async (year: YearSimple) => {
      const orgToUse = tempSelectedOrg || activeOrganization;

      if (!orgToUse) {
        return;
      }

      if (
        year.strYearGUID === activeYear?.strYearGUID &&
        orgToUse.strOrganizationGUID === activeOrganization?.strOrganizationGUID
      ) {
        setIsDropdownOpen(false);
        return;
      }

      setIsDropdownOpen(false);
      setTempSelectedOrg(null);

      if (tempSelectedOrg) {
        setActiveOrganization(orgToUse);
      }

      await switchToOrganizationAndYear(orgToUse, year);
    },
    [
      activeOrganization,
      activeYear,
      tempSelectedOrg,
      switchToOrganizationAndYear,
      setActiveOrganization,
      setIsDropdownOpen,
    ]
  );

  if (isLoading) {
    return <OrganizationYearSwitcherSkeleton />;
  }

  if (error) {
    return <OrganizationYearSwitcherErrorSkeleton />;
  }

  if (
    (isDropdownOpen && organizations.length === 0) ||
    !user?.strLastOrganizationName
  ) {
    return (
      <OrganizationYearSwitcherEmptySkeleton
        isSuperAdmin={user?.bolIsSuperAdmin}
      />
    );
  }

  return (
    <SidebarMenu>
      <div className="relative">
        <SidebarMenuItem>
          <div ref={dropdownRef} data-tour="organization-switcher">
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={handleDropdownToggle}
            >
              <DropdownMenuTrigger asChild disabled={isSwitching || isLoading}>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  disabled={isSwitching || isLoading}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {user?.strLastOrganizationLogo ? (
                      <AvatarImage
                        src={getImagePath(user.strLastOrganizationLogo)}
                        alt={
                          user.strLastOrganizationName || "Organization logo"
                        }
                        className="rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : user?.strGroupLogo ? (
                      <AvatarImage
                        src={getImagePath(user.strGroupLogo)}
                        alt={user.strGroupName || "Group logo"}
                        className="rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                      <Building className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 tex t-left text-sm leading-tight">
                    <span
                      className="truncate font-medium"
                      title={
                        user?.strLastOrganizationName ||
                        activeOrganization?.strOrganizationName
                      }
                    >
                      {isSwitching ? (
                        <span className="text-muted-foreground animate-pulse">
                          Switching...
                        </span>
                      ) : (
                        user?.strLastOrganizationName || "Select Organization"
                      )}
                    </span>
                    <span
                      className={`truncate text-xs ${
                        isSwitching ? "text-muted-foreground animate-pulse" : ""
                      }`}
                    >
                      {user?.strGroupName + " (Group)" || "Group"}
                    </span>
                  </div>
                  <ChevronsUpDown
                    className={`ml-auto size-4 ${
                      isSwitching ? "opacity-50" : ""
                    }`}
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-[320px] max-w-[90vw] rounded-lg p-0 relative"
                align="start"
                side={isMobile ? "bottom" : "right"}
                sideOffset={4}
                data-tour="organization-switcher-content"
              >
                {/* Organizations Panel */}
                <div className="w-full">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-3 py-2.5 text-left text-sm">
                      <Building className="size-3.5" />
                      <span className="truncate font-medium">
                        Organizations
                      </span>
                      {organizations.length > 0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                          {organizations.length}{" "}
                          {organizations.length === 1 ? "org" : "orgs"}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <div className="p-2">
                    <div className="relative lor flex items-center">
                      <div className="absolute left-2 top-0 bottom-0 flex items-center">
                        <Search className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-8 h-7 text-sm bg-card border-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto p-1">
                    {filteredOrganizations.length === 0 &&
                      searchQuery.trim() !== "" && (
                        <EmptyStateSkeleton
                          icon="search"
                          title="No results found"
                          description="No organizations match your search"
                        />
                      )}
                    {filteredOrganizations.length === 0 &&
                      searchQuery.trim() === "" && (
                        <EmptyStateSkeleton
                          icon="building"
                          title="No organizations"
                          description="You don't have access to any organizations"
                        />
                      )}
                    {filteredOrganizations.map((org: UserOrganization) => {
                      const isSelected = tempSelectedOrg
                        ? org.strOrganizationGUID ===
                          tempSelectedOrg.strOrganizationGUID
                        : org.strOrganizationGUID ===
                          activeOrganization?.strOrganizationGUID;

                      return (
                        <DropdownMenuItem
                          key={org.strOrganizationGUID}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOrganizationSelect(org);
                          }}
                          className={`flex w-full items-center hover:bg-primary/10 hover:text-foreground ${
                            isSelected ? "bg-muted/60" : ""
                          }`}
                        >
                          <Building className="mr-2 h-4 w-4" />
                          <span className={isSelected ? "font-medium" : ""}>
                            {org.strOrganizationName}
                          </span>
                          {isSelected && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`bg-sidebar shadow-lg rounded-lg border border-border-color min-w-50 z-9999 ${
                    isMobile ? "relative mt-2" : "fixed ml-80 top-15"
                  }`}
                >
                  <div className="px-3 py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div className="text-sm font-medium">Years</div>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-auto p-1">
                    {!activeOrganization && !tempSelectedOrg ? (
                      <EmptyStateSkeleton
                        icon="building"
                        title="Organization needed"
                        description="Select an organization to view available years"
                      />
                    ) : (tempSelectedOrg &&
                        (isLoadingTempOrgYears || isFetchingTempOrgYears)) ||
                      (isLoadingYears && !tempSelectedOrg) ? (
                      <div className="flex items-center justify-center py-4">
                        <YearsLoadingSkeleton />
                      </div>
                    ) : displayYears.length > 0 ? (
                      <div className="space-y-1">
                        {displayYears.map((year) => (
                          <DropdownMenuItem
                            key={year.strYearGUID}
                            onClick={() => handleYearSelect(year)}
                            className={`flex w-full items-center hover:bg-primary/10 hover:text-foreground ${
                              year.strYearGUID === activeYear?.strYearGUID
                                ? "bg-muted/60"
                                : ""
                            }`}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span
                              className={
                                year.strYearGUID === activeYear?.strYearGUID
                                  ? "font-medium"
                                  : ""
                              }
                            >
                              {year.strName}
                            </span>
                            {year.strYearGUID === activeYear?.strYearGUID && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <EmptyStateSkeleton
                        icon="calendar"
                        title="No years available"
                        description={`No years found for ${
                          tempSelectedOrg
                            ? tempSelectedOrg.strOrganizationName
                            : activeOrganization?.strOrganizationName ||
                              "this organization"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      </div>
    </SidebarMenu>
  );
}
