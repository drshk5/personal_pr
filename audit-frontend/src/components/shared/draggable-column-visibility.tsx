import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Settings,
  GripVertical,
  Pin,
  PinOff,
  Lock,
  Search,
  X,
  WrapText,
  Scissors,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";

export interface ColumnState {
  id: string;
  label: string;
  visible: boolean;
  pinned?: boolean;
  order: number;
}

interface DraggableColumnVisibilityProps<T> {
  columns: DataTableColumn<T>[];
  columnVisibility: { [key: string]: boolean };
  toggleColumnVisibility: (key: string) => void;
  resetColumnVisibility: () => void;
  hasVisibleContentColumns: () => boolean;
  getAlwaysVisibleColumns?: () => string[];
  isTextWrapped?: boolean;
  toggleTextWrapping?: () => void;
  pinnedColumns?: string[];
  pinColumn?: (key: string) => void;
  unpinColumn?: (key: string) => void;
  resetPinnedColumns?: () => void;
  onColumnOrderChange?: (orderedColumns: string[]) => void;
  onResetAll?: () => void; // Callback to reset all column settings
}

// Sortable column item component
interface SortableColumnItemProps {
  id: string;
  label: string;
  visible: boolean;
  pinned: boolean;
  disabled: boolean;
  isActionsColumn: boolean;
  canPin: boolean;
  onVisibilityChange: (checked: boolean) => void;
  onPinToggle: () => void;
}

