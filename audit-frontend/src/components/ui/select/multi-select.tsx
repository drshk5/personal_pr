import React, { useState, useRef, useEffect } from "react";
import { Check, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../input";
import { Badge } from "../badge";
import { Skeleton } from "../skeleton";

export interface MultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialMessage?: string;
  onOpenChange?: (isOpen: boolean) => void;
  renderOption?: (option: { value: string; label: string }) => React.ReactNode;
  renderBadge?: (option: { value: string; label: string }) => React.ReactNode;
  isLoading?: boolean;
}

export function MultiSelect({
  options,
  selectedValues = [],
  onChange,
  onInputChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  initialMessage = "Type at least 3 characters to search",
  onOpenChange,
  renderOption,
  renderBadge,
  isLoading = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }
  }, [isOpen, onOpenChange]);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleOption = (value: string) => {
    const isSelected = selectedValues.includes(value);
    let newValues: string[];

    if (isSelected) {
      newValues = selectedValues.filter((val) => val !== value);
    } else {
      newValues = [...selectedValues, value];
    }

    onChange(newValues);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      const newState = !isOpen;
      setIsOpen(newState);

      if (onOpenChange) {
        onOpenChange(newState);
      }

      // Reset search term when closing the dropdown
      if (!newState) {
        setSearchTerm("");
      }
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={toggleDropdown}
        className={cn(
          // Base styles
          "flex min-h-10 shadow-xs w-full items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
          // Text color: muted when disabled
          disabled ? "text-muted-foreground" : "text-foreground",
          // Only apply hover when not disabled
          !disabled && "hover:border-border-color",
          "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",

          // Light mode styles
          "bg-white",

          // Dark mode styles
          "dark:bg-white/10",
          "dark:focus-visible:ring-border-color/20",

          // Disabled state explicit styles
          disabled
            ? "cursor-not-allowed opacity-50 bg-white/50 border-border-color dark:bg-white/3"
            : "cursor-pointer",

          className
        )}
      >
        <div className="flex flex-wrap items-center gap-1 flex-1 overflow-hidden">
          {selectedValues.length > 0 ? (
            selectedValues.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <Badge
                  key={value}
                  variant="default"
                  className="flex items-center gap-1"
                >
                  {renderBadge && option
                    ? renderBadge(option)
                    : option?.label || "Selected"}
                  {!disabled && (
                    <X
                      className="size-3 cursor-pointer hover:text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(selectedValues.filter((v) => v !== value));
                      }}
                    />
                  )}
                </Badge>
              );
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center ml-1">
          {selectedValues.length > 0 && !disabled && (
            <X
              className="h-4 w-4 mr-1 opacity-50 hover:opacity-100"
              onClick={clearAll}
            />
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-100 min-w-32 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-color bg-popover text-popover-foreground shadow-md data-[side=bottom]:translate-y-1">
          <div className="sticky top-0 p-2 z-101 bg-card ">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-102" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                className="pl-8 h-8 w-full  placeholder:text-muted-foreground "
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  if (onInputChange) {
                    onInputChange(value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Filter options that match the search term */}
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-sm" />
              ))}
            </div>
          ) : (
            options
              .filter((option) => {
                // If no search term or if initialMessage is empty, show all options
                if (searchTerm === "" || initialMessage === "") {
                  return true;
                }
                // Otherwise, filter by search term
                return option.label
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              })
              .map((option) => {
                const isSelected = selectedValues.includes(option.value);
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
                    onClick={() => toggleOption(option.value)}
                  >
                    {isSelected && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <span>
                      {renderOption ? renderOption(option) : option.label}
                    </span>
                  </div>
                );
              })
          )}

          {!isLoading &&
            options.filter((option) => {
              if (searchTerm === "" || initialMessage === "") {
                return true;
              }
              return option.label
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            }).length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground dark:text-white/70">
                {searchTerm === ""
                  ? initialMessage === ""
                    ? "No options available"
                    : initialMessage
                  : searchTerm.length < 3 && initialMessage !== ""
                    ? "Type at least 3 characters to search"
                    : "No matches found"}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
