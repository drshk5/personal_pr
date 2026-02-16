import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  X,
  ChevronDown,
  Search,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../input";

export interface SingleSelectProps {
  options: { value: string; label: string }[];
  selectedValue: string | undefined;
  onChange: (value: string) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  keepOpenOnSearch?: boolean;
  clearable?: boolean;
  initialMessage?: string;
  isLoading?: boolean;
  searchMinLength?: number;
  allowNone?: boolean;
  noneLabel?: string;
  onRefresh?: () => void;
  onAddNew?: () => void;
  addNewPath?: string;
  refreshLabel?: string;
  addNewLabel?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export function SingleSelect({
  options,
  selectedValue,
  onChange,
  onInputChange,
  placeholder = "Select an option...",
  className,
  disabled = false,
  clearable = true,
  initialMessage = "Type at least 3 characters to search",
  isLoading = false,
  searchMinLength = 3,
  allowNone = false,
  noneLabel = "None",
  onRefresh,
  onAddNew,
  addNewPath,
  refreshLabel = "Refresh List",
  addNewLabel = "Add New",
  keepOpenOnSearch = true, // Default to keeping dropdown open when searching
  onOpenChange,
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onOpenChange]);

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

      // Notify parent component about dropdown state change
      if (onOpenChange) {
        onOpenChange(newState);
      }

      // Reset search term only when closing the dropdown
      if (!newState) {
        setSearchTerm("");
      }
    }
  };

  // Special handler to prevent dropdown from closing during search operations
  const handleSearchFocus = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (onOpenChange) {
        onOpenChange(true);
      }
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={toggleDropdown}
        className={cn(
          // Base styles
          "flex shadow-xs h-10 w-full items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
          "placeholder:text-muted-foreground text-foreground",
          "hover:border-border-color",
          "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",

          // Light mode styles
          "bg-white",

          // Dark mode styles
          "dark:bg-white/10",
          "dark:focus-visible:ring-border-color/20",

          // Disabled state
          disabled &&
            "cursor-not-allowed opacity-50 bg-muted border-border-color",
          disabled && "dark:bg-white/5",
          !disabled && "cursor-pointer",

          className
        )}
      >
        <span className="truncate text-base font-normal">
          {selectedValue ? selectedLabel : placeholder}
        </span>
        <div className="flex items-center">
          {selectedValue && clearable && (
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
          className="fixed z-9999 min-w-32 mt-1 max-h-60 w-(--radix-popper-anchor-width) overflow-auto rounded-md border border-border-color bg-popover text-popover-foreground shadow-md data-[side=bottom]:translate-y-1"
          style={{
            position: "absolute",
            width: containerRef.current
              ? containerRef.current.offsetWidth + "px"
              : "100%",
          }}
        >
          <div className="sticky top-0 p-2 z-10001 bg-background border-b border-border-color">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-102" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                className="pl-8 h-8 w-full bg-background dark:bg-[#121212] text-foreground dark:text-white placeholder:text-muted-foreground relative z-101"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  // Call the onInputChange prop if provided
                  if (onInputChange) {
                    onInputChange(value);
                  }
                  // If keepOpenOnSearch is true, ensure dropdown stays open
                  if (keepOpenOnSearch && !isOpen) {
                    setIsOpen(true);
                    if (onOpenChange) {
                      onOpenChange(true);
                    }
                  }
                }}
                onFocus={handleSearchFocus}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* None option */}
          {allowNone && (
            <div
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                "focus:bg-[#f0f0f0] dark:focus:bg-[#333]",
                "data-highlighted:bg-[#f0f0f0] dark:data-highlighted:bg-[#333]",
                "dark:text-white dark:focus:text-white",
                "dark:data-highlighted:text-white",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                "cursor-pointer",
                selectedValue === "" && "bg-[#f0f0f0]/80 dark:bg-[#333]/50"
              )}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                if (onOpenChange) {
                  onOpenChange(false);
                }
                setSearchTerm("");
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

          {/* Add New option - shown if either onAddNew or addNewPath is provided */}
          {(onAddNew || addNewPath) && (
            <div
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                "focus:bg-[#f0f0f0] dark:focus:bg-[#333]",
                "data-highlighted:bg-[#f0f0f0] dark:data-highlighted:bg-[#333]",
                "dark:text-white dark:focus:text-white",
                "dark:data-highlighted:text-white",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                "cursor-pointer",
                "text-green-600 dark:text-green-400",
                "border-t border-t-gray-100 dark:border-t-gray-800"
              )}
              onClick={() => {
                // Open in a new tab if addNewPath is provided
                if (addNewPath) {
                  window.open(addNewPath, "_blank");
                }
                // Otherwise call onAddNew if provided
                else if (onAddNew) {
                  onAddNew();
                }
                setIsOpen(false);
                if (onOpenChange) {
                  onOpenChange(false);
                }
                setSearchTerm("");
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <PlusCircle className="h-4 w-4" />
              </span>
              <span>{addNewLabel}</span>
            </div>
          )}

          {/* Refresh option */}
          {onRefresh && (
            <div
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                "focus:bg-[#f0f0f0] dark:focus:bg-[#333]",
                "data-highlighted:bg-[#f0f0f0] dark:data-highlighted:bg-[#333]",
                "dark:text-white dark:focus:text-white",
                "dark:data-highlighted:text-white",
                "data-disabled:pointer-events-none data-disabled:opacity-50",
                "cursor-pointer",
                "text-blue-600 dark:text-blue-400",
                onAddNew
                  ? ""
                  : "border-t border-t-gray-100 dark:border-t-gray-800",
                "border-b border-b-gray-100 dark:border-b-gray-800"
              )}
              onClick={() => {
                onRefresh?.();
                // Don't close dropdown to show refreshed options
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </span>
              <span>{refreshLabel}</span>
            </div>
          )}

          {/* Divider after action options if any exists */}
          {(onAddNew || onRefresh) && (
            <div className="px-2 py-1 border-b border-b-gray-100 dark:border-b-gray-800"></div>
          )}

          {options
            .filter((option) =>
              option.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((option) => {
              const isSelected = option.value === selectedValue;
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                    "focus:bg-[#f0f0f0] dark:focus:bg-[#333]",
                    "data-highlighted:bg-[#f0f0f0] dark:data-highlighted:bg-[#333]",
                    "dark:text-white dark:focus:text-white",
                    "dark:data-highlighted:text-white",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    "cursor-pointer",
                    isSelected && "bg-[#f0f0f0]/80 dark:bg-[#333]/50"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    if (onOpenChange) {
                      onOpenChange(false);
                    }
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
            })}

          {options.filter((option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground dark:text-white/70">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading...
                </div>
              ) : searchTerm === "" ? (
                initialMessage
              ) : searchTerm.length < searchMinLength ? (
                `Type at least ${searchMinLength} characters to search`
              ) : (
                "No matches found"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
