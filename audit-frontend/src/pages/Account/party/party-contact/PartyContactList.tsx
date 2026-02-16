import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Edit, Plus } from "lucide-react";

import type { PartyContact } from "@/types/Account/party-contact";

import { Actions, FormModules, canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import { useTableLayout, useListPreferences } from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { usePartyContacts } from "@/hooks/api/Account/use-party-contacts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WithPermission } from "@/components/ui/with-permission";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

interface PartyContactListProps {
  partyId: string;
  onEdit?: (contact: PartyContact) => void;
  onAdd?: () => void;
  entityName?: string;
}

export const PartyContactList: React.FC<PartyContactListProps> = ({
  partyId,
  onEdit,
  onAdd,
  entityName = "party",
}) => {
  const onEditRef = useRef<typeof onEdit>(undefined);
  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);
  const { menuItems } = useUserRights();
  const hasEditPermission = useMemo(
    () => canAccess(menuItems, FormModules.CUSTOMER, Actions.EDIT),
    [menuItems]
  );

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const defaultColumnOrder = [
    "actions",
    "strSalutation",
    "strFirstName",
    "strLastName",
    "strEmail",
    "strPhoneNo",
    "strPhoneNo_Work",
    "strDesignation",
    "strDepartment",
    "strSkype",
    "strTwitter",
    "strFacebook",
    "strInstagram",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("partyContacts", {
      pagination: {
        pageNumber: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strFirstName",
        direction: "desc",
      },
    });

  const sortBy = sorting.columnKey || "strFirstName";
  const ascending = sorting.direction === "asc";
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
  } = useTableLayout("partyContactList", defaultColumnOrder, [], {
    actions: true,
    strSalutation: true,
    strFirstName: true,
    strLastName: true,
    strEmail: true,
    strPhoneNo: true,
    strPhoneNo_Work: true,
    strDesignation: true,
    strDepartment: true,
    strSkype: true,
    strTwitter: true,
    strFacebook: true,
    strInstagram: true,
    strCreatedByName: true,
    dtCreatedOn: true,
    strUpdatedByName: true,
    dtUpdatedOn: true,
  });

  const isNewMode = partyId === "new" || !partyId;

  const { data, isLoading } = usePartyContacts({
    strPartyGUID: isNewMode ? "" : partyId,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy,
    ascending: ascending,
    enabled: !!partyId,
  });

  const effectiveIsLoading = isNewMode ? false : isLoading;

  useEffect(() => {
    if (!data) return;

    const {
      pageNumber: serverPageNumber,
      pageSize: serverPageSize,
      totalRecords: totalCount,
      totalPages,
    } = data;

    // Only update pagination if server values differ from client
    const needsPaginationUpdate =
      (serverPageNumber && serverPageNumber !== pagination.pageNumber) ||
      (serverPageSize && serverPageSize !== pagination.pageSize);

    if (needsPaginationUpdate) {
      setPagination({
        pageNumber: serverPageNumber,
        pageSize: serverPageSize,
      });
      return; // Return early to avoid double update
    }

    const computedTotalPages =
      totalCount !== undefined && serverPageSize
        ? Math.ceil(totalCount / serverPageSize)
        : undefined;

    const finalTotalPages =
      (computedTotalPages && computedTotalPages > 0
        ? computedTotalPages
        : undefined) ?? (totalPages && totalPages > 0 ? totalPages : undefined);

    updateResponseData({
      totalCount,
      totalPages: finalTotalPages,
      totalRecords: totalCount,
    });
  }, [
    data,
    partyId,
    updateResponseData,
    pagination.pageNumber,
    pagination.pageSize,
    setPagination,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination({
        pageNumber: page,
      });
    },
    [setPagination]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPagination({
        pageSize: size,
        pageNumber: 1,
      });
    },
    [setPagination]
  );

  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSorting({
          direction: ascending ? "desc" : "asc",
        });
      } else {
        setSorting({
          columnKey: column,
          direction: "asc",
        });
      }
      setPagination({
        pageNumber: 1,
      });
    },
    [sortBy, ascending, setSorting, setPagination]
  );

  const handleEdit = useCallback((contact: PartyContact) => {
    onEditRef.current?.(contact);
  }, []);

  const columns = useMemo<DataTableColumn<PartyContact>[]>(() => {
    const baseColumns: DataTableColumn<PartyContact>[] = [
      {
        key: "strSalutation",
        header: "Salutation",
        width: "100px",
        sortable: true,
        cell: (contact) => <span>{contact.strSalutation || "-"}</span>,
      },
      {
        key: "strFirstName",
        header: "First Name",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strFirstName}</span>,
      },
      {
        key: "strLastName",
        header: "Last Name",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strLastName || "-"}</span>,
      },
      {
        key: "strEmail",
        header: "Email",
        width: "200px",
        sortable: true,
        cell: (contact) => (
          <span className="truncate max-w-50">{contact.strEmail || "-"}</span>
        ),
      },
      {
        key: "strPhoneNo",
        header: "Phone",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strPhoneNo || "-"}</span>,
      },
      {
        key: "strPhoneNo_Work",
        header: "Work Phone",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strPhoneNo_Work || "-"}</span>,
      },
      {
        key: "strDesignation",
        header: "Designation",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strDesignation || "-"}</span>,
      },
      {
        key: "strDepartment",
        header: "Department",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strDepartment || "-"}</span>,
      },
      {
        key: "strSkype",
        header: "Skype",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strSkype || "-"}</span>,
      },
      {
        key: "strTwitter",
        header: "Twitter",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strTwitter || "-"}</span>,
      },
      {
        key: "strFacebook",
        header: "Facebook",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strFacebook || "-"}</span>,
      },
      {
        key: "strInstagram",
        header: "Instagram",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strInstagram || "-"}</span>,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strCreatedByName || "-"}</span>,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "150px",
        sortable: true,
        cell: (contact) => (
          <span>
            {contact.dtCreatedOn
              ? format(new Date(contact.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </span>
        ),
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        sortable: true,
        cell: (contact) => <span>{contact.strUpdatedByName || "-"}</span>,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "150px",
        sortable: true,
        cell: (contact) => (
          <span>{format(contact.dtUpdatedOn, "MMM d, yyyy, h:mm a")}</span>
        ),
      },
    ];

    if (hasEditPermission) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (contact) => (
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(contact)}
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [hasEditPermission, handleEdit]);

  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <Card className="mt-6 shadow-none border-none rounded-xl overflow-hidden transition-all duration-200">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {entityName.charAt(0).toUpperCase() + entityName.slice(1)} Contacts
          </h3>
          <WithPermission module={FormModules.CUSTOMER} action={Actions.EDIT}>
            <Button
              type="button"
              onClick={onAdd}
              size="sm"
              disabled={isNewMode}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </WithPermission>
        </div>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search contacts..."
            onSearchChange={setDebouncedSearch}
            className="max-w-full sm:max-w-md flex-1"
          />

          <div className="h-9">
            <DraggableColumnVisibility
              columns={orderedColumns}
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
                  "partyContactList_column_order",
                  JSON.stringify(order)
                );
              }}
              onResetAll={resetAll}
            />
          </div>
        </div>

        {effectiveIsLoading ? (
          <TableSkeleton
            columns={[
              "Salutation",
              "First Name",
              "Last Name",
              "Email",
              "Phone",
              "Work Phone",
              "Designation",
              "Department",
              "Actions",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <div className="rounded-md overflow-hidden shadow-md">
            <DataTable
              data={isNewMode ? [] : data?.data || []}
              columns={orderedColumns.filter(
                (col) => columnVisibility[col.key] !== false
              )}
              keyExtractor={(item) => item.strParty_ContactGUID}
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              pinnedColumns={pinnedColumns}
              isTextWrapped={isTextWrapped}
              loading={effectiveIsLoading}
              sortBy={sortBy}
              ascending={ascending}
              onSort={handleSort}
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: pagination.totalCount || 0,
                totalPages: pagination.totalPages || 0,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem(
                  "partyContactList_column_widths",
                  JSON.stringify(widths)
                );
              }}
              maxHeight="calc(100vh - 350px)"
              pageSizeOptions={[5, 10, 20, 50]}
              emptyState={
                <div className="py-4">
                  {isNewMode
                    ? `Save the ${entityName} first to add contacts`
                    : `No contacts found for this ${entityName}.`}
                </div>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartyContactList;
