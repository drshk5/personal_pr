import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, HelpCircle, Search, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TreeView } from "@/components/ui/select/tree-dropdown/tree-view";
import type { TreeItem } from "@/components/ui/select/tree-dropdown/tree-dropdown";

export type AssignmentSelectType = "USER" | "TEAM";
export type CompletionRule = "ANY_ONE" | "ALL_USERS";

export interface AssignmentOption {
  value: string;
  label: string;
  avatar?: string | null;
}

export interface AssignmentSelectProps {
  options: AssignmentOption[];
  treeData?: TreeItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  typeValue: AssignmentSelectType;
  onTypeChange: (value: AssignmentSelectType) => void;
  completionRule: CompletionRule;
  onCompletionRuleChange: (value: CompletionRule) => void;
  placeholder?: string;
  disabled?: boolean;
  allowOpenWhenDisabled?: boolean;
  isLoading?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssignmentSelect({
  options,
  treeData,
  selectedValues,
  onChange,
  typeValue,
  onTypeChange,
  completionRule,
  onCompletionRuleChange,
  placeholder = "Select assignees",
  disabled = false,
  allowOpenWhenDisabled = false,
  isLoading = false,
  onOpenChange,
}: AssignmentSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const showCompletionRule = typeValue === "TEAM" || selectedValues.length > 1;
  const shouldUseTree = typeValue === "TEAM" && !!treeData?.length;
  const isTriggerDisabled = disabled && !allowOpenWhenDisabled;
  const isReadOnly = disabled;

  const optionMap = useMemo(() => {
    return options.reduce<Record<string, AssignmentOption>>((acc, option) => {
      acc[option.value] = option;
      return acc;
    }, {});
  }, [options]);

  const treeIndex = useMemo(() => {
    if (!treeData) {
      return {
        parentById: new Map<string, string | null>(),
        childrenById: new Map<string, string[]>(),
      };
    }

    const parentById = new Map<string, string | null>();
    const childrenById = new Map<string, string[]>();

    const walk = (items: TreeItem[], parentId: string | null) => {
      items.forEach((item) => {
        parentById.set(item.id, parentId);
        const childIds = (item.children || []).map((child) => child.id);
        childrenById.set(item.id, childIds);
        if (item.children && item.children.length > 0) {
          walk(item.children, item.id);
        }
      });
    };

    walk(treeData, null);

    return { parentById, childrenById };
  }, [treeData]);

  const getAncestors = (id: string) => {
    const ancestors: string[] = [];
    let current = treeIndex.parentById.get(id) ?? null;
    while (current) {
      ancestors.push(current);
      current = treeIndex.parentById.get(current) ?? null;
    }
    return ancestors;
  };

  const getDescendants = (id: string) => {
    const descendants: string[] = [];
    const stack = [...(treeIndex.childrenById.get(id) || [])];
    while (stack.length > 0) {
      const next = stack.pop();
      if (!next) continue;
      descendants.push(next);
      const children = treeIndex.childrenById.get(next);
      if (children && children.length > 0) {
        stack.push(...children);
      }
    }
    return descendants;
  };

  const filteredOptions = useMemo(() => {
    if (shouldUseTree) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm, shouldUseTree]);

  const filteredTreeData = useMemo(() => {
    if (!shouldUseTree) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return treeData || [];

    const filterItems = (items: TreeItem[]): TreeItem[] => {
      return items
        .map((item) => {
          const matches = item.name.toLowerCase().includes(term);
          const children = item.children?.length
            ? filterItems(item.children)
            : [];
          if (matches || children.length > 0) {
            return {
              ...item,
              children,
            };
          }
          return null;
        })
        .filter(Boolean) as TreeItem[];
    };

    return filterItems(treeData || []);
  }, [searchTerm, shouldUseTree, treeData]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchTerm("");
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  };

  const toggleValue = (value: string) => {
    if (isReadOnly) return;
    if (shouldUseTree) {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((item) => item !== value));
        return;
      }

      const ancestors = getAncestors(value);
      const descendants = getDescendants(value);
      const blocked = new Set<string>([...ancestors, ...descendants]);
      const nextValues = selectedValues.filter((item) => !blocked.has(item));
      onChange([...nextValues, value]);
      return;
    }

    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  const clearAll = () => {
    if (isReadOnly) return;
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isTriggerDisabled}
          aria-disabled={isReadOnly}
          ref={triggerRef}
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
            "placeholder:text-muted-foreground",
            disabled ? "text-muted-foreground" : "text-foreground",
            disabled
              ? "opacity-70 bg-white/50 border-border-color dark:bg-white/3"
              : "bg-white hover:border-border-color hover:bg-muted/50 dark:bg-white/10 dark:hover:bg-white/15",
            isTriggerDisabled ? "cursor-not-allowed" : "cursor-pointer",
            "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50",
            "dark:focus-visible:ring-border-color/20"
          )}
        >
          <div className="flex flex-wrap items-center gap-1 flex-1 overflow-hidden">
            {selectedValues.length > 0 ? (
              selectedValues.map((value) => {
                const option = optionMap[value];
                return (
                  <Badge
                    key={value}
                    variant="default"
                    className="flex items-center gap-1 text-white"
                  >
                    {option?.label || "Selected"}
                    {!isReadOnly && (
                      <X
                        className="size-3 cursor-pointer hover:text-muted-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleValue(value);
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
          <div className="flex items-center ml-2">
            {selectedValues.length > 0 && !disabled && (
              <X
                className="h-4 w-4 mr-1 opacity-50 hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  clearAll();
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[--radix-popper-anchor-width] min-w-[--radix-popper-anchor-width] max-w-[90vw] p-4 border-border-color bg-popover text-popover-foreground shadow-lg shadow-black/20 dark:shadow-black/50"
        style={{
          width: triggerRef.current
            ? `${triggerRef.current.offsetWidth}px`
            : "100%",
        }}
      >
        <div className="space-y-4">
          <div className="rounded-md border border-border-color bg-muted/30 p-3 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                Assign to
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Select users or teams to assign this task.
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup
                value={typeValue}
                onValueChange={(value) =>
                  isReadOnly
                    ? undefined
                    : onTypeChange(value as AssignmentSelectType)
                }
                className="grid grid-cols-2 gap-2"
              >
                <label className="flex items-center gap-2 rounded-md border border-border-color px-2 py-1.5 text-xs hover:bg-muted/40 dark:hover:bg-white/10">
                  <RadioGroupItem value="USER" />
                  User
                </label>
                <label className="flex items-center gap-2 rounded-md border border-border-color px-2 py-1.5 text-xs hover:bg-muted/40 dark:hover:bg-white/10">
                  <RadioGroupItem value="TEAM" />
                  Team
                </label>
              </RadioGroup>
            </div>

            {showCompletionRule && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Completion rule
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Any one: task finishes when any assignee completes it. All
                      users: every assignee must complete it.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <RadioGroup
                  value={completionRule}
                  onValueChange={(value) =>
                    isReadOnly
                      ? undefined
                      : onCompletionRuleChange(value as CompletionRule)
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  <label className="flex items-center gap-2 rounded-md border border-border-color px-2 py-1.5 text-xs hover:bg-muted/40 dark:hover:bg-white/10">
                    <RadioGroupItem value="ANY_ONE" />
                    Any one
                  </label>
                  <label className="flex items-center gap-2 rounded-md border border-border-color px-2 py-1.5 text-xs hover:bg-muted/40 dark:hover:bg-white/10">
                    <RadioGroupItem value="ALL_USERS" />
                    All users
                  </label>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              className="pl-8 h-8"
              disabled={isReadOnly}
            />
          </div>

          <div className="max-h-64 overflow-auto rounded-md border border-border-color bg-white dark:bg-white/5">
            {isLoading ? (
              <div className="p-3 text-xs text-muted-foreground">
                Loading...
              </div>
            ) : shouldUseTree ? (
              filteredTreeData.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  No options found
                </div>
              ) : (
                <TreeView
                  data={filteredTreeData}
                  selectedItems={selectedValues}
                  onSelectItem={(item) => toggleValue(item.id)}
                  className="p-1"
                  hoverItemClassName="hover:bg-muted/40 dark:hover:bg-white/10"
                  selectedItemClassName=""
                  renderSelectedIcon={() => (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                />
              )
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">
                No options found
              </div>
            ) : (
              <ul className="p-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/40 dark:hover:bg-white/10"
                        onClick={() => toggleValue(option.value)}
                        disabled={isReadOnly}
                      >
                        <div className="flex items-center gap-2">
                          {option.avatar ? (
                            <img
                              src={option.avatar}
                              alt={option.label}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                              {option.label.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{option.label}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
