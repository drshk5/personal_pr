import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, LayoutDashboard as LayoutBoard, Eye } from "lucide-react";

import { useBoards, useBoardSections } from "@/hooks";
import { useMenuIcon } from "@/hooks/common";

import { Actions, ModuleBase } from "@/lib/permissions";
import { STATUS_OPTIONS } from "@/constants/Task/task";

import type { Board } from "@/types";
import type { ViewType } from "@/types/task/board-section";
import { VIEW_TYPE } from "@/types/task/board-section";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { MultiSelect } from "@/components/ui/select/multi-select";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import BoardViewSwitch from "@/pages/Task/board/BoardViewSwitch";
import { WithPermission } from "@/components/ui/with-permission";
import { BoardViewSkeleton } from "@/pages/Task/board/BoardSkeleton";

import BoardFormModal from "./BoardFormModal";
import noSectionsUrl from "@/assets/task/no-sections.svg";

const BoardList: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | undefined>();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedView, setSelectedView] = useState<ViewType>(VIEW_TYPE.Section);
  const [showKanbanView, setShowKanbanView] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);

  const HeaderIcon = useMenuIcon(ModuleBase.BOARD, LayoutBoard);

  const viewOptions = [
    { label: "Module View", value: VIEW_TYPE.Section },
    { label: "List View", value: VIEW_TYPE.List },
    { label: "Calendar View", value: VIEW_TYPE.Calendar },
    { label: "Priority View", value: VIEW_TYPE.Priority },
    { label: "Due Date View", value: VIEW_TYPE.DueDate },
    { label: "Status View", value: VIEW_TYPE.Status },
    { label: "Assignee View", value: VIEW_TYPE.Assignee },
    // { label: "Gantt View", value: VIEW_TYPE.Gantt },
  ];

  const currentViewLabel =
    viewOptions.find((option) => option.value === selectedView)?.label ||
    selectedView;

  const { data, refetch, isLoading } = useBoards({});

  const boards = useMemo(() => data || [], [data]);

  useEffect(() => {
    if (!selectedBoard || boards.length === 0) {
      setSelectedBoard(boards[0] ?? null);
      return;
    }

    const updated = boards.find(
      (b) => b.strBoardGUID === selectedBoard.strBoardGUID
    );

    if (!updated) {
      setSelectedBoard(boards[0] ?? null);
    } else if (updated.strName !== selectedBoard.strName) {
      setSelectedBoard(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards]);

  const handleEditBoard = (boardGuid: string) => {
    setEditingBoardId(boardGuid);
    setShowModal(true);
  };

  const handleCreateBoard = () => {
    setEditingBoardId(undefined);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const boardSectionParams = useMemo(
    () => ({
      strBoardGUID: selectedBoard?.strBoardGUID,
    }),
    [selectedBoard?.strBoardGUID]
  );

  const { data: sectionsResponse, isLoading: sectionsLoading } =
    useBoardSections(boardSectionParams);
  const sections = sectionsResponse?.data || [];

  const handleCancelCreation = () => {
    setShowKanbanView(false);
  };

  const handleCreateSection = () => {
    setShowKanbanView(true);
  };

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Projects"
            description="Manage projects to organize and track tasks"
            icon={HeaderIcon}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {selectedView !== VIEW_TYPE.Status && (
            <div className="w-full sm:w-60 lg:w-69 shrink-0">
              <MultiSelect
                options={STATUS_OPTIONS}
                selectedValues={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />
            </div>
          )}

          <Select
            value={selectedBoard?.strBoardGUID || ""}
            onValueChange={(value) => {
              const board = boards.find((b) => b.strBoardGUID === value);
              if (board) setSelectedBoard(board);
            }}
            open={isBoardDropdownOpen}
            onOpenChange={setIsBoardDropdownOpen}
          >
            <SelectTrigger className="w-full sm:w-56 lg:w-52 h-9 shadow-xs shrink-0">
              <div className="flex-1 min-w-0">
                {boards.length === 0 ? (
                  <span className="text-foreground block truncate">
                    Create Project
                  </span>
                ) : (
                  <SelectValue>
                    <span
                      className="block truncate"
                      title={selectedBoard?.strName}
                    >
                      {selectedBoard?.strName ?? "Select project"}
                    </span>
                  </SelectValue>
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="w-full max-h-80 min-w-56">
              {boards.length === 0 && !isLoading && (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  No projects found
                </div>
              )}
              {boards.map((board: Board) => (
                <div key={board.strBoardGUID} className="relative">
                  <SelectItem value={board.strBoardGUID} className="pr-10">
                    <div className="flex items-center gap-2 min-w-0 max-w-xs">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          board.bolIsActive ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={board.bolIsActive ? "Active" : "Inactive"}
                      />
                      <span
                        className="font-medium truncate"
                        title={board.strName}
                      >
                        {board.strName}
                      </span>
                    </div>
                  </SelectItem>
                  <WithPermission
                    module={ModuleBase.BOARD}
                    action={Actions.EDIT}
                  >
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-900 p-1 rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBoardDropdownOpen(false);
                        handleEditBoard(board.strBoardGUID);
                      }}
                      title="Edit project"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </WithPermission>
                </div>
              ))}
              <WithPermission module={ModuleBase.BOARD} action={Actions.SAVE}>
                {boards.length > 0 && (
                  <div className="h-px bg-border-color my-1 mx-1" />
                )}
                <div
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-[#f0f0f0] dark:hover:bg-[#333] dark:text-white"
                  onClick={() => {
                    setIsBoardDropdownOpen(false);
                    handleCreateBoard();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2 absolute left-2" />
                  <span>Create New Project</span>
                </div>
              </WithPermission>
            </SelectContent>
          </Select>

          <Select
            value={selectedView}
            onValueChange={(value) => setSelectedView(value as ViewType)}
          >
            <SelectTrigger className="w-full sm:w-48 lg:w-44 h-9 shadow-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="h-4 w-4 shrink-0" />
                <SelectValue className="truncate" />
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="w-56">
              {viewOptions.map((view) => (
                <SelectItem key={view.value} value={view.value}>
                  {view.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && !selectedBoard && (
        <div className="mt-6">
          <BoardViewSkeleton viewType={currentViewLabel} />
        </div>
      )}

      {!isLoading && selectedBoard && sectionsLoading && (
        <div className="mt-6">
          <BoardViewSkeleton viewType={currentViewLabel} />
        </div>
      )}

      {!isLoading &&
        !sectionsLoading &&
        (!selectedBoard ||
          (sections.length === 0 &&
            !showKanbanView &&
            (selectedView === VIEW_TYPE.Section ||
              selectedView === VIEW_TYPE.List))) && (
          <div className="h-[calc(100vh-270px)] flex flex-col justify-center">
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <img
                src={noSectionsUrl}
                alt="No modules"
                className="mb-10 opacity-90 h-52"
              />
              <div className="text-xl font-semibold text-foreground">
                Easily manage shared work.
              </div>
              <div className="text-sm text-muted-foreground mt-1 max-w-md">
                Create projects to organize your work and tasks. Manage project
                modules for better project organization. Track progress and
                collaborate with your team.
              </div>

              {selectedBoard && (
                <WithPermission module={ModuleBase.BOARD} action={Actions.SAVE}>
                  <div className="mt-6">
                    <Button onClick={handleCreateSection}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Modules
                    </Button>
                  </div>
                </WithPermission>
              )}
            </div>
          </div>
        )}

      <BoardFormModal
        open={showModal}
        onOpenChange={setShowModal}
        boardId={editingBoardId}
        onSuccess={handleModalSuccess}
      />

      {selectedBoard &&
        !sectionsLoading &&
        !isLoading &&
        (sections.length > 0 ||
          showKanbanView ||
          selectedView === VIEW_TYPE.List ||
          selectedView === VIEW_TYPE.Calendar ||
          selectedView === VIEW_TYPE.Priority ||
          selectedView === VIEW_TYPE.DueDate ||
          selectedView === VIEW_TYPE.Status ||
          selectedView === VIEW_TYPE.Assignee) && (
          <div className="mt-6">
            <BoardViewSwitch
              board={selectedBoard}
              view={selectedView}
              onCancelCreation={handleCancelCreation}
              statusFilter={statusFilter}
            />
          </div>
        )}
    </CustomContainer>
  );
};

export default BoardList;
