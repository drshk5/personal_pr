import React, { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useTableLayout } from "@/hooks/common";
import { useAvailableUsersForBoard } from "@/hooks/api/task/use-board-team";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { createBoardTeamSchema } from "@/validations/task/board-team";
import type { CreateBoardTeam, AvailableUser } from "@/types/task/board-team";
import { getImagePath } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";

interface BoardMember {
  strUserGUID: string;
  strName: string;
  strEmailId: string;
}

interface AddBoardMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBoardTeam) => void;
  isLoading?: boolean;
  boardGuid?: string;
}

export const AddBoardMemberModal: React.FC<AddBoardMemberModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  boardGuid,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<BoardMember[]>([]);
  const [reportingTo, setReportingTo] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });

  const defaultColumnOrder = ["select", "userInfo"];

  const {
    columnVisibility,
    getAlwaysVisibleColumns,
    isTextWrapped,
    pinnedColumns,
    columnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("addBoardMember", defaultColumnOrder, []);

  const form = useForm({
    resolver: zodResolver(createBoardTeamSchema),
    mode: "onSubmit",
    defaultValues: {
      strUserGUIDs: [],
      strReportingToGUID: "",
    },
  });

  // Reset state when modal opens or closes
  React.useEffect(() => {
    if (!open) {
      setSelectedMembers([]);
      setReportingTo("");
      setUserSearchQuery("");
      setSearchTerm("");
      setDebouncedSearch("");
      setPagination({
        pageNumber: 1,
        pageSize: 10,
      });
      form.reset();
    } else {
      form.clearErrors();
    }
  }, [open, form]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  const { data: availableUsersResponse, isLoading: isLoadingAvailableUsers } =
    useAvailableUsersForBoard(
      boardGuid,
      {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      },
      { enabled: !!boardGuid && open }
    );

  const availableUsers = useMemo(
    () => availableUsersResponse?.data || [],
    [availableUsersResponse?.data]
  );
  // Only fetch module users when modal is open
  const { data: allUsersRaw, isLoading: isLoadingAllUsers } = useModuleUsers(
    undefined,
    userSearchQuery,
    open
  );
  // Fallback to empty array if undefined
  const allUsers = Array.isArray(allUsersRaw) ? allUsersRaw : [];

  const isLoadingUsers = isLoadingAvailableUsers || isLoadingAllUsers;

  const handleToggleMember = useCallback(
    (user: AvailableUser) => {
      const exists = selectedMembers.find(
        (m) => m.strUserGUID === user.strUserGUID
      );

      if (exists) {
        setSelectedMembers(
          selectedMembers.filter((m) => m.strUserGUID !== user.strUserGUID)
        );
      } else {
        setSelectedMembers([
          ...selectedMembers,
          {
            strUserGUID: user.strUserGUID,
            strName: user.strUserName || user.strName || "Unknown",
            strEmailId: user.strEmailId,
          },
        ]);
      }
    },
    [selectedMembers]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.length === availableUsers.length) {
      setSelectedMembers([]);
    } else {
      const allMembers = availableUsers.map((user) => ({
        strUserGUID: user.strUserGUID,
        strName: user.strUserName || user.strName || "Unknown",
        strEmailId: user.strEmailId,
      }));
      setSelectedMembers(allMembers);
    }
  }, [selectedMembers.length, availableUsers]);

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

  const selectAllCheckbox = useMemo(() => {
    const allSelected =
      availableUsers.length > 0 &&
      selectedMembers.length === availableUsers.length;
    return (
      <Checkbox
        checked={allSelected}
        onCheckedChange={handleSelectAll}
        disabled={isLoading || availableUsers.length === 0}
      />
    );
  }, [
    availableUsers.length,
    selectedMembers.length,
    handleSelectAll,
    isLoading,
  ]);

  const columns = useMemo<DataTableColumn<AvailableUser>[]>(
    () => [
      {
        key: "select",
        header: selectAllCheckbox,
        width: "50px",
        cell: (user) => {
          const isSelected = selectedMembers.some(
            (m) => m.strUserGUID === user.strUserGUID
          );
          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleToggleMember(user)}
              disabled={isLoading}
            />
          );
        },
      },
      {
        key: "userInfo",
        header: "User",
        width: "350px",
        sortable: true,
        cell: (user) => {
          const userName = user.strUserName || user.strName || "User";
          const initials = userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={getImagePath(user.strProfileImg) as string}
                  alt={userName}
                />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{userName}</span>
                <span className="text-sm text-muted-foreground">
                  {user.strEmailId}
                </span>
              </div>
            </div>
          );
        },
      },
    ],
    [selectedMembers, isLoading, handleToggleMember, selectAllCheckbox]
  );

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

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) return;

    form.setValue("strReportingToGUID", reportingTo);

    const isValid = await form.trigger("strReportingToGUID");
    if (!isValid) {
      return;
    }

    const data: CreateBoardTeam = {
      strUserGUIDs: selectedMembers.map((m) => m.strUserGUID),
      strReportingToGUID: reportingTo,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const footerContent = (
    <div className="flex justify-end gap-2 w-full">
      <Button
        onClick={handleSubmit}
        disabled={selectedMembers.length === 0 || isLoading}
      >
        {isLoading ? "Adding..." : "Add Members"}
      </Button>
    </div>
  );

  return (
    <ModalDialog
      open={open}
      onOpenChange={handleClose}
      title="Add Board Members"
      description="Select users to add to the board team"
      maxWidth="800px"
      className="h-[85vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
      fullHeight={false}
      showCloseButton={true}
      footerContent={footerContent}
    >
      <Form {...form}>
        <div className="flex flex-col h-105 px-4 sm:px-6 space-y-4 overflow-hidden">
          <div className="shrink-0 space-y-6">
            <FormField
              control={form.control}
              name="strReportingToGUID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reporting To<span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={reportingTo}
                    onValueChange={(value) => {
                      setReportingTo(value);
                      field.onChange(value);
                    }}
                    disabled={isLoading || isLoadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Select reporting manager">
                          {reportingTo
                            ? (() => {
                                const user = allUsers.find(
                                  (u) => u.strUserGUID === reportingTo
                                );
                                if (!user) return "Select reporting manager";
                                return (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={
                                          getImagePath(
                                            user.strProfileImg
                                          ) as string
                                        }
                                        alt={user.strName || "User"}
                                      />
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {(user.strName || "U")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {user.strName}
                                    </span>
                                  </div>
                                );
                              })()
                            : "Select reporting manager"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      className="z-150"
                      showSearch
                      searchPlaceholder="Search users..."
                      onSearchChange={(value) => setUserSearchQuery(value)}
                    >
                      {allUsers.map((user) => (
                        <SelectItem
                          key={user.strUserGUID}
                          value={user.strUserGUID}
                          className="pl-2 pr-2 [&_svg]:hidden"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={getImagePath(user.strProfileImg) as string}
                                alt={user.strName}
                              />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(user.strName || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.strName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>
                Available Users ({selectedMembers.length} selected)
              </FormLabel>
            </div>
          </div>

          {/* Search Section */}
          <div className="shrink-0">
            <Input
              placeholder="Search available users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Table Section with controlled height */}
          <div className="flex-1 min-h-0 rounded-lg">
            <DataTable
              data={availableUsers}
              columns={orderedColumns}
              keyExtractor={(item) => item.strUserGUID}
              maxHeight="200px"
              loading={isLoadingUsers}
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              isTextWrapped={isTextWrapped}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem(
                  "addBoardMember_column_widths",
                  JSON.stringify(widths)
                );
              }}
              emptyState={
                <div className="py-8 text-center text-muted-foreground">
                  No available users to add
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
          </div>
        </div>
      </Form>
    </ModalDialog>
  );
};

export default AddBoardMemberModal;
