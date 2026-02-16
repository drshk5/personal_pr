import React, { useCallback, useMemo } from "react";
import { Edit, Lock, ChevronDown } from "lucide-react";

import type { RenameSchedule } from "@/types/central/rename-schedule";

import { Modules, Actions, usePermission } from "@/lib/permissions";

import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AccordionItemNodeProps {
  item: RenameSchedule;
  onEditItem?: (item: RenameSchedule) => void;
  onSelectItem?: (item: RenameSchedule) => void;
  expandAll?: boolean;
  isLoading?: boolean;
  level: number;
  maxExpandedDepth?: number;
  nestedExpanded?: string[];
  nestedExpandedMap?: Record<string, string[]>;
  onNestedStateChange?: (key: string, items: string[]) => void;
}

const AccordionItemNode = React.memo(
  function AccordionItemNodeImpl({
    item,
    onEditItem,
    onSelectItem,
    expandAll,
    isLoading,
    level,
    maxExpandedDepth = 8,
    nestedExpanded = [],
    nestedExpandedMap = {},
    onNestedStateChange,
  }: AccordionItemNodeProps) {
    const canSave = usePermission(Modules.CHART_OF_ACCOUNT, Actions.SAVE);
    const hasChildren = item.children && item.children.length > 0;
    const shouldRenderChildren = hasChildren;

    const displayName = item.strRenameScheduleName
      ? item.strRenameScheduleName
      : item.strScheduleName;

    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (onEditItem && item.bolIsEditable) {
          onEditItem(item);
        }
      },
      [onEditItem, item]
    );

    const handleNestedValueChange = useCallback(
      (value: string[] | unknown) => {
        if (!onNestedStateChange) return;

        // Skip if expandAll is active (parent controls state)
        if (expandAll) return;

        const valueArray = Array.isArray(value) ? value : [];
        const limitedValue =
          valueArray.length > 50 ? valueArray.slice(0, 50) : valueArray;

        onNestedStateChange(item.strScheduleGUID, limitedValue);
      },
      [item.strScheduleGUID, onNestedStateChange, expandAll]
    );

    const getLevelBackground = (level: number) => {
      // Background color for visual hierarchy
      if (level === 0) return "";

      // Gray scale with opacities for visibility
      const backgrounds = [
        "bg-slate-200/30 dark:bg-muted/15",
        "bg-slate-200/60 dark:bg-muted/25",
        "bg-slate-200 dark:bg-muted/35",
        "bg-slate-300 dark:bg-muted/45",
      ];

      const index = Math.min(level - 1, backgrounds.length - 1);
      return backgrounds[index];
    };

    // When expandAll is true but nestedExpandedMap doesn't yet have this node,
    // fall back to expanding all immediate children (capped to 50 for safety).
    const effectiveNestedExpanded = useMemo(() => {
      if (!hasChildren) return [];
      if (expandAll) {
        if (nestedExpanded.length > 0) return nestedExpanded;
        const children = item.children?.slice(0, 50) || [];
        return children.map((child) => child.strScheduleGUID);
      }
      return nestedExpanded;
    }, [expandAll, hasChildren, item.children, nestedExpanded]);

    return (
      <AccordionItem
        value={item.strScheduleGUID}
        className={cn(
          level === 0
            ? "bg-card border border-border-color rounded-md mb-1 shadow-sm"
            : "border-b-0",
          level === 0 && "last:mb-0",
          level > 0 &&
            `${getLevelBackground(level)} rounded-md overflow-hidden my-0.5`,
          expandAll ? "force-expanded" : "force-collapsed",
          `accordion-item-${level}-${item.strScheduleGUID.substring(0, 8)}`,
          "accordion-item"
        )}
        style={{
          contain: "layout style paint",
          contentVisibility: level > 1 ? "auto" : "visible",
        }}
        data-force-expanded={expandAll ? "true" : "false"}
        data-accordion-level={level}
        data-accordion-item-id={item.strScheduleGUID}
        data-parent-id={item.strParentScheduleGUID || "root"}
        data-schedule-name={item.strScheduleName}
        id={`accordion-item-${item.strScheduleGUID.substring(0, 8)}`}
      >
        <AccordionTrigger
          className={cn(
            "py-3 hover:no-underline flex items-center justify-between cursor-pointer",
            "[&>svg]:hidden",
            level === 0 ? "font-medium" : "",
            item.bolIsEditable ? "text-primary" : "text-foreground",
            isLoading && "opacity-50 pointer-events-none",

            hasChildren && "has-children"
          )}
          style={{
            paddingLeft: level > 0 ? `${level * 12 + 12}px` : "12px",
            paddingRight: "12px",
          }}
          aria-disabled={isLoading}
          data-has-children={hasChildren ? "true" : "false"}
          onClick={() => {
            if (hasChildren && item.children && item.children.length > 0) {
              if (onSelectItem) {
                onSelectItem(item);
              }
            }
          }}
        >
          <div className="flex items-center space-x-2 grow overflow-hidden">
            {hasChildren && (
              <div className="flex-none mr-1 flex justify-center cursor-pointer">
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
              </div>
            )}

            {!hasChildren && <div className="w-5"></div>}

            <div
              className="flex-none flex gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {canSave && item.bolIsEditable ? (
                <div
                  role="button"
                  title="Edit"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md p-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  onClick={handleEdit}
                  style={{ pointerEvents: isLoading ? "none" : "auto" }}
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-muted-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Edit className="h-3.5 w-3.5" />
                  )}
                </div>
              ) : (
                <div
                  title="Locked"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md p-0 text-sm font-medium opacity-70"
                >
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <div className="flex items-center flex-wrap overflow-hidden">
              <span className="font-medium truncate cursor-pointer">
                {displayName}
              </span>
              {item.strScheduleCode && (
                <span className="ml-2 text-xs text-muted-foreground truncate">
                  ({item.strScheduleCode})
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>

        {hasChildren && (
          <AccordionContent
            className={cn(
              "pt-1 pb-0 pr-0",
              "accordion-content",
              `accordion-content-${level}`
            )}
            style={{
              contain: "layout style",
            }}
            data-content-id={item.strScheduleGUID}
            data-expanded={
              expandAll || effectiveNestedExpanded.length > 0 ? "true" : "false"
            }
          >
            {/* Only render nested content when this item is actually expanded */}
            {shouldRenderChildren &&
              (expandAll || effectiveNestedExpanded.length > 0) && (
                <Accordion
                  type="multiple"
                  id={`nested-accordion-${item.strScheduleGUID.substring(0, 8)}`}
                  className={cn(
                    "w-full",
                    "border-l-2 border-l-muted ml-2 pl-1",
                    "nested-accordion",
                    `nested-accordion-${level}`,
                    nestedExpanded.length > 0
                      ? "has-expanded-items"
                      : "all-collapsed"
                  )}
                  value={effectiveNestedExpanded}
                  data-parent-guid={item.strScheduleGUID}
                  data-has-expanded-items={
                    effectiveNestedExpanded.length > 0 ? "true" : "false"
                  }
                  data-level={level + 1}
                  onValueChange={handleNestedValueChange}
                >
                  {item.children?.slice(0, 50).map((child) => (
                    <AccordionItemNode
                      key={child.strScheduleGUID}
                      item={child}
                      onEditItem={onEditItem}
                      onSelectItem={onSelectItem}
                      expandAll={expandAll}
                      isLoading={isLoading}
                      level={level + 1}
                      maxExpandedDepth={maxExpandedDepth}
                      nestedExpanded={
                        nestedExpandedMap[child.strScheduleGUID] || []
                      }
                      nestedExpandedMap={nestedExpandedMap}
                      onNestedStateChange={onNestedStateChange}
                    />
                  ))}
                  {item.children && item.children.length > 50 && (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      {item.children.length - 50} more items not shown for
                      performance reasons
                    </div>
                  )}
                </Accordion>
              )}
          </AccordionContent>
        )}
      </AccordionItem>
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for nestedExpanded array
    const nestedExpandedEqual =
      prevProps.nestedExpanded?.length === nextProps.nestedExpanded?.length &&
      (prevProps.nestedExpanded?.length === 0 ||
        prevProps.nestedExpanded?.every(
          (id, idx) => id === nextProps.nestedExpanded?.[idx]
        ) === true);

    return (
      prevProps.item.strScheduleGUID === nextProps.item.strScheduleGUID &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.expandAll === nextProps.expandAll &&
      prevProps.level === nextProps.level &&
      prevProps.maxExpandedDepth === nextProps.maxExpandedDepth &&
      nestedExpandedEqual &&
      prevProps.nestedExpandedMap === nextProps.nestedExpandedMap
    );
  }
);

export { AccordionItemNode };
