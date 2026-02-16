import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Users, Trash2, Plus } from "lucide-react";

import { useTableLayout } from "@/hooks/common";
import {
  useBoardTeamMembers,
  useBulkCreateBoardTeamMember,
  useBulkDeleteBoardTeamMember,
} from "@/hooks/api/task/use-board-team-member";
import {
  createBoardTeamGroupSchema,
  updateBoardTeamGroupSchema,
  type CreateBoardTeamGroupFormValues,
  type UpdateBoardTeamGroupFormValues,
} from "@/validations/task/board-team-group";
import type {
  BoardTeamGroup,
  CreateBoardTeamGroup,
  UpdateBoardTeamGroup,
} from "@/types/task/board-team-group";
import type { BoardTeamMember } from "@/types/task/board-team-member";
import { getImagePath } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { AddTeamMemberModal } from "./AddTeamMemberModal";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

interface TeamGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBoardTeamGroup | UpdateBoardTeamGroup) => void;
  onDelete?: (teamGuid: string) => void;
  isLoading?: boolean;
  boardGuid?: string;
  teamGroup?: BoardTeamGroup | null;
  availableTeams?: BoardTeamGroup[];
}

export const TeamGroupModal: React.FC<TeamGroupModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  isLoading = false,
  boardGuid,
  teamGroup = null,
  availableTeams = [],
}) => {
  const isEditMode = !!teamGroup;
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showRemoveMembersConfirm, setShowRemoveMembersConfirm] =
    useState(false);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });

  const defaultColumnOrder = ["userInfo", "strUserEmail"];

  const {
    columnVisibility,
    getAlwaysVisibleColumns,
    isTextWrapped,
    pinnedColumns,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("teamGroupModal", defaultColumnOrder, []);

  const form = useForm<
    CreateBoardTeamGroupFormValues | UpdateBoardTeamGroupFormValues
  >({
    resolver: zodResolver(
      isEditMode ? updateBoardTeamGroupSchema : createBoardTeamGroupSchema
    ),
    mode: "onSubmit",
    defaultValues: isEditMode
      ? {
          strBoardGUID: teamGroup?.strBoardGUID || "",
          strParentTeamGUID: teamGroup?.strParentTeamGUID || null,
          strTeamName: teamGroup?.strTeamName || "",
          strDescription: teamGroup?.strDescription || "",
          bolIsActive: teamGroup?.bolIsActive ?? true,
        }
      : {
          strBoardGUID: boardGuid || "",
          strParentTeamGUID: null,
          strTeamName: "",
          strDescription: "",
          bolIsActive: true,
        },
  });

  // Fetch team members for adding to team (only in edit mode)
  const { data: boardMembersResponse, isLoading: isLoadingMembers } =
    useBoardTeamMembers(
      boardGuid,
      {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        strTeamGUID: isEditMode ? teamGroup?.strTeamGUID : undefined,
      },
      { enabled: !!boardGuid && open && isEditMode }
    );

  const { mutateAsync: bulkCreateTeamMembers } = useBulkCreateBoardTeamMember();
  const { mutateAsync: bulkDeleteTeamMembers } = useBulkDeleteBoardTeamMember();

  const boardMembers = useMemo(
    () => boardMembersResponse?.data || [],
    [boardMembersResponse?.data]
  );

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setDebouncedSearch("");
      setSelectedMembers([]);
      setPagination({
        pageNumber: 1,
        pageSize: 10,
      });
      form.reset();
    } else {
      if (isEditMode && teamGroup) {
        form.reset({
          strBoardGUID: teamGroup.strBoardGUID,
          strParentTeamGUID: teamGroup.strParentTeamGUID || null,
          strTeamName: teamGroup.strTeamName,
          strDescription: teamGroup.strDescription || "",
          bolIsActive: teamGroup.bolIsActive,
        });
      } else {
        form.reset({
          strBoardGUID: boardGuid || "",
          strParentTeamGUID: null,
          strTeamName: "",
          strDescription: "",
          bolIsActive: true,
        });
      }
      form.clearErrors();
    }
  }, [open, form, isEditMode, teamGroup, boardGuid]);

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

  const pageMemberUserIds = useMemo(
    () => boardMembers.map((member) => member.strUserGUID),
    [boardMembers]
  );

  const isAllPageSelected =
    pageMemberUserIds.length > 0 &&
    pageMemberUserIds.every((id) => selectedMembers.includes(id));

  const handleToggleMember = useCallback((userGuid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userGuid)
        ? prev.filter((id) => id !== userGuid)
        : [...prev, userGuid]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (pageMemberUserIds.length === 0) return;

    if (isAllPageSelected) {
      setSelectedMembers((prev) =>
        prev.filter((id) => !pageMemberUserIds.includes(id))
      );
    } else {
      setSelectedMembers((prev) =>
        Array.from(new Set([...prev, ...pageMemberUserIds]))
      );
    }
  }, [isAllPageSelected, pageMemberUserIds]);

  const userColumns = useMemo<DataTableColumn<BoardTeamMember>[]>(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            checked={isAllPageSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        ),
        width: "50px",
        cell: (member) => (
          <Checkbox
            checked={selectedMembers.includes(member.strUserGUID)}
            onCheckedChange={() => handleToggleMember(member.strUserGUID)}
            aria-label="Select row"
          />
        ),
      },
      {
        key: "userInfo",
        header: "User",
        width: "200px",
        sortable: true,
        cell: (member) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={getImagePath(member.strProfileImg)}
                alt={member.strUserName || "User"}
              />
              <AvatarFallback>
                {member.strUserName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{member.strUserName || "N/A"}</span>
          </div>
        ),
      },
      {
        key: "strUserEmail",
        header: "Email",
        width: "200px",
        sortable: true,
        cell: (member) => (
          <span className="text-muted-foreground">
            {member.strUserEmail || "N/A"}
          </span>
        ),
      },
    ],
    [handleSelectAll, handleToggleMember, isAllPageSelected, selectedMembers]
  );

  const orderedColumns = useMemo(() => {
    return userColumns;
  }, [userColumns]);

  const handleFormSubmit = (
    data: CreateBoardTeamGroupFormValues | UpdateBoardTeamGroupFormValues
  ) => {
    onSubmit(data as CreateBoardTeamGroup | UpdateBoardTeamGroup);
  };

  const handleAddUsersToTeam = useCallback(
    async (userGuids: string[]) => {
      if (!teamGroup?.strTeamGUID) return;

      try {
        // Call the bulk API to add all users to the team at once
        await bulkCreateTeamMembers({
          strTeamGUID: teamGroup.strTeamGUID,
          strUserGUIDs: userGuids,
        });

        setShowAddUserModal(false);
      } catch (error) {
        console.error("Error adding users to team:", error);
      }
    },
    [teamGroup?.strTeamGUID, bulkCreateTeamMembers]
  );

  const handleRemoveSelectedMembers = useCallback(async () => {
    if (!teamGroup?.strTeamGUID || selectedMembers.length === 0) return;

    try {
      await bulkDeleteTeamMembers({
        strTeamGUID: teamGroup.strTeamGUID,
        strUserGUIDs: selectedMembers,
      });
      setSelectedMembers([]);
      setShowRemoveMembersConfirm(false);
    } catch (error) {
      console.error("Error removing users from team:", error);
    }
  }, [teamGroup?.strTeamGUID, selectedMembers, bulkDeleteTeamMembers]);

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? "Edit Team" : "Create Team"}
      description={
        isEditMode
          ? "Update team information and manage team members"
          : "Fill in the details to create a new team"
      }
      maxWidth="900px"
      className="h-[90vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col h-full w-full"
        >
          <div className="overflow-y-auto flex-1">
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strTeamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Team Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter team name"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strParentTeamGUID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Team</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : value)
                        }
                        value={field.value || "none"}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent team (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            Select Parent Team
                          </SelectItem>
                          {availableTeams
                            .filter(
                              (team) =>
                                team.strTeamGUID !== teamGroup?.strTeamGUID
                            )
                            .map((team) => (
                              <SelectItem
                                key={team.strTeamGUID}
                                value={team.strTeamGUID}
                              >
                                {team.strTeamName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter team description"
                          disabled={isLoading}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bolIsActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 gap-4">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-2">
                {isEditMode && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => teamGroup && onDelete(teamGroup.strTeamGUID)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <div className="flex-1" />
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update"
                      : "Create"}
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Team Members Section - Only show in edit mode */}
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select users to add to this team
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedMembers.length > 0 && (
                        <>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowRemoveMembersConfirm(true)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove ({selectedMembers.length})
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddUserModal(true)}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />

                    <div className="rounded-lg border border-border">
                      {isLoadingMembers ? (
                        <TableSkeleton
                          columns={["Select", "User", "Email"]}
                          pageSize={5}
                        />
                      ) : (
                        <DataTable
                          columns={orderedColumns}
                          data={boardMembers}
                          loading={isLoadingMembers}
                          keyExtractor={(item) => item.strTeamMemberGUID}
                          maxHeight="220px"
                          columnVisibility={columnVisibility}
                          alwaysVisibleColumns={getAlwaysVisibleColumns()}
                          isTextWrapped={isTextWrapped}
                          pinnedColumns={pinnedColumns}
                          columnWidths={columnWidths}
                          onColumnWidthsChange={(widths) => {
                            setColumnWidths(widths);
                            localStorage.setItem(
                              "teamGroupModal_column_widths",
                              JSON.stringify(widths)
                            );
                          }}
                          emptyState={
                            <div className="py-8 text-center text-muted-foreground">
                              {boardMembers.length === 0
                                ? "No users available. Add users to the project first."
                                : "No users found."}
                            </div>
                          }
                          pagination={{
                            pageNumber: boardMembersResponse?.pageNumber || 1,
                            pageSize: boardMembersResponse?.pageSize || 10,
                            totalCount: boardMembersResponse?.totalRecords || 0,
                            totalPages: boardMembersResponse?.totalPages || 0,
                            onPageChange: goToPage,
                            onPageSizeChange: changePageSize,
                          }}
                          pageSizeOptions={[5, 10, 20, 50]}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create the team first to add members
                      </p>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="p-0">
                      <div className="py-10 text-center bg-muted/30">
                        <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          Create the team first to add members
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onAddUsers={handleAddUsersToTeam}
        isLoading={isLoading}
        boardGuid={boardGuid}
        teamGuid={teamGroup?.strTeamGUID}
      />
      <DeleteConfirmationDialog
        open={showRemoveMembersConfirm}
        onOpenChange={setShowRemoveMembersConfirm}
        onConfirm={handleRemoveSelectedMembers}
        title="Remove team members"
        description="Are you sure you want to remove the selected members from this team?"
        confirmLabel="Remove"
        isLoading={isLoading}
      />
    </ModalDialog>
  );
};
