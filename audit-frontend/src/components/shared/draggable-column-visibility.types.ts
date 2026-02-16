import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
export interface ColumnState {
  
  id: string;
  label: string;
  visible: boolean;
  pinned?: boolean;
  order: number;
}

export interface DraggableColumnVisibilityProps<T> {
  columns: DataTableColumn<T>[];
  columnVisibility: ColumnVisibilityState;
  
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
}

export interface ColumnVisibilityState {
  [key: string]: boolean;
}

export interface SortableColumnItemProps {
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

export type ColumnOrderChangeHandler = (orderedColumns: string[]) => void;
export interface AlwaysVisibleConfig {
  columns: string[];
}

export interface PinConfig {
  maxPinned: number;
  alwaysPinned: string[];
}

export const DEFAULT_PIN_CONFIG: PinConfig = {
  maxPinned: 2,
  alwaysPinned: ["actions"],
};

export type ColumnKey<T> = DataTableColumn<T>["key"];
export type ColumnHeader<T> = DataTableColumn<T>["header"];
export type OrderedColumns = string[];

export type ReorderFunction = (
  items: ColumnState[],
  startIndex: number,
  endIndex: number
) => ColumnState[];
