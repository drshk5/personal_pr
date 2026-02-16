import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RenameSchedule } from "@/types/central/rename-schedule";
import { VirtualizedTreeList } from "./VirtualizedTreeList";
import { RenameScheduleSkeleton } from "./RenameScheduleSkeleton";

interface RenameScheduleAccordionProps {
  data: RenameSchedule[];
  onEditItem?: (item: RenameSchedule) => void;
  onSelectItem?: (item: RenameSchedule) => void;
  expandAll?: boolean;
  isLoading?: boolean;
  className?: string;
  preserveExpandedState?: boolean;
  onExpandStateChange?: (allExpanded: boolean) => void;
}

export function RenameScheduleAccordion({
  data,
  onEditItem,
  onSelectItem,
  expandAll,
  isLoading,
  className,
  preserveExpandedState = false,
  onExpandStateChange: _onExpandStateChange,
}: RenameScheduleAccordionProps) {
  const MAX_EXPANDED_DEPTH = 4;

  const STORAGE_KEY = "renameSchedule_expandedItems";

  // Store expanded IDs as a Set for O(1) lookup
  const [expandedIdsSet, setExpandedIdsSet] = useState<Set<string>>(() => {
    if (preserveExpandedState) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const arr = JSON.parse(stored);
          return new Set(arr);
        }
      } catch (e) {
        console.error("Failed to load expanded state:", e);
      }
    }
    return new Set();
  });

  // Persist expanded state
  useEffect(() => {
    if (!preserveExpandedState) return;

    try {
      if (expandedIdsSet.size > 0) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(expandedIdsSet))
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save expanded state:", e);
    }
  }, [expandedIdsSet, preserveExpandedState, STORAGE_KEY]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIdsSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAllIdsCompute = useMemo(() => {
    const ids = new Set<string>();
    const queue: Array<{ node: RenameSchedule; depth: number }> = [];
    data.forEach((node) => queue.push({ node, depth: 0 }));

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      ids.add(node.strScheduleGUID);

      if (
        node.children &&
        node.children.length > 0 &&
        depth < MAX_EXPANDED_DEPTH
      ) {
        node.children.forEach((child) =>
          queue.push({ node: child, depth: depth + 1 })
        );
      }
    }

    return ids;
  }, [data, MAX_EXPANDED_DEPTH]);

  const prevExpandAllRef = useRef<boolean | undefined>(expandAll);

  useEffect(() => {
    // Only trigger expand/collapse when expandAll actually changes between true/false
    if (
      prevExpandAllRef.current !== undefined &&
      prevExpandAllRef.current !== expandAll
    ) {
      if (expandAll) {
        setExpandedIdsSet(expandAllIdsCompute);
      } else {
        setExpandedIdsSet(new Set());
        if (preserveExpandedState) {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    prevExpandAllRef.current = expandAll;
  }, [expandAll, preserveExpandedState, STORAGE_KEY, expandAllIdsCompute]);

  const handleOptimizedEdit = useCallback(
    (item: RenameSchedule) => {
      if (onEditItem && item.bolIsEditable) {
        onEditItem(item);
      }
    },
    [onEditItem]
  );

  return (
    <div className={cn("w-full flex flex-col", className)}>
      {isLoading ? (
        <RenameScheduleSkeleton
          expandAll={expandAll}
          itemCount={data.length > 0 ? data.length : 5}
        />
      ) : (
        <div className="w-full h-[75vh] overflow-hidden chart-of-accounts-container">
          <VirtualizedTreeList
            data={data}
            expandedIds={expandedIdsSet}
            onToggleExpand={handleToggleExpand}
            onEditItem={handleOptimizedEdit}
            onSelectItem={onSelectItem}
            height={600}
          />
        </div>
      )}
    </div>
  );
}
