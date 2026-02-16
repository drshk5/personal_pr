import { useState } from "react";
import { X, Check, GripVertical, PlusCircle, Pencil } from "lucide-react";

import type { TaskChecklist } from "@/types/task/checklist";

import { cn } from "@/lib/utils";

import {
  useDeleteTaskChecklist,
  useCompleteTaskChecklist,
  useUncompleteTaskChecklist,
  useReorderTaskChecklists,
  useUpdateTaskChecklist,
} from "@/hooks/api/task/use-task-checklist";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskChecklistSectionProps {
  mode: "create" | "edit";
  taskGUID?: string;
  readOnly?: boolean;
  createModeChecklists: string[];
  onCreateModeChecklistsChange: (checklists: string[]) => void;
  checklists?: TaskChecklist[] | null;
  editModeChecklists?: string[];
  onEditModeChecklistsChange?: (checklists: string[]) => void;
}

export function TaskChecklistSection({
  mode,
  taskGUID,
  readOnly = false,
  createModeChecklists,
  onCreateModeChecklistsChange,
  checklists,
  editModeChecklists = [],
  onEditModeChecklistsChange,
}: TaskChecklistSectionProps) {
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState<string>("");
  const [editingChecklistIndex, setEditingChecklistIndex] = useState<number | null>(null);

  // Sort checklists by position
  const checklistItems =
    mode === "edit"
      ? [...(checklists || [])].sort((a, b) => a.intPosition - b.intPosition)
      : [];

  const displayChecklists: (TaskChecklist & { mode?: string })[] =
    mode === "create"
      ? (createModeChecklists.map((text, index) => ({
          strTaskChecklistGUID: index.toString(),
          strTaskGUID: "",
          strTitle: text,
          bolIsCompleted: false,
          intPosition: index,
          dtCreatedOn: new Date().toISOString(),
          dtUpdatedOn: new Date().toISOString(),
          strCreatedByGUID: "",
          mode: "create",
        })) as (TaskChecklist & { mode?: string })[])
      : [
          ...checklistItems,
          ...editModeChecklists.map((text, index) => ({
            strTaskChecklistGUID: `new-${index}`,
            strTaskGUID: "",
            strTitle: text,
            bolIsCompleted: false,
            intPosition: checklistItems.length + index,
            dtCreatedOn: new Date().toISOString(),
            dtUpdatedOn: new Date().toISOString(),
            strCreatedByGUID: "",
            mode: "create",
          })),
        ];

  const deleteChecklistMutation = useDeleteTaskChecklist();
  const completeChecklistMutation = useCompleteTaskChecklist();
  const uncompleteChecklistMutation = useUncompleteTaskChecklist();
  const reorderChecklistMutation = useReorderTaskChecklists();
  const updateChecklistMutation = useUpdateTaskChecklist();

  const handleAddChecklistItem = async () => {
    if (newChecklistItem.trim()) {
      if (mode === "create") {
        onCreateModeChecklistsChange([
          ...createModeChecklists,
          newChecklistItem.trim(),
        ]);
        setNewChecklistItem("");
      } else if (mode === "edit") {
        // In edit mode, collect new checklists locally like create mode
        onEditModeChecklistsChange?.([
          ...editModeChecklists,
          newChecklistItem.trim(),
        ]);
        setNewChecklistItem("");
      }
    }
  };

  const handleChecklistInputBlur = () => {
    if (!newChecklistItem.trim()) {
      setShowChecklistInput(false);
      setNewChecklistItem("");
    }
  };

  const handleToggleChecklistItem = async (
    checklistItem: TaskChecklist & { mode?: string }
  ) => {
    if (checklistItem.mode === "create") return;

    if (checklistItem.bolIsCompleted) {
      await uncompleteChecklistMutation.mutateAsync({
        id: checklistItem.strTaskChecklistGUID,
        taskGUID,
      });
    } else {
      await completeChecklistMutation.mutateAsync({
        id: checklistItem.strTaskChecklistGUID,
        taskGUID,
      });
    }
  };

  const handleDeleteChecklistItem = async (checklistGuid: string) => {
    if (mode === "create") {
      const index = parseInt(checklistGuid);
      onCreateModeChecklistsChange(
        createModeChecklists.filter((_, i) => i !== index)
      );
    } else if (mode === "edit") {
      // Check if it's a newly added item (starts with 'new-')
      if (checklistGuid.startsWith("new-")) {
        const index = parseInt(checklistGuid.replace("new-", ""));
        onEditModeChecklistsChange?.(
          editModeChecklists.filter((_, i) => i !== index)
        );
      } else {
        // It's an existing checklist, delete via API
        await deleteChecklistMutation.mutateAsync({ id: checklistGuid });
      }
    }
  };


  const handleStartEditChecklist = (
    checklistItem: TaskChecklist & { mode?: string },
    index: number
  ) => {
    if (readOnly) return;
    // In create mode, allow edit only if not completed and mode is create
    if (mode === "create" && checklistItem.mode === "create") {
      setEditingChecklistId(checklistItem.strTaskChecklistGUID);
      setEditingChecklistText(checklistItem.strTitle);
      setEditingChecklistIndex(index);
    } else if (mode === "edit") {
      setEditingChecklistId(checklistItem.strTaskChecklistGUID);
      setEditingChecklistText(checklistItem.strTitle);
      setEditingChecklistIndex(null);
    }
  };


  const handleSaveEditChecklist = async () => {
    if (!editingChecklistId) return;
    const trimmed = editingChecklistText.trim();
    if (trimmed.length === 0) {
      setEditingChecklistId(null);
      setEditingChecklistText("");
      setEditingChecklistIndex(null);
      return;
    }
    if (mode === "create" && editingChecklistIndex !== null) {
      // Update local createModeChecklists
      const updated = [...createModeChecklists];
      updated[editingChecklistIndex] = trimmed;
      onCreateModeChecklistsChange(updated);
      setEditingChecklistId(null);
      setEditingChecklistText("");
      setEditingChecklistIndex(null);
    } else if (mode === "edit") {
      // Check if it's a newly added item (starts with 'new-')
      if (editingChecklistId.startsWith("new-")) {
        const index = parseInt(editingChecklistId.replace("new-", ""));
        const updated = [...editModeChecklists];
        updated[index] = trimmed;
        onEditModeChecklistsChange?.(updated);
      } else {
        // It's an existing checklist, update via API
        await updateChecklistMutation.mutateAsync({
          id: editingChecklistId,
          data: { strTitle: trimmed },
        });
      }
      setEditingChecklistId(null);
      setEditingChecklistText("");
      setEditingChecklistIndex(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, checklistGuid: string) => {
    setDraggedItem(checklistGuid);
    e.dataTransfer.setData("text/plain", checklistGuid);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetGuid: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetGuid || !taskGUID) {
      setDraggedItem(null);
      return;
    }

    const currentOrder = checklistItems.map(
      (item) => item.strTaskChecklistGUID
    );

    const draggedIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetGuid);

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    await reorderChecklistMutation.mutateAsync({
      taskId: taskGUID,
      checklistIds: newOrder,
    });
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="space-y-2">
      {displayChecklists.length > 0 && (
        <div className="space-y-1">
          {displayChecklists.map((item, idx) => {
            const isEditing = editingChecklistId === item.strTaskChecklistGUID;
            return (
              <div
                key={item.strTaskChecklistGUID}
                className={`flex items-center gap-2 p-2 w-full bg-muted/50 rounded overflow-hidden ${
                  draggedItem === item.strTaskChecklistGUID ? "opacity-50" : ""
                }`}
                draggable={mode === "edit" && !isEditing && !readOnly}
                onDragStart={(e) =>
                  mode === "edit" &&
                  !isEditing &&
                  !readOnly &&
                  handleDragStart(e, item.strTaskChecklistGUID)
                }
                onDragOver={
                  mode === "edit" && !isEditing && !readOnly
                    ? handleDragOver
                    : undefined
                }
                onDrop={(e) =>
                  mode === "edit" &&
                  !isEditing &&
                  !readOnly &&
                  handleDrop(e, item.strTaskChecklistGUID)
                }
                onDragEnd={
                  mode === "edit" && !isEditing && !readOnly
                    ? handleDragEnd
                    : undefined
                }
              >
                {!readOnly && mode === "edit" && (
                  <div
                    className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground"
                    draggable={false}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}
                {mode === "create" && (
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full border shrink-0 bg-white border-muted-foreground text-transparent cursor-default"
                    )}
                    draggable={false}
                    disabled
                  />
                )}
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={() => handleToggleChecklistItem(item)}
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full border shrink-0 cursor-pointer",
                      item.bolIsCompleted
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-muted-foreground text-transparent hover:border-primary"
                    )}
                    draggable={false}
                  >
                    {item.bolIsCompleted && <Check className="h-3 w-3" />}
                  </button>
                )}
                <div className="flex-1 min-w-0 max-w-sm text-sm overflow-hidden">
                  {isEditing ? (
                    <Input
                      value={editingChecklistText}
                      onChange={(e) => setEditingChecklistText(e.target.value)}
                      onBlur={handleSaveEditChecklist}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveEditChecklist();
                        } else if (e.key === "Escape") {
                          setEditingChecklistId(null);
                          setEditingChecklistText("");
                          setEditingChecklistIndex(null);
                        }
                      }}
                      autoFocus
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span
                      className={cn(
                        "block truncate cursor-default ",
                        item.bolIsCompleted &&
                          "line-through text-muted-foreground"
                      )}
                      title={item.strTitle}
                    >
                      {item.strTitle}
                    </span>
                  )}
                </div>
                {/* Action buttons container */}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  {/* Pencil icon for edit, only in create mode and not started state */}
                  {!readOnly && !isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditChecklist(item, idx)}
                      className="h-6 w-6 p-0"
                      tabIndex={-1}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteChecklistItem(item.strTaskChecklistGUID)
                      }
                      className="h-6 w-6 p-0"
                      draggable={false}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && !showChecklistInput && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowChecklistInput(true)}
          className="w-fit justify-start text-foreground border border-border-color hover:text-foreground bg-muted/30"
        >
          <PlusCircle className="h-3 w-3" />
          Add Sub Task
        </Button>
      )}

      {showChecklistInput && !readOnly && (
        <div className="flex gap-2">
          <Input
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            placeholder="Enter Sub Task..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChecklistItem();
              }
            }}
            onBlur={handleChecklistInputBlur}
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowChecklistInput(false);
              setNewChecklistItem("");
            }}
            className="h-10 w-10 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
