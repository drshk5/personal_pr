import React, { memo } from "react";
import {
  Phone,
  Mail,
  Users,
  StickyNote,
  CheckSquare,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; bg: string; text: string }
> = {
  Call: {
    icon: Phone,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  Email: {
    icon: Mail,
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
  },
  Meeting: {
    icon: Users,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  Note: {
    icon: StickyNote,
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
  },
  Task: {
    icon: CheckSquare,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  FollowUp: {
    icon: RotateCcw,
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
  },
};

const DEFAULT_CONFIG = {
  icon: StickyNote,
  bg: "bg-gray-100 dark:bg-gray-800/50",
  text: "text-gray-600 dark:text-gray-400",
};

interface ActivityTypeIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-7 w-7", icon: "h-3.5 w-3.5" },
  md: { container: "h-9 w-9", icon: "h-4 w-4" },
  lg: { container: "h-11 w-11", icon: "h-5 w-5" },
};

const ActivityTypeIcon: React.FC<ActivityTypeIconProps> = ({
  type,
  size = "md",
  className,
}) => {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const s = sizeMap[size];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        config.bg,
        s.container,
        className
      )}
    >
      <Icon className={cn(config.text, s.icon)} />
    </div>
  );
};

export default memo(ActivityTypeIcon);

export function getActivityTypeLabel(type: string): string {
  if (type === "FollowUp") return "Follow Up";
  return type;
}
