import {
  User,
  Calendar,
  Tag,
  List as ListIcon,
  ChevronDown,
  Timer,
  Paperclip,
  Lock,
  Pin,
  PinOff,
  Loader,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDueDate,
  isTaskOverdue,
  getPriorityBadgeColor,
  getStatusBadgeColor,
  getPriorityDotColor,
  getStatusDotColor,
  parseTags,
  stripHtmlTags,
  getTagColor,
} from "@/lib/task/task";

import { useElapsedTimer } from "@/hooks/api/task/use-elapsed-timer";

import type { TaskListItem } from "@/types/task/task";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: TaskListItem;
  onClick?: (task: TaskListItem) => void;
  className?: string;
  showAssignee?: boolean;
  showDates?: boolean;
  showPriority?: boolean;
  showStatus?: boolean;
  showProgress?: boolean;
  showTags?: boolean;
  variant?: "default" | "compact" | "detailed";
  showStartButton?: boolean;
  onStartButtonClick?: () => void;
  startButtonText?: string;
  startButtonDisabled?: boolean;
  actions?: { label: string; onClick: () => void; colorClass?: string }[];
  activeTimerStartIso?: string | null;
  accumulatedMs?: number;
  showTimer?: boolean;
  onPiPClick?: () => void;
  isPiPLoading?: boolean;
  isPipPinned?: boolean;
  onPinToggle?: () => void;
}

