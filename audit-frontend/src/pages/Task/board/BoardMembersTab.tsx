import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Info, User, Users, Trash2, Edit, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { AddBoardMemberModal } from "./AddBoardMemberModal";
import { TeamGroupModal } from "./TeamGroupModal";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  useAddUsersToBoard,
  useBoardTeamMembers,
  useBulkRemoveUsersFromBoard,
} from "@/hooks/api/task/use-board-team";
import {
  useBoardTeamGroups,
  useCreateBoardTeamGroup,
  useUpdateBoardTeamGroup,
  useDeleteBoardTeamGroup,
} from "@/hooks/api/task/use-board-team-group";
import { useTableLayout } from "@/hooks/common";
import type { BoardTeam, CreateBoardTeam } from "@/types/task/board-team";
import type {
  BoardTeamGroup,
  CreateBoardTeamGroup,
  UpdateBoardTeamGroup,
} from "@/types/task/board-team-group";

interface BoardMembersTabProps {
  boardGuid?: string;
  onMemberAdded?: () => void;
  isProjectCreated?: boolean;
}

export const BoardMembersTab: React.FC<BoardMembersTabProps> = ({
  boardGuid,
  onMemberAdded,
  isProjectCreated = true,
}) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showTeamGroupModal, setShowTeamGroupModal] = useState(false);
  const [selectedTeamGroup, setSelectedTeamGroup] =
    useState<BoardTeamGroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("user");
  const [showDeleteMembersConfirm, setShowDeleteMembersConfirm] =
    useState(false);
  const [userPagination, setUserPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });
  const [teamPagination, setTeamPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>("");
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState<string>("");
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<BoardTeamGroup | null>(null);
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
  } = useTableLayout("boardMembersTabUsers", defaultColumnOrder, []);

  const {
    data: teamMembersResponse,
    isLoading: isLoadingUsers,
    refetch: refetchBoardUsers,
  } = useBoardTeamMembers(
    boardGuid,
    {
      pageNumber: userPagination.pageNumber,
      pageSize: userPagination.pageSize,
      search: debouncedSearch || undefined,
    },
    { enabled: !!boardGuid && isProjectCreated }
  );
  const { mutate: addUsersToBoard, isPending: isAddingUsers } =
    useAddUsersToBoard();
  const { mutate: bulkRemoveUsers, isPending: isBulkRemoving } =
    useBulkRemoveUsersFromBoard();

  // Team Group hooks
  const {
    data: teamGroupsResponse,
    isLoading: isLoadingTeams,
    refetch: refetchTeamGroups,
  } = useBoardTeamGroups(
    boardGuid,
    {
      pageNumber: teamPagination.pageNumber,
      pageSize: teamPagination.pageSize,
      search: debouncedTeamSearch || undefined,
    },
    { enabled: !!boardGuid && isProjectCreated && activeTab === "team" }
  );
  const { mutate: createTeamGroup, isPending: isCreatingTeam } =
    useCreateBoardTeamGroup();
  const { mutate: updateTeamGroup, isPending: isUpdatingTeam } =
    useUpdateBoardTeamGroup();
  const { mutate: deleteTeamGroup, isPending: isDeletingTeam } =
    useDeleteBoardTeamGroup();

  const teamMembers = useMemo(
    () => teamMembersResponse?.data || [],
    [teamMembersResponse?.data]
  );

  const teamGroups = useMemo(
    () => teamGroupsResponse?.data || [],
    [teamGroupsResponse?.data]
  );

  const hasMembersInTable = teamMembers.length >= 2;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeamSearch(teamSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [teamSearchTerm]);

  useEffect(() => {
    setUserPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  useEffect(() => {
    setTeamPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedTeamSearch]);

  const handleUserPageChange = useCallback((pageNumber: number) => {
    setUserPagination((prev) => ({
      ...prev,
      pageNumber,
    }));
  }, []);

  const handleUserPageSizeChange = useCallback((pageSize: number) => {
    setUserPagination({
      pageNumber: 1,
      pageSize,
    });
  }, []);

  const handleTeamPageChange = useCallback((pageNumber: number) => {
    setTeamPagination((prev) => ({
      ...prev,
      pageNumber,
    }));
  }, []);

  const handleTeamPageSizeChange = useCallback((pageSize: number) => {
    setTeamPagination({
      pageNumber: 1,
      pageSize,
    });
  }, []);

  const isMembersEnabled = !!boardGuid && isProjectCreated;

  const handleToggleMember = useCallback(
    (memberGuid: string) => {
      if (!isMembersEnabled) return;
      setSelectedMembers((prev) =>
        prev.includes(memberGuid)
          ? prev.filter((id) => id !== memberGuid)
          : [...prev, memberGuid]
      );
    },
    [isMembersEnabled]
  );

  const handleToggleAll = useCallback(() => {
    if (!isMembersEnabled) return;
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers.map((m: BoardTeam) => m.strUserGUID));
    }
  }, [isMembersEnabled, selectedMembers.length, teamMembers]);

  const handleUserSubmit = useCallback(
    (data: CreateBoardTeam) => {
      if (!boardGuid) return;

      addUsersToBoard(
        { boardGuid, data },
        {
          onSuccess: () => {
            setShowAddUserModal(false);
            refetchBoardUsers();
            onMemberAdded?.();
          },
        }
      );
    },
    [boardGuid, addUsersToBoard, refetchBoardUsers, onMemberAdded]
  );

  const handleBulkDelete = useCallback(() => {
    if (!boardGuid || selectedMembers.length === 0) return;

    bulkRemoveUsers(
      { boardGuid, userGuids: selectedMembers },
      {
        onSuccess: () => {
          setSelectedMembers([]);
          setShowDeleteMembersConfirm(false);
          refetchBoardUsers();
        },
      }
    );
  }, [boardGuid, selectedMembers, bulkRemoveUsers, refetchBoardUsers]);

  const handleTeamGroupSubmit = useCallback(
    (data: CreateBoardTeamGroup | UpdateBoardTeamGroup) => {
      if (selectedTeamGroup) {
        updateTeamGroup(
          {
            id: selectedTeamGroup.strTeamGUID,
            data: data as UpdateBoardTeamGroup,
          },
          {
            onSuccess: () => {
              setShowTeamGroupModal(false);
              setSelectedTeamGroup(null);
              refetchTeamGroups();
            },
          }
        );
      } else {
        createTeamGroup(data as CreateBoardTeamGroup, {
          onSuccess: (response) => {
            // Switch to edit mode after creation by setting the created team
            const createdTeam = {
              strTeamGUID: response.strTeamGUID || "",
              strBoardGUID: response.strBoardGUID || "",
              strParentTeamGUID: response.strParentTeamGUID || null,
              strTeamName: response.strTeamName || "",
              strDescription: response.strDescription || "",
              bolIsActive: response.bolIsActive ?? true,
            } as BoardTeamGroup;
            setSelectedTeamGroup(createdTeam);
            refetchTeamGroups();
          },
        });
      }
    },
    [selectedTeamGroup, createTeamGroup, updateTeamGroup, refetchTeamGroups]
  );

  const handleEditTeam = useCallback((team: BoardTeamGroup) => {
    setSelectedTeamGroup(team);
    setShowTeamGroupModal(true);
  }, []);

  const handleDeleteTeam = useCallback(
    (teamGuid: string) => {
      const team = teamGroups.find((item) => item.strTeamGUID === teamGuid);
      setTeamToDelete(team || null);
      setShowDeleteTeamConfirm(true);
    },
    [teamGroups]
  );

  const confirmDeleteTeam = useCallback(() => {
    if (!teamToDelete) return;

    deleteTeamGroup(teamToDelete.strTeamGUID, {
      onSuccess: () => {
        setShowDeleteTeamConfirm(false);
        setTeamToDelete(null);
        setShowTeamGroupModal(false);
        setSelectedTeamGroup(null);
        refetchTeamGroups();
      },
    });
  }, [teamToDelete, deleteTeamGroup, refetchTeamGroups]);

  const handleAddTeam = useCallback(() => {
    setSelectedTeamGroup(null);
    setShowTeamGroupModal(true);
  }, []);

  const userColumns = useMemo<DataTableColumn<BoardTeam>[]>(
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
            disabled={!isMembersEnabled}
          />
        ),
        width: "50px",
        cell: (member) => (
          <Checkbox
            checked={selectedMembers.includes(member.strUserGUID)}
            onCheckedChange={() => handleToggleMember(member.strUserGUID)}
            aria-label="Select row"
            disabled={!isMembersEnabled}
          />
        ),
      },
      {
        key: "strUserName",
        header: "User Name",
        width: "100px",
        sortable: true,
        cell: (member) => <span>{member.strUserName || "N/A"}</span>,
      },
      {
        key: "strUserEmail",
        header: "Email",
        width: "200px",
        sortable: true,
        cell: (member) => (
          <span className="text-foreground">
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
    [
      selectedMembers,
      teamMembers,
      handleToggleAll,
      handleToggleMember,
      isMembersEnabled,
    ]
  );

  const orderedUserColumns = useMemo(() => {
    if (!userColumns || userColumns.length === 0) return userColumns;

    return [...userColumns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [userColumns, columnOrder]);

  const teamColumns = useMemo<DataTableColumn<BoardTeamGroup>[]>(
    () => [
      {
        key: "strTeamName",
        header: "Team Name",
        width: "200px",
        sortable: true,
        cell: (team) => (
          <div className="flex flex-col">
            <span>{team.strTeamName}</span>
          </div>
        ),
      },
      {
        key: "strParentTeamName",
        header: "Parent Team",
        width: "150px",
        sortable: true,
        cell: (team) => (
          <span className="text-foreground">
            {team.strParentTeamName || "N/A"}
          </span>
        ),
      },
      {
        key: "strDescription",
        header: "Description",
        width: "300px",
        cell: (team) => (
          <span className="text-foreground">
            {team.strDescription || "N/A"}
          </span>
        ),
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        sortable: true,
        cell: (team) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              team.bolIsActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {team.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (team) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTeam(team)}
            disabled={!isMembersEnabled}
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Edit className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [handleEditTeam, isMembersEnabled]
  );

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-51 justify-start rounded-none bg-transparent h-auto p-0 border-b border-border">
          <TabsTrigger
            value="user"
            className="text-xs sm:text-sm whitespace-nowrap px-4 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            User
          </TabsTrigger>
          <div className="flex items-center">
            <TabsTrigger
              value="team"
              disabled={!hasMembersInTable}
              className="text-xs sm:text-sm whitespace-nowrap px-4 md:px-6 py-2 md:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            {!hasMembersInTable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={6}>
                  Add at least 2 users to <br /> enable the Team tab.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Members
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Manage team members and users for this project
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {activeTab === "user" && selectedMembers.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteMembersConfirm(true)}
                    disabled={isBulkRemoving || !isMembersEnabled}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedMembers.length})
                  </Button>
                )}
                {activeTab === "user" && (
                  <Button
                    onClick={() => setShowAddUserModal(true)}
                    disabled={!isMembersEnabled}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                )}
                {activeTab === "team" && (
                  <Button
                    onClick={handleAddTeam}
                    disabled={!isMembersEnabled}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add Team
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="user" className="space-y-4 mt-6">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                disabled={!isMembersEnabled}
              />
              {isLoadingUsers || isAddingUsers ? (
                <TableSkeleton
                  columns={[
                    { header: "User Name", width: "100px" },
                    { header: "Email", width: "200px" },
                    { header: "Reporting To", width: "150px" },
                  ]}
                  pageSize={userPagination.pageSize}
                />
              ) : (
                <div className="border border-border rounded-lg">
                  <DataTable
                    columns={orderedUserColumns}
                    data={teamMembers}
                    loading={false}
                    keyExtractor={(item) => item.strBoardTeamGUID}
                    columnVisibility={columnVisibility}
                    alwaysVisibleColumns={getAlwaysVisibleColumns()}
                    isTextWrapped={isTextWrapped}
                    pinnedColumns={pinnedColumns}
                    columnWidths={columnWidths}
                    onColumnWidthsChange={(widths) => {
                      setColumnWidths(widths);
                      localStorage.setItem(
                        "boardMembersTabUsers_column_widths",
                        JSON.stringify(widths)
                      );
                    }}
                    emptyState={
                      <div className="py-8 text-center text-muted-foreground">
                        {isMembersEnabled
                          ? 'No team members added yet. Click "Add User" to get started.'
                          : "Create the project first to add team members."}
                      </div>
                    }
                    pagination={{
                      pageNumber: teamMembersResponse?.pageNumber || 1,
                      pageSize: teamMembersResponse?.pageSize || 10,
                      totalCount: teamMembersResponse?.totalRecords || 0,
                      totalPages: teamMembersResponse?.totalPages || 0,
                      onPageChange: handleUserPageChange,
                      onPageSizeChange: handleUserPageSizeChange,
                    }}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Search teams..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  className="max-w-sm"
                  disabled={!isMembersEnabled}
                />
              </div>
              {isLoadingTeams || isCreatingTeam || isUpdatingTeam ? (
                <TableSkeleton
                  columns={[
                    { header: "Team Name", width: "200px" },
                    { header: "Description", width: "300px" },
                    { header: "Status", width: "100px" },
                    { header: "Actions", width: "100px" },
                  ]}
                  pageSize={teamPagination.pageSize}
                />
              ) : (
                <div className="border border-border rounded-lg">
                  <DataTable
                    columns={teamColumns}
                    data={teamGroups}
                    loading={false}
                    keyExtractor={(team) => team.strTeamGUID}
                    columnWidths={columnWidths}
                    emptyState={
                      <div className="py-8 text-center text-foreground">
                        {isMembersEnabled
                          ? 'No teams created yet. Click "Add Team" to get started.'
                          : "Create the project first to add teams."}
                      </div>
                    }
                    pagination={{
                      pageNumber: teamGroupsResponse?.pageNumber || 1,
                      pageSize: teamGroupsResponse?.pageSize || 10,
                      totalCount: teamGroupsResponse?.totalRecords || 0,
                      totalPages: teamGroupsResponse?.totalPages || 0,
                      onPageChange: handleTeamPageChange,
                      onPageSizeChange: handleTeamPageSizeChange,
                    }}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <AddBoardMemberModal
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onSubmit={handleUserSubmit}
        boardGuid={boardGuid}
      />
      <TeamGroupModal
        open={showTeamGroupModal}
        onOpenChange={setShowTeamGroupModal}
        onSubmit={handleTeamGroupSubmit}
        onDelete={handleDeleteTeam}
        isLoading={isCreatingTeam || isUpdatingTeam || isDeletingTeam}
        boardGuid={boardGuid}
        teamGroup={selectedTeamGroup}
        availableTeams={teamGroups}
      />
      <DeleteConfirmationDialog
        open={showDeleteMembersConfirm}
        onOpenChange={setShowDeleteMembersConfirm}
        onConfirm={handleBulkDelete}
        title="Remove team members"
        description="Are you sure you want to remove the selected members from this project?"
        confirmLabel="Remove"
        isLoading={isBulkRemoving}
      />
      <DeleteConfirmationDialog
        open={showDeleteTeamConfirm}
        onOpenChange={(open) => {
          setShowDeleteTeamConfirm(open);
          if (!open) {
            setTeamToDelete(null);
          }
        }}
        onConfirm={confirmDeleteTeam}
        title="Delete team"
        description={
          teamToDelete
            ? `Are you sure you want to delete "${teamToDelete.strTeamName}"? This action cannot be undone.`
            : "Are you sure you want to delete this team? This action cannot be undone."
        }
        confirmLabel="Delete"
        isLoading={isDeletingTeam}
      />
    </>
  );
};

export default BoardMembersTab;
