import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentItemProps {
  label: string;
  count?: number;
  isActive?: boolean;
  indent?: boolean;
  className?: string;
  onClick?: () => void;
}

export function DocumentItem({
  label,
  count,
  isActive = false,
  indent = false,
  className,
  onClick,
}: DocumentItemProps) {
  return (
    <Button
      size="sm"
      variant={isActive ? "default" : "ghost"}
      className={cn(
        "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-sm",
        "hover:bg-accent hover:text-accent-foreground",
        isActive &&
          "dark:bg-sidebar-accent dark:text-sidebar-accent-foreground dark:font-medium",
        indent && "ml-2",
        className
      )}
      onClick={onClick}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <Badge variant="outline" className="ml-auto px-1.5 py-0.5 text-xs">
          {count}
        </Badge>
      )}
    </Button>
  );
}
