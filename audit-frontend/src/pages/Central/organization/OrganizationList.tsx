import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { Edit, Plus, Building, Users, Filter } from "lucide-react";

import {
  useOrganizations,
  useActiveOrganizations,
  useExportOrganizations,
} from "@/hooks/api";
import { useUserRights } from "@/hooks";
import { useActiveIndustries } from "@/hooks/api/central/use-industries";
import { useActiveLegalStatusTypes } from "@/hooks/api/central/use-legal-status-types";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

import { Actions, ListModules, FormModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import type { Organization } from "@/types/central/organization";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { WithPermission } from "@/components/ui/with-permission";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import { AvatarImage } from "@/components/ui/avatar-image";
import { ExportButton } from "@/components/ui/export-button";
import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OrganizationList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon(ListModules.ORGANIZATION, Building);

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("organization", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strOrganizationName",
        direction: "asc",
      },
    });

  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [legalStatusFilter, setLegalStatusFilter] = useState<string[]>([]);
  const [parentOrgFilter, setParentOrgFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    industry: false,
    legalStatus: false,
    parentOrg: false,
  });

  const defaultColumnOrder = [
    "actions",
    "manage",
    "logo",
    "strOrganizationName",
    "strOrganizationCode",
    "strIndustryName",
    "strLegalStatusTypeName",
    "bolIsActive",
    "createdBy",
    "createdOn",
  ];

  const { data: industries = [], isLoading: isIndustryLoading } =
    useActiveIndustries(undefined, dropdownOpen.industry);
  const { data: legalStatusTypes = [], isLoading: isLegalStatusLoading } =
    useActiveLegalStatusTypes(undefined, dropdownOpen.legalStatus);

  const { data: activeOrganizations = [], isLoading: isParentOrgLoading } =
    useActiveOrganizations({ enabled: dropdownOpen.parentOrg });

  const industryOptions = useMemo(() => {
    return industries.map((industry) => ({
      value: industry.strIndustryGUID,
      label: industry.strName || "Unnamed Industry",
    }));
  }, [industries]);

  const legalStatusOptions = useMemo(() => {
    return legalStatusTypes.map((legalStatus) => ({
      value: legalStatus.strLegalStatusTypeGUID,
      label: legalStatus.strName || "Unnamed Legal Status Type",
    }));
  }, [legalStatusTypes]);

  const exportOrganizations = useExportOrganizations();

  const {
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    isTextWrapped,
    toggleTextWrapping,
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout("organization", defaultColumnOrder, ["actions"]);

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const { data: organizationsResponse, isLoading: loading } = useOrganizations({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sorting.columnKey || "strOrganizationName",
    ascending: sorting.direction === "asc",
    strIndustryGUID: industryFilter.length > 0 ? industryFilter[0] : undefined,
    strLegalStatusTypeGUID:
      legalStatusFilter.length > 0 ? legalStatusFilter[0] : undefined,
    strParentOrganizationGUID:
      parentOrgFilter.length > 0 ? parentOrgFilter[0] : undefined,
  });

  const organizations = useMemo(() => {
    if (!organizationsResponse || !organizationsResponse.data) {
      return [];
    }

    if (Array.isArray(organizationsResponse.data.items)) {
      return organizationsResponse.data.items;
    }

    return [];
  }, [organizationsResponse]);

  useEffect(() => {
    if (organizationsResponse?.data) {
      updateResponseData({
        totalCount: organizationsResponse.data.totalCount || 0,
        totalPages: organizationsResponse.data.totalPages || 0,
      });
    }
  }, [organizationsResponse, updateResponseData]);

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
  };

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<Organization>[] = [];

    if (canAccess(menuItems, FormModules.ORGANIZATION, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "80px",
        cell: (org: Organization) => (
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/organization/${org.strOrganizationGUID}`);
              }}
              title="Edit organization"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
      });
    }

    baseColumns.push({
      key: "manage",
      header: "Manage Teams",
      width: "140px",
      cell: (org: Organization) => (
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/organization-team?organizationId=${org.strOrganizationGUID}`
              );
            }}
            title="Manage teams"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      ),
    });

    baseColumns.push({
      key: "logo",
      header: "Logo",
      width: "70px",
      cell: (org: Organization) => (
        <div className="flex items-center">
          <AvatarImage
            imagePath={org.strLogo}
            alt={`${org.strOrganizationName} logo`}
            size="md"
            type="organization"
          />
        </div>
      ),
    });

    baseColumns.push({
      key: "strOrganizationName",
      header: "Organization Name",
      width: "200px",
      cell: (org: Organization) => (
        <div className={getTextClass()} title={org.strOrganizationName}>
          <span className="font-medium">{org.strOrganizationName}</span>
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "bolIsActive",
      header: "Status",
      width: "120px",
      cell: (org: Organization) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            org.bolIsActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {org.bolIsActive ? "Active" : "Inactive"}
        </span>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "strUDFCode",
      header: "Code",
      width: "130px",
      cell: (org: Organization) => (
        <div className={getTextClass()} title={org.strUDFCode || "-"}>
          {org.strUDFCode || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "strDescription",
      header: "Description",
      width: "220px",
      cell: (org: Organization) => (
        <div className={getTextClass()} title={org.strDescription || "-"}>
          {org.strDescription || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push(
      {
        key: "strPAN",
        header: "PAN",
        width: "150px",
        cell: (org: Organization) => (
          <div className={getTextClass()} title={org.strPAN || "-"}>
            {org.strPAN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTAN",
        header: "TAN",
        width: "150px",
        cell: (org) => (
          <div className={getTextClass()} title={org.strTAN || "-"}>
            {org.strTAN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCIN",
        header: "CIN",
        width: "180px",
        cell: (org) => (
          <div className={getTextClass()} title={org.strCIN || "-"}>
            {org.strCIN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strParentOrganizationName",
        header: "Parent Organization",
        width: "250px",
        cell: (org) => (
          <div
            className={getTextClass()}
            title={org.strParentOrganizationName || "-"}
          >
            {org.strParentOrganizationName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strIndustryCodeName",
        header: "Industry",
        width: "180px",
        cell: (org) => {
          const industryName = org.strIndustryCodeName || "-";
          return (
            <div className={getTextClass()} title={industryName}>
              {industryName}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strLegalStatusCodeName",
        header: "Legal Status",
        width: "190px",
        cell: (org) => {
          const legalStatusName = org.strLegalStatusCodeName || "-";
          return (
            <div className={getTextClass()} title={legalStatusName}>
              {legalStatusName}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "150px",
        cell: (org) => {
          const currencyTypeName = org.strCurrencyTypeName || "-";
          return (
            <div className={getTextClass()} title={currencyTypeName}>
              {currencyTypeName}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dtClientAcquiredDate",
        header: "Acquired Date",
        width: "180px",
        cell: (org) => (
          <div
            className={getTextClass()}
            title={
              org.dtClientAcquiredDate
                ? formatDate(org.dtClientAcquiredDate)
                : "-"
            }
          >
            {org.dtClientAcquiredDate
              ? formatDate(org.dtClientAcquiredDate)
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedBy",
        header: "Created By",
        width: "180px",
        cell: (org) => (
          <div className={getTextClass()} title={org.strCreatedBy || "-"}>
            {org.strCreatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "220px",
        cell: (org) => (
          <div
            className={getTextClass()}
            title={org.dtCreatedOn ? formatDate(org.dtCreatedOn, true) : "-"}
          >
            {org.dtCreatedOn ? formatDate(org.dtCreatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedBy",
        header: "Updated By",
        width: "180px",
        cell: (org) => (
          <div className={getTextClass()} title={org.strUpdatedBy || "-"}>
            {org.strUpdatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "220px",
        cell: (org) => (
          <div
            className={getTextClass()}
            title={org.dtUpdatedOn ? formatDate(org.dtUpdatedOn, true) : "-"}
          >
            {org.dtUpdatedOn ? formatDate(org.dtUpdatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [openEditInNewTab, navigate, menuItems, isTextWrapped]);

  // Apply column ordering
  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      // If a column is not in columnOrder, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title="Organizations"
        description="Manage your organization information"
        icon={HeaderIcon}
        actions={
          <>
            <ExportButton exportMutation={exportOrganizations} />

            <WithPermission
              module={FormModules.ORGANIZATION}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/organization/new")}
                className="h-9 flex items-center w-full sm:w-auto"
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                <span className="text-sm">Add Organization</span>
              </Button>
            </WithPermission>
          </>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search by name, code, PAN, etc..."
            onSearchChange={setDebouncedSearch}
            debounceDelay={500}
            className="max-w-full sm:max-w-md sm:flex-1"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(industryFilter.length > 0 ||
                legalStatusFilter.length > 0 ||
                parentOrgFilter.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {industryFilter.length +
                    legalStatusFilter.length +
                    parentOrgFilter.length}
                </span>
              )}
            </Button>

            <div className="h-9">
              <DraggableColumnVisibility
                columns={columns}
                columnVisibility={columnVisibility}
                toggleColumnVisibility={toggleColumnVisibility}
                resetColumnVisibility={resetColumnVisibility}
                hasVisibleContentColumns={hasVisibleContentColumns}
                getAlwaysVisibleColumns={getAlwaysVisibleColumns}
                isTextWrapped={isTextWrapped}
                toggleTextWrapping={toggleTextWrapping}
                pinnedColumns={pinnedColumns}
                pinColumn={pinColumn}
                unpinColumn={unpinColumn}
                resetPinnedColumns={resetPinnedColumns}
                onColumnOrderChange={(order) => {
                  setColumnOrder(order);
                  localStorage.setItem(
                    "organization_column_order",
                    JSON.stringify(order)
                  );
                }}
                onResetAll={() => {
                  resetAll();
                }}
              />
            </div>
          </div>
        </div>

        <div
          className={`transform transition-all duration-300 ease-in-out ${
            showFilters
              ? "opacity-100 max-h-250"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>
                Filter organizations by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Industry
                  </label>
                  <MultiSelect
                    options={industryOptions}
                    selectedValues={industryFilter}
                    initialMessage=""
                    onChange={(values) => {
                      setIndustryFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select industries..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        industry: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.industry && isIndustryLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Legal Status
                  </label>
                  <MultiSelect
                    options={legalStatusOptions}
                    selectedValues={legalStatusFilter}
                    initialMessage=""
                    onChange={(values) => {
                      setLegalStatusFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select legal status..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        legalStatus: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.legalStatus && isLegalStatusLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parent Organization
                  </label>
                  <MultiSelect
                    options={activeOrganizations.map((org: Organization) => ({
                      value: org.strOrganizationGUID,
                      label: org.strOrganizationName,
                    }))}
                    selectedValues={parentOrgFilter}
                    initialMessage=""
                    onChange={(values) => {
                      setParentOrgFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select parent organizations..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        parentOrg: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.parentOrg && isParentOrgLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIndustryFilter([]);
                    setLegalStatusFilter([]);
                    setParentOrgFilter([]);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    industryFilter.length === 0 &&
                    legalStatusFilter.length === 0 &&
                    parentOrgFilter.length === 0
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {loading ? (
        <TableSkeleton
          columns={[
            "Actions",
            "Logo",
            "Name",
            "Code",
            "PAN",
            "TAN",
            "CIN",
            "Industry",
            "Legal Status",
            "Parent Group",
            "Created On",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={organizations}
          columns={orderedColumns}
          keyExtractor={(org) => org.strOrganizationGUID}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sorting.columnKey || ""}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "organization_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No organizations found matching "{debouncedSearch}".</>
            ) : (
              <>
                No organizations found. Click "Add Organization" to create one.
              </>
            )
          }
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 1,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          maxHeight="calc(100vh - 350px)"
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </CustomContainer>
  );
};

export default OrganizationList;