function SortableColumnItem({
  id,
  label,
  visible,
  pinned,
  disabled,
  isActionsColumn,
  canPin,
  onVisibilityChange,
  onPinToggle,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isActionsColumn });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent transition-colors ${
        isDragging ? "shadow-md bg-background" : ""
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`shrink-0 ${
          isActionsColumn
            ? "cursor-not-allowed text-muted-foreground/30"
            : "cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground"
        }`}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Checkbox (hidden when locked) and lock indicator */}
      <div className="shrink-0 flex items-center gap-2">
        {disabled ? (
          <Lock className="h-4 w-4 text-muted-foreground/70" />
        ) : (
          <Checkbox
            checked={visible}
            onCheckedChange={(checked) => {
              if (disabled) return;
              onVisibilityChange(Boolean(checked));
            }}
            id={`column-${id}`}
            disabled={disabled}
            className="h-4 w-4 rounded border-border-color/70 bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 shadow-[0_1px_0_rgba(0,0,0,0.05)]"
          />
        )}
      </div>

      {/* Label */}
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          onVisibilityChange(!visible);
        }}
        className={`flex-1 text-left text-sm select-none ${
          !visible && !disabled ? "text-muted-foreground" : ""
        } ${disabled ? "cursor-not-allowed text-muted-foreground/70" : "cursor-pointer"}`}
        disabled={disabled}
      >
        {label}
      </button>

      {/* Pin Icon */}
      {visible && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPinToggle();
          }}
          className={`shrink-0 p-1 rounded ${
            canPin
              ? "text-primary"
              : "text-muted-foreground/30 cursor-not-allowed"
          }`}
          disabled={!canPin}
        >
          {pinned ? (
            <PinOff className="h-3.5 w-3.5" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

// Main component
export function DraggableColumnVisibility<T>({
  columns,
  columnVisibility,
  toggleColumnVisibility,
  resetColumnVisibility, // Kept for backward compatibility
  hasVisibleContentColumns, // Kept for backward compatibility
  getAlwaysVisibleColumns,
  isTextWrapped, // Kept for backward compatibility
  toggleTextWrapping, // Kept for backward compatibility
  pinnedColumns = [],
  pinColumn,
  unpinColumn,
  resetPinnedColumns, // Kept for backward compatibility
  onColumnOrderChange,
  onResetAll,
}: DraggableColumnVisibilityProps<T>) {
  // Suppress unused variable warnings - kept for API compatibility
  void hasVisibleContentColumns;
  void resetColumnVisibility;
  void resetPinnedColumns;

  // Guard against undefined/null columns
  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedColumnOrder, setSavedColumnOrder] = useState<string[]>([]);

  // Get list of always visible columns or default to just "actions"
  const alwaysVisibleColumns = useMemo(
    () => (getAlwaysVisibleColumns ? getAlwaysVisibleColumns() : ["actions"]),
    [getAlwaysVisibleColumns]
  );

  // Initialize column state with current order
  const [columnStates, setColumnStates] = useState<ColumnState[]>(() =>
    safeColumns.map((col, index) => ({
      id: col.key,
      label: String(col.header),
      visible: columnVisibility[col.key] !== false,
      pinned: pinnedColumns.includes(col.key),
      order: index,
    }))
  );

  // Sync column states when dialog opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Use saved order if available, otherwise use current columns order
      const columnsToUse =
        savedColumnOrder.length > 0
          ? savedColumnOrder
              .map((id) => safeColumns.find((col) => col.key === id))
              .filter((col): col is DataTableColumn<T> => Boolean(col))
          : safeColumns;

      setColumnStates(
        columnsToUse.map((col, index) => ({
          id: col.key,
          label: String(col.header),
          visible: columnVisibility[col.key] !== false,
          pinned: pinnedColumns.includes(col.key),
          order: index,
        }))
      );
      setSearchQuery(""); // Reset search when opening
    }
    setOpen((prev) => (prev === isOpen ? prev : isOpen));
  }, [savedColumnOrder, safeColumns, columnVisibility, pinnedColumns]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Prevent moving always-visible columns (actions, select, etc)
    if (
      alwaysVisibleColumns.includes(String(active.id)) ||
      alwaysVisibleColumns.includes(String(over?.id || ""))
    ) {
      return;
    }

    if (over && active.id !== over.id) {
      setColumnStates((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Additional safety check: don't move if either item is always-visible
        if (
          alwaysVisibleColumns.includes(items[oldIndex]?.id || "") ||
          alwaysVisibleColumns.includes(items[newIndex]?.id || "")
        ) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleVisibilityChange = (id: string, checked: boolean) => {
    setColumnStates((prev) =>
      prev.map((col) => (col.id === id ? { ...col, visible: checked } : col))
    );
  };

  const handlePinToggle = (id: string) => {
    setColumnStates((prev) =>
      prev.map((col) => {
        if (col.id === id) {
          return { ...col, pinned: !col.pinned };
        }
        return col;
      })
    );
  };

  const handleResetAll = () => {
    if (onResetAll) {
      onResetAll();
      setSavedColumnOrder([]);
      setColumnStates(
        safeColumns.map((col, index) => ({
          id: col.key,
          label: String(col.header),
          visible: columnVisibility[col.key] !== false,
          pinned: pinnedColumns.includes(col.key),
          order: index,
        }))
      );
      setOpen(false);
    }
  };

  const handleSave = () => {
    // Apply visibility changes
    columnStates.forEach((col) => {
      const currentVisibility = columnVisibility[col.id] !== false;
      if (col.visible !== currentVisibility) {
        toggleColumnVisibility(col.id);
      }
    });

    // Apply pin changes
    if (pinColumn && unpinColumn) {
      columnStates.forEach((col) => {
        const isCurrentlyPinned = pinnedColumns.includes(col.id);
        if (col.pinned && !isCurrentlyPinned && col.id !== "actions") {
          pinColumn(col.id);
        } else if (!col.pinned && isCurrentlyPinned && col.id !== "actions") {
          unpinColumn(col.id);
        }
      });
    }

    // Apply column order if callback provided
    if (onColumnOrderChange) {
      const orderedColumnIds = columnStates.map((col) => col.id);
      setSavedColumnOrder(orderedColumnIds); // Save the order
      onColumnOrderChange(orderedColumnIds);
    }

    setOpen(false);
  };

  const pinnedCount = columnStates.filter(
    (col) => col.pinned && col.id !== "actions"
  ).length;

  const canPinMore = pinnedCount < 2;

  const filteredColumns = useMemo(() => {
    const displayColumns = columnStates;

    if (!searchQuery.trim()) return displayColumns;
    const query = searchQuery.toLowerCase();
    return displayColumns.filter((col) =>
      col.label.toLowerCase().includes(query)
    );
  }, [columnStates, searchQuery]);
  const visibleCount = columnStates.filter((col) => col.visible).length;
  const totalCount = columnStates.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 py-2 flex items-center"
        >
          <Settings className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 gap-0 bg-card backdrop-blur-lg">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Customize Columns
              </DialogTitle>
              <span className="text-sm text-muted-foreground">
                {visibleCount} of {totalCount} Selected
              </span>
            </div>
            <DialogDescription className="sr-only">
              Choose visible columns, drag to reorder, and pin up to two columns.
            </DialogDescription>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}  
            </div>
          </DialogHeader>

          {/* Text Wrapping Toggle */}
          {toggleTextWrapping && (
            <div className="px-6 pb-1">
              <button
                onClick={toggleTextWrapping}
                className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center text-foreground gap-2">
                  {isTextWrapped ? (
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <WrapText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{isTextWrapped ? "Clip text" : "Wrap text"}</span>
                </div>
                {isTextWrapped ? (
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <WrapText className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {/* Reset All Button */}
          {onResetAll && (
            <div className="px-6 pb-1">
              <button
                onClick={handleResetAll}
                className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center text-foreground gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span>Reset All</span>
                </div>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Draggable Column List */}
          <div className="px-4 border-t border-border text-foreground py-2 max-h-100 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredColumns.map((col) => col.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {filteredColumns.map((col) => {
                    const isAlwaysVisible = alwaysVisibleColumns.includes(
                      col.id
                    );
                    // Check if this is the last visible content column
                    const visibleContentColumns = columnStates.filter(
                      (c) => c.visible && !alwaysVisibleColumns.includes(c.id)
                    );
                    const isLastVisibleColumn =
                      col.visible &&
                      visibleContentColumns.length === 1 &&
                      visibleContentColumns[0].id === col.id;

                    const isDisabled = isAlwaysVisible || isLastVisibleColumn;

                    return (
                      <SortableColumnItem
                        key={col.id}
                        id={col.id}
                        label={col.label}
                        visible={col.visible}
                        pinned={col.pinned || false}
                        disabled={isDisabled}
                        isActionsColumn={isAlwaysVisible}
                        canPin={canPinMore || col.pinned || false}
                        onVisibilityChange={(checked) =>
                          handleVisibilityChange(col.id, checked)
                        }
                        onPinToggle={() => handlePinToggle(col.id)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="h-9">
              Save
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
