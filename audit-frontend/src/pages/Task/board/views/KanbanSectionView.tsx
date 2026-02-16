import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import {
  Plus,
  ChevronDown,
  Edit,
  Trash2,
  Palette,
  GripVertical,
} from "lucide-react";

import {
  useBoardSections,
  useCreateBoardSection,
  useReorderBoardSections,
  useUpdateBoardSection,
  useDeleteBoardSection,
  useTasks,
  useTaskViewPositions,
  useMoveTask,
  useReorderTasksInSection,
} from "@/hooks";
import {
  Actions,
  ModuleBase,
  useCanEdit,
  useCanDelete,
} from "@/lib/permissions";
import { DEFAULT_SECTION_COLORS } from "@/constants/Task/task";

import type { Board } from "@/types/task/board";
import type { BoardSection } from "@/types/task/board-section";
import type { Task, TaskViewPosition } from "@/types/task/task";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TaskCard } from "@/pages/Task/components/cards/TaskCard";
import { WithPermission } from "@/components/ui/with-permission";
import { TaskCardSkeleton } from "@/pages/Task/board/BoardSkeleton";

type Props = {
  board: Board;
  onCancelCreation?: () => void;
  statusFilter?: string[];
};

interface SortableSectionProps {
  section: {
    id: string;
    name: string;
    color: string;
  };
  editingSection: string | null;
  editSectionName: string;
  setEditSectionName: (name: string) => void;
  activeDropdown: string | null;
  onDropdownToggle: (id: string) => void;
  onRenameSection: (id: string, name: string) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onDeleteSection: (id: string) => void;
  onColorChange: (id: string, colorIndex: number) => void;
  getTasksForSection: (sectionId: string) => Task[];
  canEditBoardSection: boolean;
  canDeleteBoardSection: boolean;
  tasksLoading?: boolean;
}

function SortableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.strTaskGUID,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
    >
      <TaskCard
        task={task}
        variant="compact"
        showAssignee={true}
        showDates={true}
        showPriority={true}
        showProgress={false}
        showTags={true}
      />
    </div>
  );
}

