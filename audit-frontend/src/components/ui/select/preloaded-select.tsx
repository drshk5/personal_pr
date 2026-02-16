import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  X,
  ChevronDown,
  Search,
  PlusCircle,
  Settings,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "../input";
import { Skeleton } from "../skeleton";

export interface PreloadedSelectProps {
  options: { value: string; label: string }[];
  selectedValue: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  initialMessage?: string;
  isLoading?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
  queryKey?: string[];
  onOpenChange?: (isOpen: boolean) => void;
  onAddNew?: () => void;
  addNewPath?: string;
  addNewLabel?: string;
  onSettingsClick?: () => void;
  showSettings?: boolean;
}

export function PreloadedSelect({
  options,
  selectedValue,
  onChange,
  placeholder = "Select an option...",
  className,
  disabled = false,
  clearable = true,
  initialMessage = "Type to filter options",
  isLoading = false,
  allowNone = false,
  noneLabel = "None",
  queryKey,
  onOpenChange,
  onAddNew,
  addNewPath,
  addNewLabel = "Add New",
  onSettingsClick,
  showSettings = false,
}: PreloadedSelectProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Internal refresh handler - only refresh if data doesn't exist yet
  const handleRefresh = async () => {
    if (queryKey) {
      // Look for any matching query (non-exact) that already has data
      const matchingQueries = queryClient.getQueriesData({
        queryKey,
        exact: false,
      });

      const hasAnyData = matchingQueries.some(([, data]) => data !== undefined);

      // Only invalidate when nothing is cached yet; otherwise respect staleTime
      if (!hasAnyData) {
        await queryClient.invalidateQueries({ queryKey, exact: false });
      }
    }
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        if (onOpenChange) onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        if (onOpenChange) onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isOpen, onOpenChange]);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      const newState = !isOpen;
      setIsOpen(newState);

      if (onOpenChange) onOpenChange(newState);

      // Reset search term only when closing the dropdown
      if (!newState) {
        setSearchTerm("");
      } else if (newState && queryKey) {
        // Refresh data when opening the dropdown
        handleRefresh();
      }
    }
  };

  // Special handler to prevent dropdown from closing during search operations
  const handleSearchFocus = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (onOpenChange) onOpenChange(true);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedLabel = selectedValue
    ? options.find((option) => option.value === selectedValue)?.label ||
      "Selected"
    : "";

  // Filter options locally based on search term
  const filteredOptions = searchTerm
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={toggleDropdown}
        className={cn(
          // Base styles
          "flex h-10 w-full shadow-xs items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
          "placeholder:text-muted-foreground",
          // Text color: when disabled match input's muted text
          disabled ? "text-muted-foreground" : "text-foreground",
          // Only apply hover styles when not disabled
          !disabled && "hover:border-border-color hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",

          // Apply explicit disabled styles (div can't use the `:disabled` variant)
          disabled
            ? "cursor-not-allowed  border-border-color bg-white/50 dark:bg-white/3"
            : "cursor-pointer bg-white dark:bg-white/10",

          "dark:focus-visible:ring-border-color/20",

          className
        )}
        title={selectedValue ? selectedLabel : placeholder}
      >
        <span className="truncate">
          {selectedValue ? selectedLabel : placeholder}
        </span>
        <div className="flex items-center">
          {showSettings && onSettingsClick && !disabled && (
            <Settings
              className="h-4 w-4 mr-1 text-primary hover:text-primary/80 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSettingsClick();
              }}
            />
          )}
          {selectedValue && clearable && !disabled && (
            <X
              className="h-4 w-4 mr-1 opacity-50 hover:opacity-100"
              onClick={clearSelection}
            />
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute z-9999 min-w-32 mt-1 max-h-60 overflow-auto rounded-md border border-border-color bg-popover text-popover-foreground shadow-md"
          style={{
            position: "absolute",
            width: containerRef.current
              ? containerRef.current.offsetWidth + "px"
              : "100%",
          }}
        >
          <div className="sticky top-0 p-2 z-10 bg-card">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                className="pl-8 h-8 w-full placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                }}
                onFocus={handleSearchFocus}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </div>
          </div>

          {allowNone && (
            <div
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                "focus:bg-muted dark:focus:bg-white/10",
                "hover:bg-muted dark:hover:bg-white/10",
                "text-foreground",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                "cursor-pointer",
                selectedValue === "" && "bg-muted dark:bg-white/10"
              )}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
                if (onOpenChange) onOpenChange(false);
              }}
            >
              {selectedValue === "" && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span>{noneLabel}</span>
            </div>
          )}

          {(onAddNew || addNewPath) && (
            <div
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors",
                "hover:bg-muted dark:hover:bg-white/10",
                "text-blue-600 dark:text-blue-400"
              )}
              onClick={() => {
                if (addNewPath) {
                  window.open(addNewPath, "_blank");
                } else if (onAddNew) {
                  onAddNew();
                }
                setIsOpen(false);
                setSearchTerm("");
                if (onOpenChange) onOpenChange(false);
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <PlusCircle className="h-4 w-4" />
              </span>
              <span>{addNewLabel}</span>
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                    "focus:bg-muted dark:focus:bg-white/10",
                    "hover:bg-muted dark:hover:bg-white/10",
                    "text-foreground",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    "cursor-pointer",
                    isSelected && "bg-muted dark:bg-white/10"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    if (onOpenChange) onOpenChange(false);
                  }}
                >
                  {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <span>{option.label}</span>
                </div>
              );
            })
          ) : isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-sm" />
              ))}
            </div>
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {searchTerm === ""
                ? options.length === 0
                  ? "No data available"
                  : initialMessage
                : "No matches found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
