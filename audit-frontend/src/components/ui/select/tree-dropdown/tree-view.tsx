import { cn } from "@/lib/utils";
import type { TreeItem } from "./tree-dropdown";

export interface TreeViewProps<T extends TreeItem> {
  data: T[];
  onSelectItem: (item: T) => void;
  selectedItems: string[];
  className?: string;
  itemClassName?: string;
  hoverItemClassName?: string;
  selectedItemClassName?: string;
  labelClassName?: string;
  renderSelectedIcon?: (item: T) => React.ReactNode;
}

export function TreeView<T extends TreeItem>({
  data,
  onSelectItem,
  selectedItems,
  className,
  itemClassName,
  hoverItemClassName,
  selectedItemClassName,
  labelClassName,
  renderSelectedIcon,
}: TreeViewProps<T>) {
  return (
    <div className={cn("text-sm w-full min-h-0", className)}>
      {data.map((item) => (
        <TreeViewItem
          key={item.id}
          item={item}
          onSelectItem={onSelectItem}
          selectedItems={selectedItems}
          itemClassName={itemClassName}
          hoverItemClassName={hoverItemClassName}
          selectedItemClassName={selectedItemClassName}
          labelClassName={labelClassName}
          renderSelectedIcon={renderSelectedIcon}
        />
      ))}
    </div>
  );
}

interface TreeViewItemProps<T extends TreeItem> {
  item: T;
  onSelectItem: (item: T) => void;
  selectedItems: string[];
  itemClassName?: string;
  hoverItemClassName?: string;
  selectedItemClassName?: string;
  labelClassName?: string;
  renderSelectedIcon?: (item: T) => React.ReactNode;
}

function TreeViewItem<T extends TreeItem>({
  item,
  onSelectItem,
  selectedItems,
  itemClassName,
  hoverItemClassName,
  selectedItemClassName,
  labelClassName,
  renderSelectedIcon,
}: TreeViewItemProps<T>) {
  const isSelected = selectedItems.includes(item.id);
  const isLabel = item.type === "label";
  const hoverClass = hoverItemClassName ?? "hover:bg-accent/30";
  const appliedHoverClass =
    !isSelected || !!hoverItemClassName ? hoverClass : "";
  const selectedClass = selectedItemClassName ?? "bg-accent/60";
  const labelClass = labelClassName ?? "text-primary font-medium py-1";

  const handleClick = () => {
    if (item.type === "data") {
      onSelectItem(item);
    }
  };

  return (
    <div>
      {/* Item itself */}
      <div
        className={cn(
          "py-2 px-3 transition-colors flex items-center rounded-md",
          isLabel ? "cursor-default" : "cursor-pointer",
          appliedHoverClass,
          isSelected ? selectedClass : "",
          isLabel ? labelClass : "text-foreground",
          itemClassName
        )}
        onClick={isLabel ? undefined : handleClick}
      >
        <div className="grow truncate">
          {isLabel ? (
            <div className="text-muted-foreground text-xs uppercase font-medium mb-1 mt-2">
              {item.name}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="mr-2">{item.name}</span>
              {item.code && (
                <span className="text-xs text-muted-foreground">
                  {item.code}
                </span>
              )}
            </div>
          )}
        </div>
        {isSelected && !isLabel && renderSelectedIcon && (
          <div className="ml-2 flex items-center">
            {renderSelectedIcon(item)}
          </div>
        )}
      </div>

      {/* Children */}
      {item.children && item.children.length > 0 && (
        <div className="ml-3">
          {item.children.map((child) => (
            <TreeViewItem
              key={child.id}
              item={child as T}
              onSelectItem={onSelectItem}
              selectedItems={selectedItems}
              itemClassName={itemClassName}
              hoverItemClassName={hoverItemClassName}
              selectedItemClassName={selectedItemClassName}
              labelClassName={labelClassName}
              renderSelectedIcon={renderSelectedIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
