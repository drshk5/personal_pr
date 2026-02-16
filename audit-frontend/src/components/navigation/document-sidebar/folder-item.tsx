import * as React from "react";
import { Folder, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderItemProps {
  label: string;
  className?: string;
  folderId?: string;
  count?: number;
  isActive?: boolean;
  isEditing?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: (newName: string) => void;
  onCancel?: () => void;
}

export function FolderItem({
  label,
  className,
  count,
  isActive = false,
  isEditing = false,
  onClick,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: FolderItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [editValue, setEditValue] = React.useState(label);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(label);
  }, [label]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== label) {
      onSave?.(editValue.trim());
    } else {
      onCancel?.();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("px-2 mb-2", className)}>
        <Input
          ref={inputRef}
          type="text"
          className="h-8"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            } else if (e.key === "Escape") {
              setEditValue(label);
              onCancel?.();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        !isActive && "hover:bg-accent hover:text-accent-foreground rounded-md",
        isActive &&
          "bg-sidebar-accent dark:bg-sidebar-accent text-sidebar-accent-foreground dark:text-sidebar-accent-foreground rounded-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center w-full min-w-0">
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "flex grow items-center justify-start gap-2 px-2 py-1.5 text-sm min-w-0",
            "hover:bg-transparent text-foreground hover:text-inherit", // Remove button hover effect
            isActive && "bg-transparent dark:bg-transparent font-medium"
          )}
          onClick={onClick}
        >
          <Folder className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          {!isHovered && count !== undefined && (
            <span
              className={cn(
                "ml-auto text-xs",
                isActive
                  ? "text-sidebar-accent-foreground dark:text-sidebar-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              {count}
            </span>
          )}
        </Button>

        {isHovered && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 hover:bg-transparent",
              isActive && "bg-transparent"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit folder"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}

        {isHovered && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 hover:bg-transparent",
              isActive && "bg-transparent"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete folder"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
