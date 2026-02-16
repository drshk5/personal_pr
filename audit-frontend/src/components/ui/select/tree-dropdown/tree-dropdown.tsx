import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronDown, Search, RefreshCw, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TreeView } from "./tree-view";

export interface TreeItem {
  id: string;
  code?: string;
  name: string;
  info?: string;
  type: "label" | "data";
  children: TreeItem[];
}

export interface TreeDropdownProps<T extends TreeItem> {
  data: T[];
  onSelectionChange?: (items: T[]) => void;
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
  disabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  getDisplayText?: (item: T) => string;
  getItemId?: (item: T) => string;
  getSearchableText?: (item: T) => string;
  textClassName?: string;
}

export function TreeDropdown<T extends TreeItem>({
  data,
  onSelectionChange,
  multiSelect = false,
  className,
  placeholder = "Select Item",
  value,
  onRefresh,
  onAddNew,
  addNewPath,
  refreshLabel = "Refresh List",
  addNewLabel = "Add New",
  clearable = true,
  isLoading = false,
  disabled = false,
  onOpenChange,
  getItemId = (item) => item.id,
  getSearchableText = (item) => `${item.name} ${item.code || ""}`.toLowerCase(),
  getDisplayText: customGetDisplayText,
  textClassName,
}: TreeDropdownProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Store function references in refs to prevent recreating on every render
  const getItemIdRef = useRef(getItemId);
  const getSearchableTextRef = useRef(getSearchableText);

  // Update refs when props change
  useEffect(() => {
    getItemIdRef.current = getItemId;
  }, [getItemId]);

  useEffect(() => {
    getSearchableTextRef.current = getSearchableText;
  }, [getSearchableText]);

  // Stable function wrappers that use the ref
  const stableGetItemId = useCallback(
    (item: T) => getItemIdRef.current(item),
    []
  );
  const stableGetSearchableText = useCallback(
    (item: T) => getSearchableTextRef.current(item),
    []
  );

  // Memoize selectedIds to prevent recalculation on every render
  const selectedIds = useMemo(
    () => value || selectedItems.map((item) => stableGetItemId(item)),
    [value, selectedItems, stableGetItemId]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Update selected items when value prop changes
  useEffect(() => {
    // Helper function to find items by IDs in the tree
    const findItemsByIds = (item: T, ids: string[]): T[] => {
      const result: T[] = [];

      if (ids.includes(stableGetItemId(item))) {
        result.push(item);
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          result.push(...findItemsByIds(child as T, ids));
        });
      }

      return result;
    };

    if (value && value.length === 0) {
      setSelectedItems([]);
    } else if (value) {
      const newSelectedItems = data
        .flatMap((item) => findItemsByIds(item, value))
        .filter(Boolean) as T[];

      setSelectedItems(newSelectedItems);
    }
  }, [value, data, stableGetItemId]);

  const toggleDropdown = () => {
    if (disabled) return;
    const newState = !isOpen;
    setIsOpen(newState);

    // Notify parent component about dropdown state change
    if (onOpenChange) {
      onOpenChange(newState);
    }

    // Reset search term only when closing the dropdown
    if (!newState) {
      setSearchTerm("");
    }
  };

  // Special handler to prevent dropdown from closing during search operations
  const handleSearchFocus = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Clear selection
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange([]);
    } else {
      setSelectedItems([]);
    }
  };

  // Filter items in the tree based on search term
  const filterItems = useCallback(
    (items: T[], term: string): T[] => {
      if (!term) return items;

      return items
        .map((item) => {
          // Check if the current item matches
          const matchesSearch = stableGetSearchableText(item).includes(
            term.toLowerCase()
          );

          // Check if any children match
          const filteredChildren =
            item.children && item.children.length > 0
              ? filterItems(item.children as T[], term)
              : [];

          // If this item matches or has matching children, include it
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren,
            } as T;
          }
          return null;
        })
        .filter(Boolean) as T[];
    },
    [stableGetSearchableText]
  );

  // Get filtered data based on search term
  const filteredData = useMemo(
    () => (searchTerm ? filterItems(data, searchTerm) : data),
    [searchTerm, data, filterItems]
  );

  const handleSelectItem = useCallback(
    (item: T) => {
      // Only allow selecting data items (not labels)
      if (item.type !== "data") return;

      // If value prop is provided, delegate selection management to parent component
      if (value !== undefined) {
        if (onSelectionChange) {
          if (multiSelect) {
            const isSelected = value.includes(stableGetItemId(item));
            const newItems = isSelected
              ? selectedItems.filter(
                  (i) => stableGetItemId(i) !== stableGetItemId(item)
                )
              : [...selectedItems, item];
            onSelectionChange(newItems);
          } else {
            onSelectionChange([item]);
            setIsOpen(false); // Close dropdown after selection for single select
          }
        }
        return;
      }

      if (multiSelect) {
        // For multi-select, toggle the selection
        const isSelected = selectedIds.includes(stableGetItemId(item));
        const newSelection = isSelected
          ? selectedItems.filter(
              (i) => stableGetItemId(i) !== stableGetItemId(item)
            )
          : [...selectedItems, item];

        setSelectedItems(newSelection);

        if (onSelectionChange) {
          onSelectionChange(newSelection);
        }
      } else {
        // For single select, replace the selection
        setSelectedItems([item]);

        if (onSelectionChange) {
          onSelectionChange([item]);
        }
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
        // Close dropdown after selection for single select
      }
    },
    [
      value,
      onSelectionChange,
      multiSelect,
      selectedIds,
      selectedItems,
      onOpenChange,
      stableGetItemId,
    ]
  );

  // Default function to get display text for an individual item
  const defaultGetItemText = (item: T) => {
    if (item.code) {
      return `${item.name} (${item.code})`;
    }
    return item.name;
  };

  // Function to get display text for the dropdown
  const getDropdownDisplayText = () => {
    if (selectedItems.length === 0) {
      return placeholder;
    } else if (selectedItems.length === 1) {
      return customGetDisplayText
        ? customGetDisplayText(selectedItems[0])
        : defaultGetItemText(selectedItems[0]);
    } else {
      return `${selectedItems.length} items selected`;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Dropdown Trigger */}
      <div
        onClick={toggleDropdown}
        className={cn(
          // Base styles
          "flex w-full items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
          "placeholder:text-muted-foreground text-foreground",
          "hover:border-border-color",
          "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
          "cursor-pointer",

          // Light mode styles
          "bg-white",

          // Dark mode styles
          "dark:bg-white/10",
          "dark:focus-visible:ring-border-color/20",

          disabled && "opacity-50 cursor-not-allowed hover:border-border-color",

          multiSelect && selectedItems.length > 0 ? "min-h-10" : "h-10",
          className
        )}
      >
        {multiSelect && selectedItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1 flex-1 overflow-hidden">
            {selectedItems.map((item) => (
              <Badge
                key={stableGetItemId(item)}
                variant="default"
                className="flex items-center gap-1"
              >
                {item.name}
                {clearable && (
                  <X
                    className="size-3 cursor-pointer hover:text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSelection = selectedItems.filter(
                        (i) => stableGetItemId(i) !== stableGetItemId(item)
                      );
                      setSelectedItems(newSelection);
                      if (onSelectionChange) {
                        onSelectionChange(newSelection);
                      }
                    }}
                  />
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <span
            className={cn(
              "truncate font-normal",
              textClassName ? textClassName : "text-sm"
            )}
          >
            {getDropdownDisplayText()}
          </span>
        )}
        <div className="flex items-center ml-1">
          {selectedItems.length > 0 && clearable && (
            <X
              className="h-4 w-4 mr-1 opacity-50 hover:opacity-100"
              onClick={clearSelection}
            />
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              if (onOpenChange) {
                onOpenChange(false);
              }
            }}
          />
          <div className="absolute z-100 min-w-32 mt-1 w-full rounded-md border border-border-color bg-popover text-popover-foreground shadow-md data-[side=bottom]:translate-y-1">
            <div className="flex flex-col h-80">
              {/* Search bar */}
              <div className="flex-none p-2 bg-card">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-102" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    className="pl-8 h-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleSearchFocus}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Add New button */}
              {(onAddNew || addNewPath) && (
                <div
                  className={cn(
                    "flex flex-none w-full items-center py-2 px-3 cursor-pointer transition-colors",
                    "hover:bg-muted dark:hover:bg-white/10",
                    "text-foreground text-sm"
                  )}
                  onClick={() => {
                    if (addNewPath) {
                      window.open(addNewPath, "_blank");
                    } else if (onAddNew) {
                      onAddNew();
                    }
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  <span>{addNewLabel}</span>
                </div>
              )}

              {/* Refresh button */}
              {onRefresh && (
                <div
                  className={cn(
                    "flex flex-none w-full items-center py-2 px-3 cursor-pointer transition-colors",
                    "hover:bg-muted dark:hover:bg-white/10",
                    "text-foreground text-sm",
                    "border-b border-border-color"
                  )}
                  onClick={() => {
                    onRefresh();
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>{refreshLabel}</span>
                </div>
              )}

              {/* Tree view with filtered data */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {isLoading ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-sm" />
                    ))}
                  </div>
                ) : filteredData.length > 0 ? (
                  <TreeView
                    data={filteredData}
                    onSelectItem={handleSelectItem}
                    selectedItems={selectedIds}
                    className="min-h-0"
                  />
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "No matching items found"
                      : "No items available"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
