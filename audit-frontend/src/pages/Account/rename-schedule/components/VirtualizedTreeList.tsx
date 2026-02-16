import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from "react";
import { List } from "react-window";
import { Edit, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RenameSchedule } from "@/types/central/rename-schedule";
import { Modules, Actions, usePermission } from "@/lib/permissions";

interface FlatNode {
  item: RenameSchedule;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface VirtualizedTreeListProps {
  data: RenameSchedule[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEditItem?: (item: RenameSchedule) => void;
  onSelectItem?: (item: RenameSchedule) => void;
  height: number;
}

const ROW_HEIGHT = 48; // Adjust based on your design

function flattenTree(
  items: RenameSchedule[],
  expandedIds: Set<string>,
  level = 0
): FlatNode[] {
  const result: FlatNode[] = [];

  for (const item of items) {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isExpanded = expandedIds.has(item.strScheduleGUID);

    result.push({
      item,
      level,
      hasChildren,
      isExpanded,
    });

    if (hasChildren && isExpanded && item.children) {
      result.push(...flattenTree(item.children, expandedIds, level + 1));
    }
  }

  return result;
}

interface CustomRowProps {
  flatNodes: FlatNode[];
  onToggleExpand: (id: string) => void;
  onEditItem?: (item: RenameSchedule) => void;
  onSelectItem?: (item: RenameSchedule) => void;
  canSave: boolean;
}

interface RowProps extends CustomRowProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

const Row = React.memo((props: RowProps): React.ReactElement => {
  const {
    index,
    style,
    ariaAttributes,
    flatNodes,
    onToggleExpand,
    onEditItem,
    canSave,
  } = props;

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const node = flatNodes[index];
      if (node && node.hasChildren) {
        onToggleExpand(node.item.strScheduleGUID);
      }
    },
    [flatNodes, index, onToggleExpand]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const node = flatNodes[index];
      if (node && onEditItem && node.item.bolIsEditable) {
        onEditItem(node.item);
      }
    },
    [flatNodes, index, onEditItem]
  );

  const node = flatNodes[index];

  if (!node) return <div style={style} {...ariaAttributes} />;

  const { item, level, hasChildren, isExpanded } = node;

  const displayName = item.strRenameScheduleName || item.strScheduleName;

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

  return (
    <div
      {...ariaAttributes}
      style={{
        ...style,
        contain: "layout style paint",
        contentVisibility: level > 1 ? "auto" : "visible",
      }}
      className={cn(
        level === 0 ? "bg-card  border-b border-border-color" : "border-b-0",
        level > 0 && `${getLevelBackground(level)} overflow-hidden mb-0.5`
      )}
    >
      <div
        className={cn(
          "py-3 hover:no-underline flex items-center justify-between cursor-pointer",
          level === 0 ? "font-medium" : "",
          item.bolIsEditable ? "text-primary" : "text-foreground"
        )}
        style={{
          paddingLeft: level > 0 ? `${level * 12 + 12}px` : "12px",
          paddingRight: "12px",
        }}
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2 grow overflow-hidden">
          {/* Chevron */}
          {hasChildren && (
            <div className="flex-none mr-1 flex justify-center cursor-pointer">
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{
                  transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                }}
              />
            </div>
          )}

          {!hasChildren && <div className="w-5"></div>}

          {/* Edit/Lock Icon */}
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
              >
                <Edit className="h-3.5 w-3.5" />
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

          {/* Name and Code */}
          <div className="flex items-center flex-wrap overflow-hidden">
            <span className="font-medium truncate cursor-pointer">
              {displayName}
            </span>
            {item.strScheduleCode && (
              <span className="hidden md:inline ml-2 text-xs text-muted-foreground truncate">
                ({item.strScheduleCode})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Row.displayName = "VirtualizedTreeRow";

export function VirtualizedTreeList({
  data,
  expandedIds,
  onToggleExpand,
  onEditItem,
  onSelectItem,
  height,
}: VirtualizedTreeListProps) {
  const canSave = usePermission(Modules.CHART_OF_ACCOUNT, Actions.SAVE);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height });

  // Use ResizeObserver to track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });

    resizeObserver.observe(container);

    // Initial size
    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const flatNodes = useMemo(
    () => flattenTree(data, expandedIds),
    [data, expandedIds]
  );

  const rowProps: CustomRowProps = useMemo(
    () => ({
      flatNodes,
      onToggleExpand,
      onEditItem,
      onSelectItem,
      canSave,
    }),
    [flatNodes, onToggleExpand, onEditItem, onSelectItem, canSave]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {containerSize.height > 0 && (
        <List<CustomRowProps>
          defaultHeight={containerSize.height}
          rowCount={flatNodes.length}
          rowHeight={ROW_HEIGHT}
          // @ts-expect-error - React.memo wrapper causes type mismatch
          rowComponent={Row}
          rowProps={rowProps}
          overscanCount={5}
        />
      )}
    </div>
  );
}
