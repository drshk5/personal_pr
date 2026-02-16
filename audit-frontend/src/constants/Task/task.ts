export const PRIORITY_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export const STATUS_OPTIONS = [
  { value: "Not Started", label: "Not Started" },
  { value: "Started", label: "Started" },
  { value: "On Hold", label: "On Hold" },
  { value: "Completed", label: "Completed" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "For Review", label: "For Review" },
  { value: "Reassign", label: "Reassign" },
];

export const PRIORITY_COLOR_CLASS: Record<string, string> = {
  None: "bg-gray-500",
  Low: "bg-green-500",
  Medium: "bg-orange-500",
  High: "bg-red-500",
};

export const STATUS_COLOR_BOX: Record<string, string> = {
  "Not Started": "bg-gray-600",
  Started: "bg-blue-500",
  "On Hold": "bg-yellow-500",
  Completed: "bg-green-500",
  Incomplete: "bg-gray-500",
  "For Review": "bg-red-500",
  Reassign: "bg-purple-500",
};

export const PRIORITY_BADGE_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-orange-100 text-orange-800 border-orange-200",
  Low: "bg-green-100 text-green-800 border-green-200",
  None: "bg-gray-100 text-gray-800 border-gray-200",
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-800 border-gray-200",
  Started: "bg-blue-100 text-blue-800 border-blue-200",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Incomplete: "bg-gray-100 text-gray-800 border-gray-200",
  "For Review": "bg-red-100 text-red-800 border-red-200",
  Reassign: "bg-purple-100 text-purple-800 border-purple-200",
};

export const PRIORITY_DOT_COLORS: Record<string, string> = {
  High: "bg-red-500",
  Medium: "bg-orange-500",
  Low: "bg-green-500",
  None: "bg-gray-500",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  "Not Started": "bg-gray-500",
  Started: "bg-blue-500",
  "On Hold": "bg-yellow-500",
  Completed: "bg-green-500",
  Incomplete: "bg-gray-500",
  "For Review": "bg-red-500",
  Reassign: "bg-purple-500",
};

export const PRIORITY_FULL_COLORS: Record<string, string> = {
  High: "bg-red-500 text-white border-red-500",
  Medium: "bg-orange-500 text-white border-orange-500",
  Low: "bg-green-500 text-white border-green-500",
  None: "bg-gray-400 text-white border-gray-400",
};

export const DEFAULT_USER_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
];

export const STATUS_COLOR: Record<string, string> = {
  "Not Started": "#6B7280",
  Started: "#3B82F6",
  "On Hold": "#F59E0B",
  Completed: "#10B981",
  Incomplete: "#EF4444",
  "For Review": "#EF4444",
  Reassign: "#8b5cf6",
};

export const DEFAULT_SECTION_COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ef4444", label: "Red" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#06b6d4", label: "Cyan" },
];

export const DEFAULT_SECTION_COLORS = DEFAULT_SECTION_COLOR_OPTIONS.map(
  (option) => option.value
);

export const NOTIFICATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "assign", label: "Assigned" },
  { value: "Reminder", label: "Reminder" },
  { value: "review_request", label: "Review Request" },
  { value: "task_review_completed", label: "Review Completed" },
  { value: "task_review_incomplete", label: "Review Incomplete" },
  { value: "task_review_reassigned", label: "Review Reassigned" },
  { value: "task_review_status_changed", label: "Review Status Changed" },
] as const;
