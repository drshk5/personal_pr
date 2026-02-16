import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Title and Description Section */}
      <div className="w-full sm:w-auto">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Actions Section - Stacked on mobile, horizontal on desktop */}
      {actions && (
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
