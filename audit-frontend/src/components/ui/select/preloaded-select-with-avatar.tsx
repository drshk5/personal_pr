import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  X,
  ChevronDown,
  Search,
  PlusCircle,
  Settings,
  Phone,
  Smartphone,
  Mail,
  Briefcase,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "../input";

export interface SelectOptionWithDetails {
  value: string;
  label: string;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  company?: string | null;
  avatar?: string | null;
}

export interface PreloadedSelectWithAvatarProps {
  options: SelectOptionWithDetails[];
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

export function PreloadedSelectWithAvatar({
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
  onAddNew,
  addNewPath,
  addNewLabel = "Add New",
  onSettingsClick,
  showSettings = false,
  onOpenChange,
}: PreloadedSelectWithAvatarProps) {
  const queryClient = useQueryClient();
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
        setSearchTerm("");
        onOpenChange?.(false);
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
      onOpenChange?.(newState);

      // Refresh data every time the dropdown is clicked
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
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
      onOpenChange?.(true);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedOption = selectedValue
    ? options.find((option) => option.value === selectedValue)
    : null;

  // Filter options locally based on search term
  const filteredOptions = searchTerm
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderOptionContent = (option: SelectOptionWithDetails) => (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium overflow-hidden">
        {option.avatar ? (
          <img
            src={option.avatar}
            alt={option.label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          getInitials(option.label)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{option.label}</div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {option.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{option.phone}</span>
            </div>
          )}
          {option.phone &&
            (option.mobile || option.email || option.company) && (
              <span className="text-xs text-muted-foreground">|</span>
            )}
          {option.mobile && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              <span>{option.mobile}</span>
            </div>
          )}
          {option.mobile && (option.email || option.company) && (
            <span className="text-xs text-muted-foreground">|</span>
          )}
          {(option.email || option.company) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              {option.email && (
                <>
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{option.email}</span>
                </>
              )}
              {option.email && option.company && (
                <span className="mx-1">|</span>
              )}
              {option.company && (
                <>
                  <Briefcase className="h-3 w-3" />
                  <span className="truncate">{option.company}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
            ? "cursor-not-allowed border-border-color bg-white/50 dark:bg-white/3"
            : "cursor-pointer bg-white dark:bg-white/10",

          "dark:focus-visible:ring-border-color/20",

          className
        )}
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium overflow-hidden">
                {selectedOption.avatar ? (
                  <img
                    src={selectedOption.avatar}
                    alt={selectedOption.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  getInitials(selectedOption.label)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {selectedOption.label}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center ml-2 shrink-0">
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
          className="absolute z-9999 min-w-32 mt-1 max-h-80 overflow-auto rounded-md border border-border-color bg-popover text-popover-foreground shadow-md"
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
                placeholder={initialMessage}
                className="pl-8 h-8 w-full placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                }}
                onFocus={handleSearchFocus}
              />
            </div>
          </div>

          {/* Action buttons section */}
          {(onAddNew || addNewPath) && (
            <div className="sticky top-12.5 z-10 bg-card px-2 pb-1 border-b border-border-color">
              <div className="flex flex-col gap-2">
                {/* Add New button */}
                {(onAddNew || addNewPath) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddNew) {
                        onAddNew();
                      } else if (addNewPath) {
                        window.location.href = addNewPath;
                      }
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {addNewLabel}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}

          {/* No options available */}
          {!isLoading && options.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {"No data available"}
            </div>
          )}

          {/* No search results */}
          {!isLoading &&
            options.length > 0 &&
            searchTerm &&
            filteredOptions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{searchTerm}"
              </div>
            )}

          {/* None option */}
          {allowNone && !searchTerm && (
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !selectedValue &&
                  "bg-primary/10 text-primary dark:bg-primary/20"
              )}
            >
              <span className="flex-1">{noneLabel}</span>
              {!selectedValue && <Check className="ml-2 h-4 w-4" />}
            </div>
          )}

          {/* Options list */}
          {!isLoading &&
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  selectedValue === option.value &&
                    "bg-primary/10 text-primary dark:bg-primary/20"
                )}
              >
                <div className="flex-1 min-w-0">
                  {renderOptionContent(option)}
                </div>
                {selectedValue === option.value && (
                  <Check className="ml-2 h-4 w-4 shrink-0" />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
