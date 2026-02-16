import { TreeDropdown } from "@/components/ui/select/tree-dropdown/tree-dropdown";
import type { TreeItem } from "@/components/ui/select/tree-dropdown/tree-dropdown";
import type { ScheduleItem } from "@/types/central/schedule";

// This type adapts the ScheduleItem interface to work with TreeItem
export interface ScheduleTreeItem
  extends Omit<TreeItem, "children">,
    Omit<ScheduleItem, "Children"> {
  id: string;
  name: string;
  code?: string;
  info?: string;
  children: ScheduleTreeItem[];
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  strScheduleInfo: string;
  Children: ScheduleItem[];
}

export interface TreeScheduleDropdownProps {
  data: ScheduleItem[];
  onSelectionChange?: (items: ScheduleItem[]) => void;
  multiSelect?: boolean;
  className?: string;
  placeholder?: string;
  value?: string[];
  onRefresh?: () => void;
  onAddNew?: () => void;
  addNewPath?: string;
  refreshLabel?: string;
  addNewLabel?: string;
  clearable?: boolean;
  isLoading?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function TreeScheduleDropdown({
  data,
  onSelectionChange,
  multiSelect = false,
  className,
  placeholder = "Select Schedule",
  value,
  onRefresh,
  onAddNew,
  addNewPath,
  refreshLabel = "Refresh List",
  addNewLabel = "Add New Schedule",
  clearable = true,
  isLoading = false,
  onOpenChange,
}: TreeScheduleDropdownProps) {
  // Convert schedule items to tree items
  const adaptedData = data.map(adaptScheduleItemToTreeItem);

  // Handle the selection change
  const handleSelectionChange = (items: ScheduleTreeItem[]) => {
    if (onSelectionChange) {
      // Convert back to ScheduleItem format
      const originalItems = items
        .map((item) => {
          // Find original item in data
          return findOriginalScheduleItem(data, item.strScheduleGUID);
        })
        .filter(Boolean) as ScheduleItem[];

      onSelectionChange(originalItems);
    }
  };

  return (
    <TreeDropdown
      data={adaptedData}
      onSelectionChange={handleSelectionChange}
      multiSelect={multiSelect}
      className={className}
      placeholder={placeholder}
      value={value}
      onRefresh={onRefresh}
      onAddNew={onAddNew}
      addNewPath={addNewPath}
      refreshLabel={refreshLabel}
      addNewLabel={addNewLabel}
      clearable={clearable}
      isLoading={isLoading}
      onOpenChange={onOpenChange}
      getItemId={(item) => item.strScheduleGUID}
      getSearchableText={(item) =>
        `${item.strScheduleName} ${item.strScheduleCode || ""}`.toLowerCase()
      }
      getDisplayText={(item) =>
        item.strScheduleCode
          ? `${item.strScheduleName} (${item.strScheduleCode})`
          : item.strScheduleName
      }
    />
  );
}

// Helper function to adapt schedule items to tree items
function adaptScheduleItemToTreeItem(item: ScheduleItem): ScheduleTreeItem {
  const treeItem: ScheduleTreeItem = {
    // TreeItem properties
    id: item.strScheduleGUID,
    name: item.strScheduleName,
    code: item.strScheduleCode,
    info: item.strScheduleInfo,
    type: item.type,
    children: [],

    // ScheduleItem properties
    strScheduleGUID: item.strScheduleGUID,
    strScheduleCode: item.strScheduleCode,
    strScheduleName: item.strScheduleName,
    strScheduleInfo: item.strScheduleInfo,
    Children: [],
  };

  // Process children recursively
  treeItem.children = item.Children.map(adaptScheduleItemToTreeItem);
  // This is a simplified approach - in a real-world scenario you might need
  // to handle this conversion differently based on your data structure
  treeItem.Children = item.Children;

  return treeItem;
}

// Helper function to find the original schedule item
function findOriginalScheduleItem(
  items: ScheduleItem[],
  guid: string
): ScheduleItem | null {
  for (const item of items) {
    if (item.strScheduleGUID === guid) {
      return item;
    }

    if (item.Children && item.Children.length > 0) {
      const found = findOriginalScheduleItem(item.Children, guid);
      if (found) return found;
    }
  }

  return null;
}
