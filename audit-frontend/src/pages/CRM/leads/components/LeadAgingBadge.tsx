import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadAgingBadgeProps {
  daysSinceLastActivity?: number | null;
  lastActivityDate?: string | null;
}

function getAgingConfig(days: number): {
  label: string;
  className: string;
  icon: "clock" | "warning";
} {
  if (days >= 30) {
    return {
      label: "Stale",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      icon: "warning",
    };
  }
  if (days >= 14) {
    return {
      label: "Aging",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      icon: "warning",
    };
  }
  if (days >= 7) {
    return {
      label: `${days}d`,
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      icon: "clock",
    };
  }
  return {
    label: `${days}d`,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: "clock",
  };
}

const LeadAgingBadge: React.FC<LeadAgingBadgeProps> = ({
  daysSinceLastActivity,
  lastActivityDate,
}) => {
  if (daysSinceLastActivity == null) return null;

  const config = getAgingConfig(daysSinceLastActivity);
  const Icon = config.icon === "warning" ? AlertTriangle : Clock;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {daysSinceLastActivity === 0
              ? "Activity today"
              : `${daysSinceLastActivity} day${daysSinceLastActivity > 1 ? "s" : ""} since last activity`}
            {lastActivityDate && (
              <span className="block text-muted-foreground mt-0.5">
                Last: {new Date(lastActivityDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LeadAgingBadge;