export function TaskCard({
  task,
  onClick,
  className,
  showAssignee = true,
  showDates = true,
  showPriority = true,
  showStatus = true,
  showTags = true,
  variant = "default",
  showStartButton = false,
  onStartButtonClick,
  startButtonText = "Start",
  startButtonDisabled = false,
  actions,
  activeTimerStartIso,
  accumulatedMs = 0,
  showTimer = false,
  onPiPClick,
  isPiPLoading = false,
  isPipPinned = false,
  onPinToggle,
}: TaskCardProps) {
  const handleClick = () => {
    onClick?.(task);
  };

  const truncateToWords = (text: string, maxWords: number = 15): string => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "...";
    }
    return text;
  };

  const checklist = task.strChecklists || [];
  const checklistTotal = task.intChecklistsCount ?? checklist.length;
  const checklistCompleted = checklist.filter((c) => c.bolIsCompleted).length;
  const filesCount = task.intFilesCount ?? task.strFiles?.length ?? 0;

  const isRunning = task.strStatus === "Started";
  const elapsed = useElapsedTimer(
    showTimer ? activeTimerStartIso : null,
    showTimer && isRunning,
    showTimer ? accumulatedMs : 0
  );

  const renderCompact = () => (
    <div
      className={cn(
        "p-3 bg-background border border-border-color rounded-md hover:border-primary/60 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 text-sm font-medium text-foreground">
          {task.strTitle}
        </div>
        {showTimer && (isRunning || accumulatedMs > 0) && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => e.stopPropagation()}
            className="h-7 px-2 hidden sm:inline-flex items-center gap-1"
          >
            <Timer
              className={`h-3.5 w-3.5 ${
                isRunning ? "text-amber-400" : "text-emerald-400"
              }`}
            />
            <span className="text-xs">{elapsed}</span>
          </Button>
        )}
        {actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 px-2 inline-flex items-center gap-1"
              >
                Actions <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((a, idx) => (
                <DropdownMenuItem
                  key={`action-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    a.onClick();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        a.colorClass || ""
                      }`}
                    />
                    {a.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onPiPClick && (
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 px-2 inline-flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (!isPiPLoading) {
                onPiPClick();
                if (onPinToggle) {
                  onPinToggle();
                }
              }
            }}
            disabled={isPiPLoading}
            title={
              isPiPLoading
                ? "Opening Picture-in-Picture..."
                : isPipPinned
                  ? "Open PiP (Pinned)"
                  : "Open PiP (Unpinned)"
            }
          >
            {isPiPLoading ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : isPipPinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
        {showStartButton && (
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartButtonClick?.();
            }}
            disabled={startButtonDisabled}
            className="h-7 px-2"
          >
            {startButtonText}
          </Button>
        )}
      </div>
      {stripHtmlTags(task.strDescription) && (
        <div className="text-sm text-foreground mt-1 line-clamp-1 overflow-hidden whitespace-nowrap text-ellipsis">
          {truncateToWords(stripHtmlTags(task.strDescription), 15)}
        </div>
      )}

      {showDates && (task.dtDueDate || task.dtStartDate) && (
        <>
          {task.dtDueDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span className="shrink-0">Due Date :</span>
              <Calendar
                className={cn(
                  "h-3 w-3",
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              />
              <span
                className={cn(
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              >
                {formatDueDate(task.dtDueDate)}
              </span>
            </div>
          )}
          {task.dtStartDate && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <span className="shrink-0">Start Date :</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.dtStartDate)}</span>
            </div>
          )}
          {(showPriority || (showStatus && task.strStatus)) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {showPriority && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      getPriorityDotColor(task.strPriority)
                    )}
                  />
                  <span>{task.strPriority}</span>
                </div>
              )}
              {showStatus && task.strStatus && (
                <div className="flex items-center gap-1 ml-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      getStatusDotColor(task.strStatus)
                    )}
                  />
                  <span>{task.strStatus}</span>
                  {task.bolIsPrivate && (
                    <Lock className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                  )}
                  {checklistTotal > 0 && (
                    <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
                      <ListIcon className="h-3 w-3" />
                      <span className="text-xs">
                        {checklistCompleted > 0
                          ? `${checklistCompleted}/${checklistTotal}`
                          : checklistTotal}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!task.dtDueDate && !task.dtStartDate && (showPriority || showStatus) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {showPriority && (
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  getPriorityDotColor(task.strPriority)
                )}
              />
              <span>{task.strPriority}</span>
            </span>
          )}
          {showStatus && task.strStatus && (
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  getStatusDotColor(task.strStatus)
                )}
              />
              <span>{task.strStatus}</span>
              {task.bolIsPrivate && (
                <Lock className="h-3 w-3 ml-1 text-muted-foreground" />
              )}
              {checklistTotal > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
                  <ListIcon className="h-3 w-3" />
                  <span className="text-xs">
                    {checklistCompleted > 0
                      ? `${checklistCompleted}/${checklistTotal}`
                      : checklistTotal}
                  </span>
                </span>
              )}
            </span>
          )}
        </div>
      )}

      {(task.strBoardName || task.strBoardSectionName) && (
        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
          {task.strBoardName && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Project:</span>
              <span>{task.strBoardName}</span>
            </div>
          )}
          {task.strBoardSectionName && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Module:</span>
              <span>{task.strBoardSectionName}</span>
            </div>
          )}
        </div>
      )}

      {(task.strAssignedTo || task.strAssignedBy) && (
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          <div className="space-y-0.5">
            {showAssignee && task.strAssignedTo && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0">Assigned To:</span>
                <span
                  className="text-foreground truncate max-w-50"
                  title={task.strAssignedTo}
                >
                  {task.strAssignedTo}
                </span>
              </div>
            )}
            {task.strAssignedBy && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0">Assigned By:</span>
                <span
                  className="text-foreground truncate max-w-50"
                  title={task.strAssignedBy}
                >
                  {task.strAssignedBy}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showTags && parseTags(task.strTags).length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {parseTags(task.strTags).map((t: string, idx: number) => (
            <span
              key={`${t}-${idx}`}
              className="text-xs px-2 py-0.5 rounded border border-border-color bg-muted/60 text-foreground flex items-center gap-1"
            >
              <span
                className="h-2.5 w-2.5 rounded"
                style={{ backgroundColor: getTagColor(t) }}
              />
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Documents */}
      {filesCount > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {filesCount} document{filesCount > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );

  const renderDefault = () => (
    <div
      className={cn(
        "p-3 bg-background border border-border-color rounded-md hover:border-primary/60 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200",
        className
      )}
      onClick={handleClick}
    >
      <div className="text-sm font-medium text-foreground">{task.strTitle}</div>

      {task.strDescription && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-1 truncate">
          {task.strDescription}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        {showPriority && (
          <span
            className={cn(
              "px-2 py-0.5 text-xs rounded-full border border-border-color",
              getPriorityBadgeColor(task.strPriority)
            )}
          >
            {task.strPriority}
          </span>
        )}
        <span
          className={cn(
            "px-2 py-0.5 text-xs rounded-full border border-border-color",
            getStatusBadgeColor(task.strStatus)
          )}
        >
          {task.strStatus}
        </span>
        {task.bolIsPrivate && (
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {checklistTotal > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <ListIcon className="h-3 w-3" />
            <span>
              {checklistCompleted > 0
                ? `${checklistCompleted}/${checklistTotal}`
                : checklistTotal}
            </span>
          </span>
        )}
      </div>

      {showTags && task.strTags && (
        <div className="flex items-center gap-1 mt-2">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {task.strTags}
          </span>
        </div>
      )}

      {filesCount > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {filesCount} document{filesCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {showDates && (task.dtDueDate || task.dtStartDate) && (
        <div className="mt-2 space-y-1">
          {task.dtDueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="shrink-0">Due Date :</span>
              <Calendar
                className={cn(
                  "h-3 w-3",
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              />
              <span
                className={cn(
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              >
                {formatDueDate(task.dtDueDate)}
              </span>
            </div>
          )}
          {task.dtStartDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="shrink-0">Start Date :</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(task.dtStartDate)}</span>
            </div>
          )}
          {(showPriority || (showStatus && task.strStatus)) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full border border-border-color",
                  getPriorityBadgeColor(task.strPriority)
                )}
              >
                {task.strPriority}
              </span>
            </div>
          )}
        </div>
      )}

      {showAssignee && task.strAssignedToGUID && (
        <div className="flex items-center justify-end mt-2">
          <div className="w-4 h-4 rounded-full bg-muted-foreground flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailed = () => (
    <div
      className={cn(
        "p-4 bg-background border border-border-color rounded-lg hover:border-primary/60 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all duration-200",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-base font-semibold text-foreground">
          {task.strTitle}
        </div>
        {task.strAssignedToGUID && showAssignee && (
          <div className="w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {task.strDescription && (
        <div className="text-sm text-muted-foreground mb-3 line-clamp-1 truncate">
          {task.strDescription}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {showPriority && (
          <span
            className={cn(
              "px-3 py-1 text-sm rounded-full border font-medium",
              getPriorityBadgeColor(task.strPriority)
            )}
          >
            {task.strPriority}
          </span>
        )}
        <span
          className={cn(
            "px-3 py-1 text-sm rounded-full border font-medium",
            getStatusBadgeColor(task.strStatus)
          )}
        >
          {task.strStatus}
        </span>
        {task.bolIsPrivate && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {showTags && parseTags(task.strTags).length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {parseTags(task.strTags).map((t: string, idx: number) => (
            <span
              key={`${t}-${idx}`}
              className="text-xs px-2 py-1 rounded border border-border bg-muted/80 text-foreground flex items-center gap-1"
            >
              <span
                className="h-3 w-3 rounded"
                style={{ backgroundColor: getTagColor(t) }}
              />
              {t}
            </span>
          ))}
        </div>
      )}

      {filesCount > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <span>
            {filesCount} document{filesCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {showDates && (task.dtDueDate || task.dtStartDate) && (
        <div className="space-y-1 text-sm text-muted-foreground">
          {task.dtDueDate && (
            <div className="flex items-center gap-2">
              <span className="shrink-0">Due Date :</span>
              <Calendar
                className={cn(
                  "h-4 w-4",
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              />
              <span
                className={cn(
                  isTaskOverdue(task.dtDueDate, task.strStatus)
                    ? "text-red-500"
                    : undefined
                )}
              >
                {formatDueDate(task.dtDueDate)}
              </span>
            </div>
          )}
          {task.dtStartDate && (
            <div className="flex items-center gap-2">
              <span className="shrink-0">Start Date :</span>
              <Calendar className="h-4 w-4" />
              <span>{formatDueDate(task.dtStartDate)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  switch (variant) {
    case "compact":
      return renderCompact();
    case "detailed":
      return renderDetailed();
    default:
      return renderDefault();
  }
}

export default TaskCard;
