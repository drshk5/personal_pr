import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  Contact,
  Upload,
  Download,
  Archive,
  RotateCcw,
} from "lucide-react";

import type { ContactListDto, ContactFilterParams } from "@/types/CRM/contact";
import { CONTACT_LIFECYCLE_STAGES } from "@/types/CRM/contact";
import {
  useContacts,
  useDeleteContact,
  useExportContacts,
  useBulkArchiveContacts,
  useBulkRestoreContacts,
} from "@/hooks/api/CRM/use-contacts";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { Actions, FormModules, ListModules, canAccess } from "@/lib/permissions";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-tables/DataTable";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { toast } from "sonner";
import { communicationService } from "@/services/CRM/communication.service";
import { BulkRecipientEmailModal } from "@/components/CRM/BulkRecipientEmailModal";

import ContactLifecycleBadge from "./components/ContactLifecycleBadge";
import ContactImportDialog from "./components/ContactImportDialog";

const defaultColumnOrder = [
  "select",
  "actions",
  "strName",
  "strEmail",
  "strPhone",
  "strJobTitle",
  "strAccountName",
  "strLifecycleStage",
  "strAssignedToName",
  "dtCreatedOn",
  "bolIsActive",
];

const ContactList: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_CONTACT, Contact);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filters
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterLifecycleStage, setFilterLifecycleStage] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<string>("");
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ContactListDto | null>(null);
  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact();
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const { mutate: bulkArchiveContacts, isPending: isBulkArchiving } =
    useBulkArchiveContacts();
  const { mutate: bulkRestoreContacts, isPending: isBulkRestoring } =
    useBulkRestoreContacts();
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);

  // Import / Export
  const [showImport, setShowImport] = useState(false);
  const { mutate: exportContacts, isPending: isExporting } = useExportContacts();

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-contacts", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dtCreatedOn",
        direction: "desc",
      },
    });

  // Table layout
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
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout("crm-contacts", defaultColumnOrder, ["select", "actions"]);

  // Sort mapping
  const sortBy = sorting.columnKey || "dtCreatedOn";
  const ascending = sorting.direction === "asc";

  // Build filter params
  const filterParams: ContactFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strLifecycleStage: filterLifecycleStage === "all" ? undefined : filterLifecycleStage || undefined,
      strAssignedToGUID: filterAssignedTo === "all" ? undefined : filterAssignedTo || undefined,
      bolIsActive:
        filterIsActive === "all" || filterIsActive === "" ? undefined : filterIsActive === "true",
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      filterLifecycleStage,
      filterAssignedTo,
      filterIsActive,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Data fetch
  const { data: contactsResponse, isLoading } = useContacts(filterParams);
  const { data: users } = useModuleUsers();

  const userMap = useMemo(() => {
    if (!users) return new Map<string, string>();
    return new Map(users.map((u) => [u.strUserGUID, u.strName]));
  }, [users]);

  // Map response to standardized format
  const pagedData = useMemo(() => {
    if (!contactsResponse)
      return { items: [] as ContactListDto[], totalCount: 0, totalPages: 0 };
    return mapToStandardPagedResponse<ContactListDto>(
      contactsResponse.data ?? contactsResponse
    );
  }, [contactsResponse]);

  // Update pagination totals from response
  React.useEffect(() => {
    if (pagedData.totalCount > 0) {
      updateResponseData({
        totalCount: pagedData.totalCount,
        totalPages: pagedData.totalPages,
      });
    }
  }, [pagedData.totalCount, pagedData.totalPages, updateResponseData]);

  // Active filter count
  const activeFilterCount = [filterLifecycleStage, filterIsActive, filterAssignedTo].filter(
    (v) => v !== ""
  ).length;

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterLifecycleStage("");
    setFilterIsActive("");
    setFilterAssignedTo("");
  }, []);

  // Handle sort
  const handleSort = useCallback(
    (column: string) => {
      setSorting({
        columnKey: column,
        direction:
          sorting.columnKey === column && sorting.direction === "asc"
            ? "desc"
            : "asc",
      });
    },
    [sorting, setSorting]
  );

  // Navigate in same tab
  const openEditInSameTab = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Handle delete
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteContact(
      { id: deleteTarget.strContactGUID },
      {
        onSettled: () => setDeleteTarget(null),
      }
    );
  };

  const handleExport = () => {
    exportContacts({ params: filterParams });
  };

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setIndeterminate(false);
      setSelectAll(checked);
      if (checked) {
        const next: Record<string, boolean> = {};
        pagedData.items.forEach((contact) => {
          next[contact.strContactGUID] = true;
        });
        setSelectedRows(next);
      } else {
        setSelectedRows({});
      }
    },
    [pagedData.items]
  );

  useEffect(() => {
    const selectedCount = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    ).length;
    if (pagedData.items.length > 0) {
      if (selectedCount === pagedData.items.length) {
        setSelectAll(true);
        setIndeterminate(false);
      } else if (selectedCount > 0) {
        setSelectAll(false);
        setIndeterminate(true);
      } else {
        setSelectAll(false);
        setIndeterminate(false);
      }
    }
  }, [pagedData.items, selectedRows]);

  const selectedContactIds = useMemo(
    () => Object.keys(selectedRows).filter((id) => selectedRows[id]),
    [selectedRows]
  );
  const selectedContactEmails = useMemo(() => {
    const selectedSet = new Set(selectedContactIds);
    return pagedData.items
      .filter((contact) => selectedSet.has(contact.strContactGUID))
      .map((contact) => contact.strEmail?.trim())
      .filter((email): email is string => !!email);
  }, [pagedData.items, selectedContactIds]);
  const selectedItemsCount = selectedContactIds.length;

  const handleBulkEmail = useCallback(async () => {
    const recipients = Array.from(new Set(selectedContactEmails));
    if (recipients.length === 0) {
      toast.error("No valid email addresses found in selected contacts");
      return;
    }
    setShowBulkEmailModal(true);
  }, [selectedContactEmails]);

  const handleSendBulkEmail = useCallback(async (payload: {
    subject: string;
    body: string;
    isHtml: boolean;
  }) => {
    const recipients = Array.from(new Set(selectedContactEmails));
    try {
      await communicationService.sendBulkEmail({
        recipients,
        subject: payload.subject,
        body: payload.body,
        isHtml: payload.isHtml,
      });
      toast.success(`Sent ${recipients.length} emails`);
      setShowBulkEmailModal(false);
      setSelectedRows({});
    } catch {
      toast.error("Failed to send emails");
    }
  }, [selectedContactEmails]);

  const handleBulkArchive = useCallback(() => {
    if (selectedItemsCount === 0) return;
    bulkArchiveContacts(
      { guids: selectedContactIds },
      { onSuccess: () => setSelectedRows({}) }
    );
  }, [bulkArchiveContacts, selectedContactIds, selectedItemsCount]);

  const handleBulkRestore = useCallback(() => {
    if (selectedItemsCount === 0) return;
    bulkRestoreContacts(
      { guids: selectedContactIds },
      { onSuccess: () => setSelectedRows({}) }
    );
  }, [bulkRestoreContacts, selectedContactIds, selectedItemsCount]);

  // Columns
  const columns: DataTableColumn<ContactListDto>[] = useMemo(
    () => [
      {
        key: "select",
        width: "50px",
        header: (
          <IndeterminateCheckbox
            checked={selectAll}
            indeterminate={indeterminate}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        ),
        cell: (item: ContactListDto) => (
          <Checkbox
            checked={!!selectedRows[item.strContactGUID]}
            onCheckedChange={() => toggleContactSelection(item.strContactGUID)}
            aria-label={`Select contact ${item.strFirstName} ${item.strLastName}`}
          />
        ),
        sortable: false,
      } as DataTableColumn<ContactListDto>,
      ...(canAccess(menuItems, FormModules.CRM_CONTACT, Actions.EDIT) ||
        canAccess(menuItems, FormModules.CRM_CONTACT, Actions.DELETE)
        ? [
          {
            key: "actions",
            header: "Actions",
            cell: (item: ContactListDto) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canAccess(
                    menuItems,
                    FormModules.CRM_CONTACT,
                    Actions.EDIT
                  ) && (
                      <DropdownMenuItem
                        onClick={() =>
                          openEditInSameTab(
                            `/crm/contacts/${item.strContactGUID}`
                          )
                        }
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                  {canAccess(
                    menuItems,
                    FormModules.CRM_CONTACT,
                    Actions.DELETE
                  ) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            sortable: false,
            width: "70px",
          } as DataTableColumn<ContactListDto>,
        ]
        : []),
      {
        key: "strName",
        header: "Name",
        cell: (item: ContactListDto) => (
          <div
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={() =>
              openEditInSameTab(`/crm/contacts/${item.strContactGUID}`)
            }
          >
            {item.strFirstName} {item.strLastName}
          </div>
        ),
        sortable: true,
        width: "200px",
      },
      {
        key: "strEmail",
        header: "Email",
        cell: (item: ContactListDto) => (
          <span className="text-sm text-foreground">{item.strEmail}</span>
        ),
        sortable: true,
        width: "220px",
      },
      {
        key: "strPhone",
        header: "Phone",
        cell: (item: ContactListDto) => (
          <span className="text-sm text-foreground">{item.strPhone || "-"}</span>
        ),
        sortable: false,
        width: "140px",
      },
      {
        key: "strJobTitle",
        header: "Job Title",
        cell: (item: ContactListDto) => (
          <span className="text-sm text-foreground">{item.strJobTitle || "-"}</span>
        ),
        sortable: true,
        width: "160px",
      },
      {
        key: "strAccountName",
        header: "Account",
        cell: (item: ContactListDto) => (
          <span className="text-sm text-foreground">{item.strAccountName || "-"}</span>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "strLifecycleStage",
        header: "Lifecycle Stage",
        cell: (item: ContactListDto) => (
          <ContactLifecycleBadge stage={item.strLifecycleStage} />
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "strAssignedToName",
        header: "Assigned To",
        cell: (item: ContactListDto) => (
          <span className="text-sm text-foreground">
            {item.strAssignedToName || userMap.get(item.strAssignedToGUID || "") || "-"}
          </span>
        ),
        sortable: true,
        width: "160px",
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item: ContactListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {item.dtCreatedOn
              ? format(new Date(item.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "bolIsActive",
        header: "Active",
        cell: (item: ContactListDto) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${item.bolIsActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
          >
            {item.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
    ],
    [
      menuItems,
      openEditInSameTab,
      userMap,
      selectAll,
      indeterminate,
      handleSelectAll,
      selectedRows,
      toggleContactSelection,
    ]
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Contacts"
        description="Manage your customer contacts"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.CRM_CONTACT}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/crm/contacts/create")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Contact
              </Button>
            </WithPermission>
          </div>
        }
      />

      {selectedItemsCount > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedItemsCount} contact{selectedItemsCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkEmail}
            >
              <Mail className="h-3.5 w-3.5 mr-1" />
              Send Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkArchive}
              disabled={isBulkArchiving || isBulkRestoring}
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              {isBulkArchiving ? "Archiving..." : "Archive"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkRestore}
              disabled={isBulkArchiving || isBulkRestoring}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {isBulkRestoring ? "Restoring..." : "Restore"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedRows({})}
              disabled={isBulkArchiving || isBulkRestoring}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <WithPermission
              module={FormModules.CRM_CONTACT}
              action={Actions.EXPORT}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </WithPermission>

            <WithPermission
              module={FormModules.CRM_CONTACT}
              action={Actions.IMPORT}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setShowImport(true)}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Import
              </Button>
            </WithPermission>

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
              }}
              onResetAll={() => resetAll()}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Lifecycle Stage
                  </label>
                  <Select
                    value={filterLifecycleStage}
                    onValueChange={setFilterLifecycleStage}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {CONTACT_LIFECYCLE_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Active Status
                  </label>
                  <Select
                    value={filterIsActive}
                    onValueChange={setFilterIsActive}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Assigned To
                  </label>
                  <Select
                    value={filterAssignedTo}
                    onValueChange={setFilterAssignedTo}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {users?.map((u) => (
                        <SelectItem key={u.strUserGUID} value={u.strUserGUID}>
                          {u.strName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Table */}
      <DataTable<ContactListDto>
        data={pagedData.items}
        columns={columns}
        keyExtractor={(item) => item.strContactGUID}
        sortBy={sortBy}
        ascending={ascending}
        onSort={handleSort}
        loading={isLoading}
        columnVisibility={columnVisibility}
        alwaysVisibleColumns={getAlwaysVisibleColumns()}
        isTextWrapped={isTextWrapped}
        pinnedColumns={pinnedColumns}
        columnWidths={columnWidths}
        onColumnWidthsChange={setColumnWidths}
        pagination={{
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount ?? 0,
          totalPages: pagination.totalPages ?? 0,
          onPageChange: (page) => setPagination({ pageNumber: page }),
          onPageSizeChange: (size) =>
            setPagination({ pageSize: size, pageNumber: 1 }),
        }}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Contact className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No contacts found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "Create your first contact to get started"}
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete "${deleteTarget?.strFirstName} ${deleteTarget?.strLastName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      <ContactImportDialog
        open={showImport}
        onOpenChange={setShowImport}
      />

      <BulkRecipientEmailModal
        open={showBulkEmailModal}
        onClose={() => setShowBulkEmailModal(false)}
        recipients={selectedContactEmails}
        defaultSubject="CRM Contact Notification"
        defaultBody="This is an automated notification for selected contact(s)."
        onSend={handleSendBulkEmail}
      />
    </CustomContainer>
  );
};

export default ContactList;
