import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  GripVertical,
  ChevronDown,
  Edit,
  Trash2,
  Palette,
} from "lucide-react";

import type { Board } from "@/types/task/board";
import type { BoardSection } from "@/types/task/board-section";
import type { Task, TaskViewPosition } from "@/types/task/task";

import {
  Actions,
  ModuleBase,
  useCanEdit,
  useCanDelete,
} from "@/lib/permissions";

import { DEFAULT_SECTION_COLORS } from "@/constants/Task/task";

import {
  useBoardSections,
  useCreateBoardSection,
  useReorderBoardSections,
  useTasks,
  useTaskViewPositions,
  useUpdateBoardSection,
  useDeleteBoardSection,
  useMoveTask,
  useReorderTasksInSection,
} from "@/hooks";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import { TaskCard } from "@/pages/Task/components/cards/TaskCard";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { WithPermission } from "@/components/ui/with-permission";

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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

type Props = {
  board: Board;
  onCancelCreation?: () => void;
  statusFilter?: string[];
};

type Group = {
  id: string;
  name: string;
  color: string;
};

interface SortableListGroupProps {
  group: {
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
  children?: React.ReactNode;
  canEditBoardSection: boolean;
  canDeleteBoardSection: boolean;
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

function SortableListGroup({
  group,
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
  children,
  canEditBoardSection,
  canDeleteBoardSection,
}: SortableListGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: group.id });

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
      className="bg-secondary transition-colors group/section rounded-lg border border-border-color flex flex-col h-[calc(100vh-270px)] min-h-0"
      data-section-id={group.id}
      onDragOver={(e) => {
        if ((e.dataTransfer?.types || []).includes("text/task-id")) {
          e.preventDefault();
        }
      }}
    >
      <div className="relative">
        {editingSection === group.id ? (
          <div className="m-0 p-3 font-semibold text-sm bg-secondary">
            <Input
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveRename(group.id);
                else if (e.key === "Escape") onCancelRename();
              }}
              onBlur={() => onSaveRename(group.id)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-between bg-foreground/5 p-3 text-foreground cursor-pointer group rounded-t-lg"
            onClick={() => {
              if (canEditBoardSection || canDeleteBoardSection) {
                onDropdownToggle(group.id);
              }
            }}
            data-section-header
            style={{ backgroundColor: "transparent" }}
          >
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing opacity-90 group-hover:opacity-100 group-hover/section:opacity-100 transition-opacity"
              >
                {canEditBoardSection && <GripVertical className="h-4 w-4" />}
              </div>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <p className="m-0 font-semibold text-sm">{group.name}</p>
            </div>
            {(canEditBoardSection || canDeleteBoardSection) && (
              <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover/section:opacity-100 transition-opacity" />
            )}
          </div>
        )}

        {activeDropdown === group.id && (
          <div
            className="absolute top-14 right-0 left-auto z-50 w-fit bg-card border border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
            data-dropdown-menu
          >
            <div className="p-2">
              <WithPermission module={ModuleBase.BOARD} action={Actions.EDIT}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameSection(group.id, group.name);
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
                  className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(group.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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
                          group.color === color
                            ? "scale-150 ring-1 ring-white"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onColorChange(group.id, index);
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
        className={`flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50 min-h-0 ${
          isOver ? "bg-muted/50" : ""
        }`}
      >
        {getTasksForSection(group.id).length > 0 ? (
          <SortableContext
            items={getTasksForSection(group.id).map((t) => t.strTaskGUID)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {getTasksForSection(group.id).map((task) => (
                <div key={task.strTaskGUID} data-task-id={task.strTaskGUID}>
                  <SortableTask task={task} />
                </div>
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="flex items-center justify-center py-8 text-center min-h-40">
            <div>
              <div className="text-sm text-muted-foreground">No Tasks</div>
            </div>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

export default function ListSectionView({
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
  const { data: tasks = [] } = useTasks({
    strBoardGUID: board.strBoardGUID,
    strStatus: statusFilter.length ? statusFilter.join(",") : undefined,
    pageSize: 1000, // Fetch all tasks for the board
  });
  const { data: taskViewPositions = [] } = useTaskViewPositions({
    pageSize: 1000, // Fetch all task view positions for the board
  });
  const createMutation = useCreateBoardSection();
  const reorderMutation = useReorderBoardSections();
  const updateMutation = useUpdateBoardSection();
  const deleteMutation = useDeleteBoardSection();
  const moveTaskMutation = useMoveTask();
  const reorderTasksMutation = useReorderTasksInSection();

  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isManualCreation, setIsManualCreation] = useState(false);
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

  const [localGroups, setLocalGroups] = useState<Group[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

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

  const getTasksForSection = useCallback(
    (sectionId: string): Task[] => {
      const sectionTaskPositions = localTaskPositions.filter(
        (tvp) => tvp.strBoardSectionGUID === sectionId
      );

      const foundTasks = sectionTaskPositions
        .map((tvp) =>
          taskList.find((task) => task.strTaskGUID === tvp.strTaskGUID)
        )
        .filter((task): task is Task => task !== undefined);

      // Also include tasks that belong to this section but don't have positions yet
      const extraTasks = taskList.filter(
        (task) =>
          task.strBoardSectionGUID === sectionId &&
          !sectionTaskPositions.find(
            (tvp) => tvp.strTaskGUID === task.strTaskGUID
          )
      );

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
    [localTaskPositions, taskList]
  );

  useEffect(() => {
    const serverGroups = sections
      .sort((a: BoardSection, b: BoardSection) => a.intPosition - b.intPosition)
      .map((s: BoardSection, index: number) => ({
        id: s.strBoardSectionGUID,
        name: s.strName,
        color:
          s.strColor ||
          DEFAULT_SECTION_COLORS[index % DEFAULT_SECTION_COLORS.length],
      }));
    setLocalGroups(serverGroups);
    setHasChanges(false);
  }, [sections]);

  const groups: Group[] = localGroups;

  useEffect(() => {
    if (sections.length === 0 && !isCreatingSection) {
      setIsCreatingSection(true);
      setIsManualCreation(false);
    }
  }, [sections.length, isCreatingSection]);

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
    setIsManualCreation(false);
    toast.success("Section created successfully!");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateSection();
    } else if (e.key === "Escape") {
      handleCancelCreate();
    }
  };

  const handleCancelCreate = () => {
    setNewSectionName("");
    setIsCreatingSection(false);
    setIsManualCreation(false);

    if (sections.length === 0 && onCancelCreation) {
      onCancelCreation();
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
    const section = sections.find((s) => s.strBoardSectionGUID === sectionId);
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
    toast.success("Section deleted successfully!");
  };

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Handle section reordering
    if (localGroups.some((group) => group.id === active.id)) {
      return;
    }

    // Handle task dragging
    const taskId = active.id as string;
    const task = taskList.find((t: Task) => t.strTaskGUID === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Handle section reordering
    const oldIndex = localGroups.findIndex((group) => group.id === active.id);
    const newIndex = localGroups.findIndex((group) => group.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...localGroups];
      [newOrder[oldIndex], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[oldIndex],
      ];

      setLocalGroups(newOrder);
      setHasChanges(true);
      return;
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over || active.id === over.id) {
      // Handle section reordering if needed
      if (hasChanges) {
        const orderedIds = localGroups.map((group) => group.id);
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

    // Check if we're reordering sections
    const activeSectionIndex = localGroups.findIndex(
      (group) => group.id === activeId
    );
    const overSectionIndex = localGroups.findIndex(
      (group) => group.id === overId
    );

    if (activeSectionIndex !== -1 && overSectionIndex !== -1) {
      // Section reordering
      if (hasChanges) {
        const orderedIds = localGroups.map((group) => group.id);
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

    // Find which section the task is currently in
    const activeTaskPosition = localTaskPositions.find(
      (tvp: TaskViewPosition) => tvp.strTaskGUID === activeId
    );
    const currentSectionId = activeTaskPosition?.strBoardSectionGUID;

    // Determine target section
    let targetSectionId: string | null = null;
    let targetPosition: number | null = null;

    // Check if over is a section (droppable area)
    const overSection = localGroups.find((group) => group.id === overId);
    if (overSection) {
      // Dragging over an empty section or section header
      targetSectionId = overSection.id;
      targetPosition = null; // Will be appended at the end
    } else {
      // Over is another task, find its section
      const overTaskPosition = localTaskPositions.find(
        (tvp: TaskViewPosition) => tvp.strTaskGUID === overId
      );
      if (overTaskPosition) {
        targetSectionId = overTaskPosition.strBoardSectionGUID;
        // Find the position index of the task we're over
        const targetSectionTasks = getTasksForSection(targetSectionId);
        targetPosition = targetSectionTasks.findIndex(
          (t) => t.strTaskGUID === overId
        );
      }
    }

    if (!targetSectionId) return;

    // Same section - reorder within section
    if (currentSectionId === targetSectionId && targetPosition !== null) {
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
    } else {
      // Different section or appending to section - move task to new section
      setLocalTaskPositions((prev) => {
        const updated = prev.filter((tvp) => tvp.strTaskGUID !== activeId);

        // Determine insertion index in target section
        const targetSectionTasks = getTasksForSection(targetSectionId!);
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
          strBoardSectionGUID: targetSectionId!,
          intPosition: insertIndex,
        } as TaskViewPosition);

        return result;
      });

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
    }
  };

  return (
    <div className="space-y-4">
      {isCreatingSection && !isManualCreation && (
        <div className="bg-secondary border border-border rounded-md p-4">
          <Input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleCancelCreate}
            placeholder="Enter Modules name in list section form"
            className="w-full"
            autoFocus
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {groups.map((group) => (
            <SortableListGroup
              key={group.id}
              group={group}
              editingSection={editingSection}
              editSectionName={editSectionName}
              setEditSectionName={setEditSectionName}
              activeDropdown={activeDropdown}
              onDropdownToggle={handleDropdownToggle}
              onRenameSection={handleRenameSection}
              onSaveRename={handleSaveRename}
              onCancelRename={handleCancelRename}
              onDeleteSection={handleDeleteSection}
              onColorChange={(id, idx) => {
                const section = sections.find(
                  (s: BoardSection) => s.strBoardSectionGUID === id
                );
                if (!section) return;
                const newColor = DEFAULT_SECTION_COLORS[idx];
                updateMutation.mutateAsync({
                  id: id,
                  data: {
                    strName: section.strName,
                    strColor: newColor,
                    intPosition: section.intPosition,
                  },
                });
                setActiveDropdown(null);
              }}
              getTasksForSection={getTasksForSection}
              canEditBoardSection={canEditBoardSection}
              canDeleteBoardSection={canDeleteBoardSection}
            ></SortableListGroup>
          ))}
        </SortableContext>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90">
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

      {isCreatingSection && isManualCreation && (
        <div className="bg-secondary border border-border rounded-md p-4">
          <Input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleCancelCreate}
            placeholder="Enter Modules name..."
            className="w-full"
            autoFocus
          />
        </div>
      )}

      {!isCreatingSection && (
        <WithPermission module={ModuleBase.BOARD} action={Actions.SAVE}>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setIsCreatingSection(true);
                setIsManualCreation(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
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
