import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTableLayout } from "@/hooks/common";
import { Save, Trash2, Plus, Users } from "lucide-react";

import {
  useBoard,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "@/hooks";
import {
  useBoardTeamMembers,
  useAddUsersToBoard,
  useBulkRemoveUsersFromBoard,
} from "@/hooks/api/task/use-board-team";

import { Actions, ModuleBase } from "@/lib/permissions";

import { createBoardSchema } from "@/validations/task/board";
import type { BoardTeam, CreateBoardTeam } from "@/types/task/board-team";

import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { AddBoardMemberModal } from "./AddBoardMemberModal";

interface BoardFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId?: string;
  onSuccess?: () => void;
}

export default function BoardFormModal({
  open,
  onOpenChange,
  boardId,
  onSuccess,
}: BoardFormModalProps) {
  const isEditMode = !!boardId;
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [boardSaved, setBoardSaved] = useState(false);
  const [savedBoardId, setSavedBoardId] = useState<string | undefined>(
    undefined
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });

  const defaultColumnOrder = [
    "select",
    "strUserName",
    "strUserEmail",
    "strReportingToUserName",
  ];

  const {
    columnVisibility,
    getAlwaysVisibleColumns,
    isTextWrapped,
    pinnedColumns,
    columnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("boardFormMembers", defaultColumnOrder, []);

  const form = useForm({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      strName: "",
      strDescription: "",
      bolIsActive: true,
    },
  });

  const { data: boardData, isLoading: isLoadingBoard } = useBoard(boardId);
  const createMutation = useCreateBoard();
  const updateMutation = useUpdateBoard();
  const { mutate: deleteBoard, isPending: isDeleting } = useDeleteBoard();

  const effectiveBoardId = savedBoardId || boardId;
  const showTeamSection = isEditMode || boardSaved;

  const { data: teamMembersResponse, isLoading: isLoadingTeam } =
    useBoardTeamMembers(
      effectiveBoardId,
      {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      },
      { enabled: showTeamSection && !!effectiveBoardId }
    );

  const teamMembers = useMemo(
    () => teamMembersResponse?.data || [],
    [teamMembersResponse?.data]
  );

  const { mutate: addUsers, isPending: isAddingUsers } = useAddUsersToBoard();
  const { mutate: bulkRemoveUsers, isPending: isBulkRemoving } =
    useBulkRemoveUsersFromBoard();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setBoardSaved(false);
      setSavedBoardId(undefined);
      setSelectedMembers([]);
      setSearchTerm("");
      setDebouncedSearch("");
      setPagination({
        pageNumber: 1,
        pageSize: 10,
      });
    }
  }, [open]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  useEffect(() => {
    if (isEditMode && boardData) {
      const board = boardData;
      form.reset({
        strName: board.strName,
        strDescription: board.strDescription || "",
        bolIsActive: board.bolIsActive,
      });
    } else if (!isEditMode) {
      form.reset({
        strName: "",
        strDescription: "",
        bolIsActive: true,
      });
    }
  }, [boardData, form, isEditMode, open]);

  const handleBulkDelete = () => {
    if (!effectiveBoardId || selectedMembers.length === 0) return;

    bulkRemoveUsers(
      {
        boardGuid: effectiveBoardId,
        userGuids: selectedMembers,
      },
      {
        onSuccess: () => {
          setSelectedMembers([]);
        },
      }
    );
  };

  const handleToggleMember = useCallback((memberGuid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberGuid)
        ? prev.filter((id) => id !== memberGuid)
        : [...prev, memberGuid]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers.map((m: BoardTeam) => m.strUserGUID));
    }
  }, [selectedMembers.length, teamMembers]);

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

  const columns = useMemo<DataTableColumn<BoardTeam>[]>(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            checked={
              teamMembers.length > 0 &&
              selectedMembers.length === teamMembers.length
            }
            onCheckedChange={handleToggleAll}
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
        key: "strUserName",
        header: "User Name",
        width: "200px",
        sortable: true,
        cell: (member) => (
          <span className="font-medium">{member.strUserName || "N/A"}</span>
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
      {
        key: "strReportingToUserName",
        header: "Reporting To",
        width: "150px",
        sortable: true,
        cell: (member) => <span>{member.strReportingToUserName || "N/A"}</span>,
      },
    ],
    [selectedMembers, teamMembers, handleToggleMember, handleToggleAll]
  );

  // Apply column ordering
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

  const handleAddMembers = (data: CreateBoardTeam) => {
    if (!effectiveBoardId) return;

    addUsers(
      {
        boardGuid: effectiveBoardId,
        data,
      },
      {
        onSuccess: () => {
          setShowAddMemberModal(false);
        },
      }
    );
  };

  const onSubmit = (values: FieldValues) => {
    const payload = {
      strName: String(values.strName || ""),
      strDescription: String(values.strDescription || ""),
      bolIsActive: Boolean(values.bolIsActive ?? true),
    };

    if (isEditMode || boardSaved) {
      const updateId = boardId || savedBoardId;
      if (!updateId) return;

      updateMutation.mutate(
        { id: updateId, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (response) => {
          setBoardSaved(true);
          setSavedBoardId(response.strBoardGUID);
          onSuccess?.();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!boardId) return;
    deleteBoard(
      { id: boardId },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  const handleClose = () => {
    if (!isLoading && !isDeleting) {
      onOpenChange(false);
    }
  };

  const footerContent = (
    <>
      <div className="flex-1" />
    </>
  );

  return (
    <>
      <ModalDialog
        open={open}
        onOpenChange={handleClose}
        title={isEditMode ? "Edit Project" : "Create New Project"}
        description={
          isEditMode
            ? "Update the project properties below."
            : "Fill in the details to create a new project."
        }
        maxWidth="900px"
        className="h-[90vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
        footerContent={
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full"
            >
              {footerContent}
            </form>
          </Form>
        }
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full w-full"
          >
            <div className="overflow-y-auto flex-1">
              {isEditMode && isLoadingBoard ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-muted-foreground">
                    Loading board details...
                  </p>
                </div>
              ) : (
                <div className="px-6 py-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter project name"
                              value={field.value?.toString() || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter project description"
                              value={field.value?.toString() || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-125">
                    <FormField
                      control={form.control}
                      name="bolIsActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-border-color p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Board Team Members Section */}
                  <>
                    <div className="flex gap-2 justify-between mb-6">
                      <div>
                        {isEditMode && (
                          <WithPermission
                            module={ModuleBase.BOARD}
                            action={Actions.DELETE}
                          >
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={isLoading || isDeleting}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </WithPermission>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <WithPermission
                          module={ModuleBase.BOARD}
                          action={isEditMode ? Actions.EDIT : Actions.SAVE}
                        >
                          <Button type="submit" disabled={isLoading}>
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading
                              ? isEditMode || boardSaved
                                ? "Updating..."
                                : "Creating..."
                              : isEditMode || boardSaved
                                ? "Update"
                                : "Create"}
                          </Button>
                        </WithPermission>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Project Team Members
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {!showTeamSection
                              ? "Create the project first to add team members"
                              : "Manage project team members"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {showTeamSection && selectedMembers.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={handleBulkDelete}
                              disabled={isBulkRemoving}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete ({selectedMembers.length})
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowAddMemberModal(true)}
                            disabled={!effectiveBoardId}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Member
                          </Button>
                        </div>
                      </div>

                      {!showTeamSection ? (
                        <Card>
                          <CardContent className="p-0">
                            <div className="py-10 text-center bg-muted/30">
                              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                              <p className="text-muted-foreground">
                                Create the project first to add team members
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            placeholder="Search team members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                          />
                          <div className="rounded-lg">
                            <DataTable
                              data={teamMembers}
                              columns={orderedColumns}
                              keyExtractor={(item) => item.strBoardTeamGUID}
                              maxHeight="220px"
                              loading={isLoadingTeam}
                              columnVisibility={columnVisibility}
                              alwaysVisibleColumns={getAlwaysVisibleColumns()}
                              isTextWrapped={isTextWrapped}
                              pinnedColumns={pinnedColumns}
                              columnWidths={columnWidths}
                              onColumnWidthsChange={(widths) => {
                                setColumnWidths(widths);
                                localStorage.setItem(
                                  "boardFormMembers_column_widths",
                                  JSON.stringify(widths)
                                );
                              }}
                              emptyState={
                                <div className="py-8 text-center text-muted-foreground">
                                  No team members added yet. Click "Add Member"
                                  to get started.
                                </div>
                              }
                              pagination={{
                                pageNumber:
                                  teamMembersResponse?.pageNumber || 1,
                                pageSize: teamMembersResponse?.pageSize || 10,
                                totalCount:
                                  teamMembersResponse?.totalRecords || 0,
                                totalPages:
                                  teamMembersResponse?.totalPages || 0,
                                onPageChange: goToPage,
                                onPageSizeChange: changePageSize,
                              }}
                              pageSizeOptions={[5, 10, 20, 50]}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                </div>
              )}
            </div>
          </form>
        </Form>
      </ModalDialog>

      {/* Add Member Modal */}
      <AddBoardMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onSubmit={handleAddMembers}
        isLoading={isAddingUsers}
        boardGuid={effectiveBoardId}
      />

      <DeleteConfirmationDialog
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
