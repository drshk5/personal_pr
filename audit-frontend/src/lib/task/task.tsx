import type { TaskRecurrence } from "@/types/task/task";
import {
  STATUS_COLOR_BOX,
  STATUS_COLOR,
  PRIORITY_BADGE_COLORS,
  STATUS_BADGE_COLORS,
  PRIORITY_DOT_COLORS,
  STATUS_DOT_COLORS,
} from "@/constants/Task/task";
import {
  Bell,
  UserPlus,
  Clock,
  FileCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

export function formatRecurrenceSummary(r: TaskRecurrence): string {
  const interval = Math.max(1, Number(r.intRecurrenceInterval || 1));
  const pluralize = (n: number, unit: string) => (n === 1 ? unit : `${unit}s`);

  const toOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };
  const monthName = (m: number) =>
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][Math.min(12, Math.max(1, m)) - 1];
  const normDay = (d: string) => {
    const map: Record<string, string> = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      tues: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      thur: "Thursday",
      thurs: "Thursday",
      fri: "Friday",
      sat: "Saturday",
    };
    const key = d.toLowerCase().slice(0, 4).replace(/\.$/, "");
    return map[key] || d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
  };

  const joinDays = (days: string[]) => days.map(normDay).join(", ");

  switch (r.strRecurrenceType) {
    case "Daily": {
      return interval === 1
        ? "Every day"
        : `Every ${interval} ${pluralize(interval, "day")}`;
    }
    case "Weekly": {
      const days = (r.strDaysOfWeek || []).filter(Boolean);
      const onPart = days.length ? ` on ${joinDays(days as string[])}` : "";
      return interval === 1
        ? `Every week${onPart}`
        : `Every ${interval} ${pluralize(interval, "week")}${onPart}`;
    }
    case "Monthly": {
      const onDay =
        typeof r.intDayOfMonth === "number" && r.intDayOfMonth != null;
      const byPattern = r.strWeekPattern && r.strWeekDay;
      const prefix =
        interval === 1
          ? ""
          : `Every ${interval} ${pluralize(interval, "month")} on `;
      if (onDay) {
        if (interval === 1)
          return `On the ${toOrdinal(
            r.intDayOfMonth as number
          )} of every month`;
        return `${prefix}the ${toOrdinal(r.intDayOfMonth as number)}`;
      }
      if (byPattern) {
        const weekWord = r.strWeekPattern as string;
        const dayWord = normDay(r.strWeekDay as string);
        if (interval === 1)
          return `On the ${weekWord} ${dayWord} of every month`;
        return `${prefix}the ${weekWord} ${dayWord}`;
      }
      return interval === 1
        ? "Every month"
        : `Every ${interval} ${pluralize(interval, "month")}`;
    }
    case "Yearly": {
      const month = r.intMonthOfYear ? monthName(r.intMonthOfYear) : undefined;
      const onDay =
        typeof r.intDayOfMonth === "number" && r.intDayOfMonth != null;
      const byPattern = r.strWeekPattern && r.strWeekDay && month;
      const yearsPart =
        interval === 1
          ? "Every year"
          : `Every ${interval} ${pluralize(interval, "year")}`;

      if (month && onDay) {
        return `${yearsPart} on ${month} ${toOrdinal(
          r.intDayOfMonth as number
        )}`;
      }
      if (byPattern) {
        const weekWord = r.strWeekPattern as string;
        const dayWord = normDay(r.strWeekDay as string);
        return `${yearsPart} on the ${weekWord} ${dayWord} of ${month}`;
      }
      return yearsPart;
    }
    default:
      return "Custom";
  }
}

