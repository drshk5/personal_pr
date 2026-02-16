import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";

import { useTableLayout } from "@/hooks/common";
import { useAvailableUsersForTeamGroup } from "@/hooks/api/task/use-board-team-group";
import type { AvailableUserForTeamGroup } from "@/types/task/board-team-group";
import { getImagePath } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

interface AddTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddUsers: (userGuids: string[]) => Promise<void>;
  isLoading?: boolean;
  boardGuid?: string;
  teamGuid?: string;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  open,
  onOpenChange,
  onAddUsers,
  isLoading = false,
  boardGuid,
  teamGuid,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });

  const defaultColumnOrder = ["select", "userInfo", "strEmailId"];

  const {
    columnVisibility,
    getAlwaysVisibleColumns,
    isTextWrapped,
    pinnedColumns,
    columnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("addTeamMember", defaultColumnOrder, []);

  // Fetch available users
  const { data: availableUsersResponse, isLoading: isLoadingUsers } =
    useAvailableUsersForTeamGroup(
      boardGuid,
      teamGuid,
      {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      },
      { enabled: open && !!boardGuid && !!teamGuid }
    );

  const availableUsers = useMemo(
    () => availableUsersResponse?.data || [],
    [availableUsersResponse?.data]
  );

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setSearchTerm("");
      setDebouncedSearch("");
      setPagination({
        pageNumber: 1,
        pageSize: 10,
      });
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  const handleToggleUser = useCallback(
    (userGuid: string) => {
      setSelectedUsers((prev) =>
        prev.includes(userGuid)
          ? prev.filter((id) => id !== userGuid)
          : [...prev, userGuid]
      );
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === availableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(availableUsers.map((u) => u.strUserGUID));
    }
  }, [selectedUsers.length, availableUsers]);

  const goToPage = (pageNumber: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber,
    }));
  };

  const changePageSize = (pageSize: number) => {
    setPagination({
      pageNumber: 1,
      pageSize,
    });
  };

  const userColumns = useMemo<DataTableColumn<AvailableUserForTeamGroup>[]>(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            checked={
              availableUsers.length > 0 &&
              selectedUsers.length === availableUsers.length
            }
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        ),
        width: "50px",
        cell: (user) => (
          <Checkbox
            checked={selectedUsers.includes(user.strUserGUID)}
            onCheckedChange={() => handleToggleUser(user.strUserGUID)}
            aria-label="Select row"
          />
        ),
      },
      {
        key: "userInfo",
        header: "User",
        width: "250px",
        sortable: true,
        cell: (user) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={getImagePath(user.strProfileImg)}
                alt={user.strName || "User"}
              />
              <AvatarFallback>
                {user.strName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {user.strName || "N/A"}
            </span>
          </div>
        ),
      },
      {
        key: "strEmailId",
        header: "Email",
        width: "250px",
        sortable: true,
        cell: (user) => (
          <span className="text-muted-foreground">
            {user.strEmailId || "N/A"}
          </span>
        ),
      },
      {
        key: "strMobileNo",
        header: "Mobile",
        width: "150px",
        sortable: true,
        cell: (user) => (
          <span className="text-muted-foreground">
            {user.strMobileNo || "N/A"}
          </span>
        ),
      },
    ],
    [selectedUsers, availableUsers, handleSelectAll, handleToggleUser]
  );

  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((key) => userColumns.find((col) => col.key === key))
      .filter(
        (col): col is DataTableColumn<AvailableUserForTeamGroup> =>
          col !== undefined
      );
  }, [columnOrder, userColumns]);

  const handleAddUsers = async () => {
    if (selectedUsers.length > 0) {
      setIsAdding(true);
      try {
        await onAddUsers(selectedUsers);
        setSelectedUsers([]);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={handleClose}
      title="Add Team Members"
      description="Select users from the available list to add to this team"
      maxWidth="900px"
      className="h-[80vh] max-sm:h-[90vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
    >
      <div className="flex flex-col h-full w-full">
        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {selectedUsers.length > 0 && (
                <div className="bg-primary/10 px-3 py-1.5 rounded-md">
                  <p className="text-sm font-medium text-primary">
                    {selectedUsers.length} selected
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border">
              {isLoadingUsers ? (
                <TableSkeleton columns={["Select", "User", "Email", "Mobile"]} pageSize={8} />
              ) : (
                <DataTable
                  columns={orderedColumns}
                  data={availableUsers}
                  loading={isLoadingUsers}
                  keyExtractor={(item) => item.strUserGUID}
                  maxHeight="450px"
                  columnVisibility={columnVisibility}
                  alwaysVisibleColumns={getAlwaysVisibleColumns()}
                  isTextWrapped={isTextWrapped}
                  pinnedColumns={pinnedColumns}
                  columnWidths={columnWidths}
                  onColumnWidthsChange={(widths) => {
                    setColumnWidths(widths);
                    localStorage.setItem(
                      "addTeamMember_column_widths",
                      JSON.stringify(widths)
                    );
                  }}
                emptyState={
                  <div className="py-12 text-center text-muted-foreground">
                    {searchTerm
                      ? "No users found matching your search."
                      : "No available users to add."}
                  </div>
                }
                pagination={{
                  pageNumber: availableUsersResponse?.pageNumber || 1,
                  pageSize: availableUsersResponse?.pageSize || 10,
                  totalCount: availableUsersResponse?.totalRecords || 0,
                  totalPages: availableUsersResponse?.totalPages || 0,
                  onPageChange: goToPage,
                  onPageSizeChange: changePageSize,
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
              )}
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
          <Button
            type="button"
            onClick={handleAddUsers}
            disabled={isLoading || isAdding || selectedUsers.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding
              ? "Adding..."
              : `Add ${selectedUsers.length > 0 ? `${selectedUsers.length} ` : ""}User${selectedUsers.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};