function SortableSection({
  section,
  editingSection,
  editSectionName,
  setEditSectionName,
  activeDropdown,
  onDropdownToggle,
  onRenameSection,
  onSaveRename,
  onCancelRename,
  onDeleteSection,
  onColorChange,
  getTasksForSection,
  canEditBoardSection,
  canDeleteBoardSection,
  tasksLoading,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group/section flex w-80 h-[calc(100vh-270px)] flex-col overflow-hidden rounded-md border border-border-color bg-secondary text-xs shadow-sm shrink-0 min-h-0"
      data-section-id={section.id}
      onDragOver={(e) => {
        if ((e.dataTransfer?.types || []).includes("text/task-id")) {
          e.preventDefault();
        }
      }}
    >
      <div className="relative">
        {editingSection === section.id ? (
          <div className="m-0 p-2 font-semibold text-sm bg-secondary">
            <Input
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSaveRename(section.id);
                } else if (e.key === "Escape") {
                  onCancelRename();
                }
              }}
              onBlur={() => onSaveRename(section.id)}
              className="h-6 text-sm"
              autoFocus
            />
          </div>
        ) : (
          <div
            className="m-0 p-2 font-semibold text-sm text-white flex items-center justify-between group cursor-pointer"
            style={{ backgroundColor: section.color }}
            onClick={() => {
              if (canEditBoardSection || canDeleteBoardSection) {
                onDropdownToggle(section.id);
              }
            }}
            data-section-header
          >
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing opacity-90 group-hover:opacity-100 group-hover/section:opacity-100 transition-opacity"
              >
                {canEditBoardSection && <GripVertical className="h-4 w-4" />}
              </div>
              <span>{section.name}</span>
            </div>
            {(canEditBoardSection || canDeleteBoardSection) && (
              <ChevronDown className="h-4 w-4 opacity-90 group-hover:opacity-100 group-hover/section:opacity-100 transition-opacity" />
            )}
          </div>
        )}

        {activeDropdown === section.id && (
          <div
            className="absolute top-full w-full right-0 left-auto z-50 bg-card border border-border-color shadow-lg"
            onClick={(e) => e.stopPropagation()}
            data-dropdown-menu
          >
            <div className="p-2">
              <WithPermission module={ModuleBase.BOARD} action={Actions.EDIT}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameSection(section.id, section.name);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </Button>
              </WithPermission>
              <WithPermission module={ModuleBase.BOARD} action={Actions.DELETE}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Delete
                </Button>
              </WithPermission>
              <WithPermission module={ModuleBase.BOARD} action={Actions.EDIT}>
                <div className="px-3 py-1.5 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Colors
                    </span>
                  </div>
                  <div className="flex gap-4 justify-center">
                    {DEFAULT_SECTION_COLORS.map((color, index) => (
                      <button
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-150 ${
                          section.color === color
                            ? "scale-150 ring-1 ring-white"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onColorChange(section.id, index);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </WithPermission>
            </div>
          </div>
        )}
      </div>

      <div
        ref={setDropRef}
        className={`flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50 flex flex-col min-h-0 ${isOver ? "bg-muted/50" : ""}`}
      >
        {tasksLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, idx) => (
              <TaskCardSkeleton key={idx} />
            ))}
          </div>
        ) : getTasksForSection(section.id).length > 0 ? (
          <SortableContext
            items={getTasksForSection(section.id).map((t) => t.strTaskGUID)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {getTasksForSection(section.id).map((task) => (
                <div key={task.strTaskGUID} data-task-id={task.strTaskGUID}>
                  <SortableTask task={task} />
                </div>
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-sm text-muted-foreground">No Tasks</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Column = {
  id: string;
  name: string;
  color: string;
};

export default function KanbanSectionViewOld({
  board,
  onCancelCreation,
  statusFilter = [],
}: Props) {
  const canEditBoardSection = useCanEdit(ModuleBase.BOARD);
  const canDeleteBoardSection = useCanDelete(ModuleBase.BOARD);

  const { data: sectionsResponse } = useBoardSections({
    strBoardGUID: board.strBoardGUID,
  });
  const sections = useMemo(
    () => sectionsResponse?.data || [],
    [sectionsResponse]
  );
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    strBoardGUID: board.strBoardGUID,
    strStatus: statusFilter.length ? statusFilter.join(",") : undefined,
    pageSize: 1000, // Fetch all tasks for the board
  });
  const { data: taskViewPositions = [] } = useTaskViewPositions({
    pageSize: 1000, // Fetch all task view positions for the board
  });
  const createMutation = useCreateBoardSection();
  const updateMutation = useUpdateBoardSection();
  const deleteMutation = useDeleteBoardSection();
  const reorderMutation = useReorderBoardSections();
  const moveTaskMutation = useMoveTask();
  const reorderTasksMutation = useReorderTasksInSection();

  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [localColumns, setLocalColumns] = useState<Column[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Extract task list with proper typing
  const taskList: Task[] = useMemo(() => {
    return Array.isArray(tasks)
      ? (tasks as Task[])
      : (tasks as { data?: Task[] })?.data || [];
  }, [tasks]);

  // Local task positions used for smooth, optimistic reordering during drag
  const [localTaskPositions, setLocalTaskPositions] = useState<
    TaskViewPosition[]
  >([]);

  const serverTaskPositions: TaskViewPosition[] = useMemo(() => {
    return Array.isArray(taskViewPositions)
      ? (taskViewPositions as TaskViewPosition[])
      : (taskViewPositions as { data?: TaskViewPosition[] })?.data || [];
  }, [taskViewPositions]);

  // Keep local positions in sync with server when data changes
  useEffect(() => {
    setLocalTaskPositions(serverTaskPositions);
  }, [serverTaskPositions]);

  useEffect(() => {
    const serverColumns = sections
      .sort((a: BoardSection, b: BoardSection) => a.intPosition - b.intPosition)
      .map((s: BoardSection, index: number) => ({
        id: s.strBoardSectionGUID,
        name: s.strName,
        color:
          s.strColor ||
          DEFAULT_SECTION_COLORS[index % DEFAULT_SECTION_COLORS.length],
      }));
    setLocalColumns(serverColumns);
    setHasChanges(false);
  }, [sections]);

  const columns: Column[] = localColumns;

  const getTasksForSectionFromPositions = useCallback(
    (sectionId: string, positions: TaskViewPosition[]): Task[] => {
      const sectionTaskPositions = positions.filter(
        (tvp) => tvp.strBoardSectionGUID === sectionId
      );

      const foundTasks = sectionTaskPositions
        .map((tvp) =>
          taskList.find((task) => task.strTaskGUID === tvp.strTaskGUID)
        )
        .filter((task): task is Task => task !== undefined);

      const extraTasks = taskList.filter((task) => {
        if (task.strBoardSectionGUID !== sectionId) return false;

        // If this task exists in any position (even another section),
        // do not duplicate it in the old section while moving optimistically.
        const hasAnyPosition = positions.some(
          (tvp) => tvp.strTaskGUID === task.strTaskGUID
        );
        if (hasAnyPosition) return false;

        return !sectionTaskPositions.find(
          (tvp) => tvp.strTaskGUID === task.strTaskGUID
        );
      });

      return [...foundTasks, ...extraTasks].sort((a, b) => {
        const posA =
          sectionTaskPositions.find((tvp) => tvp.strTaskGUID === a?.strTaskGUID)
            ?.intPosition ?? 0;
        const posB =
          sectionTaskPositions.find((tvp) => tvp.strTaskGUID === b?.strTaskGUID)
            ?.intPosition ?? 0;
        return posA - posB;
      });
    },
    [taskList]
  );

  const getTasksForSection = useCallback(
    (sectionId: string): Task[] =>
      getTasksForSectionFromPositions(sectionId, localTaskPositions),
    [getTasksForSectionFromPositions, localTaskPositions]
  );

  useEffect(() => {
    if (sections.length === 0 && !isCreatingSection) {
      setIsCreatingSection(true);
    }
  }, [sections.length, isCreatingSection]);

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;

    const nextColorIndex = sections.length % DEFAULT_SECTION_COLORS.length;
    const defaultColor = DEFAULT_SECTION_COLORS[nextColorIndex];

    await createMutation.mutateAsync({
      strBoardGUID: board.strBoardGUID,
      strName: newSectionName.trim(),
      strColor: defaultColor,
    });
    setNewSectionName("");
    setIsCreatingSection(false);
  };

  const handleCancelCreate = () => {
    setNewSectionName("");
    setIsCreatingSection(false);

    if (sections.length === 0 && onCancelCreation) {
      onCancelCreation();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateSection();
    } else if (e.key === "Escape") {
      handleCancelCreate();
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Handle section reordering
    if (localColumns.some((col) => col.id === active.id)) {
      return;
    }

    // Handle task dragging
    const taskId = active.id as string;
    const task = taskList.find((t: Task) => t.strTaskGUID === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const findTaskSection = useCallback(
    (taskId: string, positions: TaskViewPosition[]) => {
      const fromPositions =
        positions.find((tvp) => tvp.strTaskGUID === taskId)
          ?.strBoardSectionGUID || null;
      if (fromPositions) return fromPositions;

      const task = taskList.find((t) => t.strTaskGUID === taskId);
      return task?.strBoardSectionGUID || null;
    },
    [taskList]
  );

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Handle section reordering
    const oldIndex = localColumns.findIndex(
      (column) => column.id === active.id
    );
    const newIndex = localColumns.findIndex((column) => column.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...localColumns];
      [newOrder[oldIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[oldIndex],
      ];

      setLocalColumns(newOrder);
      setHasChanges(true);
      return;
    }

    // Optimistically preview task movement across sections so a shadow/placeholder is visible
    const activeTask = taskList.find((t) => t.strTaskGUID === active.id);
    if (!activeTask) return;

    const targetSectionId =
      localColumns.find((col) => col.id === over.id)?.id ||
      findTaskSection(over.id as string, localTaskPositions);
    const currentSectionId = findTaskSection(
      active.id as string,
      localTaskPositions
    );

    if (
      !targetSectionId ||
      !currentSectionId ||
      targetSectionId === currentSectionId
    ) {
      return;
    }

    setLocalTaskPositions((prev) => {
      const activeContainer = findTaskSection(active.id as string, prev);
      const overContainer =
        localColumns.find((col) => col.id === over.id)?.id ||
        findTaskSection(over.id as string, prev);

      if (
        !activeContainer ||
        !overContainer ||
        activeContainer === overContainer
      ) {
        return prev;
      }

      const withoutActive = prev.filter((tvp) => tvp.strTaskGUID !== active.id);

      const targetTasks = getTasksForSectionFromPositions(
        overContainer,
        withoutActive
      );
      const overIndex =
        overContainer === over.id
          ? targetTasks.length
          : targetTasks.findIndex((task) => task.strTaskGUID === over.id);
      const insertIndex = overIndex >= 0 ? overIndex : targetTasks.length;

      const shifted = withoutActive.map((tvp) => {
        if (
          tvp.strBoardSectionGUID === overContainer &&
          (tvp.intPosition ?? 0) >= insertIndex
        ) {
          return { ...tvp, intPosition: (tvp.intPosition ?? 0) + 1 };
        }
        return tvp;
      });

      return [
        ...shifted,
        {
          strTaskGUID: active.id as string,
          strBoardSectionGUID: overContainer,
          intPosition: insertIndex,
        } as TaskViewPosition,
      ];
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over || active.id === over.id) {
      // Handle section reordering if needed
      if (hasChanges) {
        const orderedIds = localColumns.map((column) => column.id);
        await reorderMutation.mutateAsync({
          boardGuid: board.strBoardGUID,
          orderedSectionGUIDs: orderedIds,
        });
        setHasChanges(false);
      }
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log(`[DragEnd] activeId=${activeId}, overId=${overId}`);
    console.log(
      `[DragEnd] localColumns:`,
      localColumns.map((col) => ({ id: col.id, name: col.name }))
    );

    // Check if we're reordering sections
    const activeSectionIndex = localColumns.findIndex(
      (col) => col.id === activeId
    );
    const overSectionIndex = localColumns.findIndex((col) => col.id === overId);

    if (activeSectionIndex !== -1 && overSectionIndex !== -1) {
      // Section reordering
      if (hasChanges) {
        const orderedIds = localColumns.map((column) => column.id);
        await reorderMutation.mutateAsync({
          boardGuid: board.strBoardGUID,
          orderedSectionGUIDs: orderedIds,
        });
        setHasChanges(false);
      }
      return;
    }

    // Handle task movement
    const draggedTask = taskList.find((t: Task) => t.strTaskGUID === activeId);
    if (!draggedTask) return;

    // Find which section the task is currently in - use the task's own section GUID (not stale cache)
    let currentSectionId = draggedTask.strBoardSectionGUID;

    // If task doesn't have a section assigned, try to get it from positions cache
    if (!currentSectionId) {
      const activeTaskPosition = localTaskPositions.find(
        (tvp: TaskViewPosition) => tvp.strTaskGUID === activeId
      );
      currentSectionId = activeTaskPosition?.strBoardSectionGUID || null;
    }

    // If we can't find current section, log it and return
    if (!currentSectionId) {
      console.warn(
        `[DragEnd] Could not find current section for task ${activeId}. Task data:`,
        {
          strBoardSectionGUID: draggedTask.strBoardSectionGUID,
          strBoardSectionName: draggedTask.strBoardSectionName,
        }
      );
      return;
    }

    console.log(
      `[DragEnd] Found current section: ${currentSectionId} (${draggedTask.strBoardSectionName}) for task ${activeId}`
    );

    // Determine target section
    let targetSectionId: string | null = null;
    let targetPosition: number | null = null;

    // Check if over is a section (droppable area)
    const overSection = localColumns.find((col) => col.id === overId);
    console.log(`[DragEnd] overSection found:`, overSection);

    if (overSection) {
      // Dragging over an empty section or section header
      targetSectionId = overSection.id;
      targetPosition = null; // Will be appended at the end
      console.log(`[DragEnd] Dragging over empty section: ${targetSectionId}`);
    } else {
      // Over is another task, find its section
      const overTaskPosition = localTaskPositions.find(
        (tvp: TaskViewPosition) => tvp.strTaskGUID === overId
      );
      console.log(`[DragEnd] overTaskPosition:`, overTaskPosition);

      if (overTaskPosition) {
        targetSectionId = overTaskPosition.strBoardSectionGUID;
        // Find the position index of the task we're over
        const targetSectionTasks = getTasksForSection(targetSectionId);
        targetPosition = targetSectionTasks.findIndex(
          (t) => t.strTaskGUID === overId
        );
        console.log(
          `[DragEnd] Dragging over task in section: ${targetSectionId} at position ${targetPosition}`
        );
      }
    }

    if (!targetSectionId) {
      console.warn(`[DragEnd] Could not find target section for drop`);
      return;
    }

    // Check if this is a move between sections or a reorder within the same section
    const isDifferentSection = currentSectionId !== targetSectionId;

    console.log(
      `[DragEnd] Task ${activeId}: currentSection=${currentSectionId}, targetSection=${targetSectionId}, isDifferent=${isDifferentSection}, targetPosition=${targetPosition}`
    );

    // Same section - reorder within section
    if (!isDifferentSection && targetPosition !== null) {
      console.log(`[DragEnd] Reordering task within same section`);
      const sectionTasks = getTasksForSection(targetSectionId);
      const taskIds = sectionTasks.map((t) => t.strTaskGUID);
      const oldIndex = taskIds.indexOf(activeId);
      const newIndex = taskIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedIds = arrayMove(taskIds, oldIndex, newIndex);

        // Optimistically update local positions for smooth in-section transitions
        setLocalTaskPositions((prev) => {
          const updated = [...prev];
          reorderedIds.forEach((id, index) => {
            const idx = updated.findIndex(
              (tvp) =>
                tvp.strTaskGUID === id &&
                tvp.strBoardSectionGUID === targetSectionId
            );
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                intPosition: index,
              };
            }
          });
          return updated;
        });

        // Persist new order on the server
        await reorderTasksMutation.mutateAsync({
          strBoardSectionGUID: targetSectionId,
          orderedTaskGUIDs: reorderedIds,
        });
      }
    } else if (isDifferentSection) {
      console.log(`[DragEnd] Moving task to different section`);
      const previousPositions = localTaskPositions;
      // Different section - move task to new section
      setLocalTaskPositions((prev) => {
        const updated = prev.filter((tvp) => tvp.strTaskGUID !== activeId);

        // Determine insertion index in target section
        const targetSectionTasks = getTasksForSection(targetSectionId);
        const basePositions = targetSectionTasks.map((t) => t.strTaskGUID);
        const insertIndex =
          targetPosition !== null && targetPosition >= 0
            ? targetPosition
            : basePositions.length;

        // Shift positions of existing tasks in target section
        const result = updated.map((tvp) => {
          if (
            tvp.strBoardSectionGUID === targetSectionId &&
            (tvp.intPosition ?? 0) >= insertIndex
          ) {
            return { ...tvp, intPosition: (tvp.intPosition ?? 0) + 1 };
          }
          return tvp;
        });

        // Add / update the moved task
        result.push({
          strTaskGUID: activeId,
          strBoardSectionGUID: targetSectionId,
          intPosition: insertIndex,
        } as TaskViewPosition);

        return result;
      });

      console.log(
        `[DragEnd] Moving task ${activeId} to section ${targetSectionId}`
      );

      try {
        await moveTaskMutation.mutateAsync({
          taskGuid: activeId,
          request: {
            strBoardGUID: board.strBoardGUID,
            strBoardSectionGUID: targetSectionId,
            intPosition:
              targetPosition !== null && targetPosition >= 0
                ? targetPosition
                : null,
          },
        });
        console.log(`[DragEnd] Successfully moved task ${activeId}`);
      } catch (error) {
        console.error(`[DragEnd] Failed to move task ${activeId}:`, error);
        setLocalTaskPositions(previousPositions);
      }
    }
  };

  const handleDropdownToggle = (sectionId: string) => {
    setActiveDropdown(activeDropdown === sectionId ? null : sectionId);
  };

  const handleRenameSection = (sectionId: string, currentName: string) => {
    setEditingSection(sectionId);
    setEditSectionName(currentName);
    setActiveDropdown(null);
  };

  const handleSaveRename = async (sectionId: string) => {
    if (!editSectionName.trim()) return;

    const section = sections.find(
      (s: BoardSection) => s.strBoardSectionGUID === sectionId
    );
    if (!section) return;

    await updateMutation.mutateAsync({
      id: sectionId,
      data: {
        strName: editSectionName.trim(),
        strColor: section.strColor || undefined,
        intPosition: section.intPosition,
      },
    });

    setEditingSection(null);
    setEditSectionName("");
  };

  const handleCancelRename = () => {
    setEditingSection(null);
    setEditSectionName("");
  };

  const handleDeleteSection = (sectionId: string) => {
    setSectionToDelete(sectionId);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!sectionToDelete) return;

    await deleteMutation.mutateAsync({ id: sectionToDelete });
    setShowDeleteConfirm(false);
    setSectionToDelete(null);
  };

  const handleColorChange = async (sectionId: string, colorIndex: number) => {
    const newColor = DEFAULT_SECTION_COLORS[colorIndex];

    const section = sections.find(
      (s: BoardSection) => s.strBoardSectionGUID === sectionId
    );
    if (!section) return;

    await updateMutation.mutateAsync({
      id: sectionId,
      data: {
        strName: section.strName,
        strColor: newColor,
        intPosition: section.intPosition,
      },
    });

    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const target = event.target as Element;
        if (
          !target.closest("[data-dropdown-menu]") &&
          !target.closest("[data-section-header]")
        ) {
          setActiveDropdown(null);
        }
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  return (
    <div className="flex gap-4 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <SortableSection
              key={column.id}
              section={column}
              editingSection={editingSection}
              editSectionName={editSectionName}
              setEditSectionName={setEditSectionName}
              activeDropdown={activeDropdown}
              onDropdownToggle={handleDropdownToggle}
              onRenameSection={handleRenameSection}
              onSaveRename={handleSaveRename}
              onCancelRename={handleCancelRename}
              onDeleteSection={handleDeleteSection}
              onColorChange={handleColorChange}
              getTasksForSection={getTasksForSection}
              canEditBoardSection={canEditBoardSection}
              canDeleteBoardSection={canDeleteBoardSection}
              tasksLoading={tasksLoading}
            ></SortableSection>
          ))}
        </SortableContext>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 rotate-2">
                  <TaskCard
                    task={activeTask}
                    variant="compact"
                    showAssignee={true}
                    showDates={true}
                    showPriority={true}
                    showProgress={false}
                    showTags={true}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {isCreatingSection ? (
        <div className="flex w-80 h-[calc(100vh-270px)] flex-col overflow-hidden rounded-md border border-border-color bg-secondary text-xs shadow-sm shrink-0">
          <div className="p-3">
            <Input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleCancelCreate}
              placeholder="Enter module name..."
              className="h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
      ) : (
        <WithPermission module={ModuleBase.BOARD} action={Actions.SAVE}>
          <div
            className="flex w-80 h-[calc(100vh-270px)] flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-secondary/50 text-sm shrink-0 hover:border-primary/50 hover:bg-secondary/70 transition-colors cursor-pointer group"
            onClick={() => setIsCreatingSection(true)}
          >
            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-muted-foreground group-hover:text-primary transition-colors mt-2">
              Add Modules
            </span>
          </div>
        </WithPermission>
      )}

      <DeleteConfirmationDialog
        title="Delete Module"
        description="Are you sure you want to delete this module? This action cannot be undone and may affect related tasks."
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