export function getTagColor(tagName: string): string {
  const colors = [
    "#FF6B9D",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ];

  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

export function getStatusColor(status: string): string {
  const statusColorMap: Record<string, string> = {
    "bg-gray-600": "bg-gray-100 text-gray-800",
    "bg-blue-500": "bg-blue-100 text-blue-800",
    "bg-yellow-500": "bg-yellow-100 text-yellow-800",
    "bg-green-500": "bg-green-100 text-green-800",
    "bg-gray-500": "bg-gray-100 text-gray-800",
    "bg-red-500": "bg-red-100 text-red-800",
    "bg-purple-500": "bg-purple-100 text-purple-800",
  };

  const bgColor = STATUS_COLOR_BOX[status];
  return statusColorMap[bgColor] || "bg-gray-100 text-gray-800";
}

export function formatTaskDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMinutesToHHMMSS(
  minutes: number | null | undefined
): string {
  if (!minutes) return "NA";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formatted = `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:00`;
  return formatted === "00:00:00" ? "NA" : formatted;
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    High: STATUS_COLOR["Incomplete"],
    Medium: STATUS_COLOR["On Hold"],
    Low: STATUS_COLOR["Completed"],
    None: STATUS_COLOR["Not Started"],
  };
  return priorityColors[priority] || STATUS_COLOR["Not Started"];
}

export function getNotificationColor(type: string): string {
  switch (type.toLowerCase()) {
    case "assign":
      return "text-blue-600 dark:text-blue-400";
    case "reminder":
      return "text-orange-600 dark:text-orange-400";
    case "review_request":
      return "text-purple-600 dark:text-purple-400";
    case "task_review_completed":
      return "text-green-600 dark:text-green-400";
    case "task_review_incomplete":
      return "text-red-600 dark:text-red-400";
    case "task_review_reassigned":
      return "text-amber-600 dark:text-amber-400";
    case "task_review_status_changed":
      return "text-indigo-600 dark:text-indigo-400";
    case "task_assigned":
      return "text-blue-600 dark:text-blue-400";
    case "task_completed":
      return "text-green-600 dark:text-green-400";
    case "task_commented":
      return "text-purple-600 dark:text-purple-400";
    case "task_due":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

export function getNotificationIcon(type: string) {
  switch (type.toLowerCase()) {
    case "assign":
      return <UserPlus className="h-4 w-4" />;
    case "reminder":
      return <Clock className="h-4 w-4" />;
    case "review_request":
      return <FileCheck className="h-4 w-4" />;
    case "task_review_completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "task_review_incomplete":
      return <XCircle className="h-4 w-4" />;
    case "task_review_reassigned":
      return <RefreshCw className="h-4 w-4" />;
    case "task_review_status_changed":
      return <AlertCircle className="h-4 w-4" />;
    case "task_assigned":
      return <UserPlus className="h-4 w-4" />;
    case "task_completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "task_commented":
      return <MessageSquare className="h-4 w-4" />;
    case "task_due":
      return <Clock className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

export function formatDueDate(dateString: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function isTaskOverdue(
  dateString: string | null,
  status?: string | null
): boolean {
  if (!dateString) return false;
  if (status === "Completed") return false;
  const due = new Date(dateString).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return due < today;
}

export function getPriorityBadgeColor(priority: string): string {
  return PRIORITY_BADGE_COLORS[priority] || PRIORITY_BADGE_COLORS.None;
}

export function getStatusBadgeColor(status: string): string {
  return STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS["Not Started"];
}

export function getPriorityDotColor(priority: string): string {
  return PRIORITY_DOT_COLORS[priority] || PRIORITY_DOT_COLORS.None;
}

export function getStatusDotColor(status: string): string {
  return STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS["Not Started"];
}

export function parseTags(tags: string | null | undefined): string[] {
  return tags
    ? tags
        .split(",")
        .map((t) => t.trim().replace(/^"|"$/g, ""))
        .filter(Boolean)
    : [];
}

export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getInitials(name: string): string {
  const nameParts = name.trim().split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
}

export function formatMinutesShort(minutes: number | null | undefined): string {
  if (!minutes || minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

export function calculateTaskProgress(
  actualMinutes: number,
  estimatedMinutes: number | null
): number {
  if (!estimatedMinutes || estimatedMinutes === 0) return 0;
  const progress = (actualMinutes / estimatedMinutes) * 100;
  return Math.min(progress, 100);
}
