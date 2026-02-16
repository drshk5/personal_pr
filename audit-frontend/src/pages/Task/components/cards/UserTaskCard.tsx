import { useState } from "react";
import { NotebookPen, Clock, ChevronDown, ChevronUp } from "lucide-react";

import { cn, getImagePath } from "@/lib/utils";
import {
  getTagColor,
  getInitials,
  formatMinutesShort,
  calculateTaskProgress,
} from "@/lib/task/task";

import { PRIORITY_FULL_COLORS } from "@/constants/Task/task";

import type { UserStatus } from "@/types/task/task-dashboard";

import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Status, StatusIndicator } from "@/components/ui/shadcn-io/status";
import { Progress } from "@/components/ui/progress";

interface UserTaskCardProps {
  user: UserStatus;
  onClick?: (user: UserStatus) => void;
  className?: string;
}

export function UserTaskCard({ user, onClick, className }: UserTaskCardProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const taskInfo = user.taskInfo;
  const hasTask = taskInfo !== null && taskInfo !== undefined;
  const isFromDifferentBoard = taskInfo?.bolIsFromDifferentBoard === true;

  const tags =
    taskInfo?.strTags && taskInfo.strTags.trim() !== ""
      ? taskInfo.strTags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

  const progress = taskInfo
    ? calculateTaskProgress(
        taskInfo.intActualMinutes,
        taskInfo.intEstimatedMinutes
      )
    : 0;
  const actualTime = formatMinutesShort(taskInfo?.intActualMinutes);
  const estimatedTime = formatMinutesShort(taskInfo?.intEstimatedMinutes);

  const isOverdue =
    taskInfo?.intEstimatedMinutes && taskInfo?.intActualMinutes
      ? taskInfo.intActualMinutes > taskInfo.intEstimatedMinutes
      : false;

  const userStatusIcon =
    hasTask && isOverdue && user.strUserStatus === "Active"
      ? "offline"
      : user.strUserStatus === "Active"
        ? "online"
        : "degraded";

  const handleClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  return (
    <Card
      className={cn(
        "relative p-4 transition-all hover:shadow-md border-2 flex flex-col",
        isTagsExpanded ? "h-auto" : "h-90",
        onClick && "cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {hasTask && taskInfo?.strPriority && (
        <Badge
          variant="outline"
          className={cn(
            "absolute top-3 right-3 font-semibold px-2 py-0.5 text-xs",
            PRIORITY_FULL_COLORS[
              taskInfo.strPriority as keyof typeof PRIORITY_FULL_COLORS
            ] || PRIORITY_FULL_COLORS.None
          )}
        >
          {taskInfo.strPriority}
        </Badge>
      )}

      <div className="flex justify-center mb-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-border-color">
            <AvatarImage
              src={getImagePath(user.strProfileImg)}
              alt={user.strUserName}
            />
            <AvatarFallback className="text-xl font-semibold bg-gray-200 text-gray-700">
              {getInitials(user.strUserName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-1 right-1">
            <Status
              status={userStatusIcon}
              className="h-5 w-5 p-0 border-2  rounded-full bg-muted/80 hover:bg-muted/80 flex items-center justify-center"
            >
              <StatusIndicator size="w-3 h-3" />
            </Status>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <h3 className="font-semibold text-base text-foreground line-clamp-1">
          {user.strUserName}
        </h3>
        {hasTask && taskInfo?.bolIsPrivate && (
          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Private
          </div>
        )}
      </div>

      {hasTask ? (
        <>
          {isFromDifferentBoard ? (
            <div className="flex items-center justify-center flex-1 p-4">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {user.strWorkingMessage ||
                    `Working on ${taskInfo?.strBoardName || "another project"}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Currently active on a different project
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-muted/90 dark:bg-muted/50 rounded-lg border border-border shrink-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4
                    className="font-bold text-base text-foreground line-clamp-1 flex-1 overflow-hidden text-ellipsis cursor-default"
                    title={taskInfo?.strTaskTitle || "Untitled Task"}
                  >
                    {taskInfo?.strTaskTitle || "Untitled Task"}
                  </h4>
                  {taskInfo?.strDescription && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotesOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                      title="View full description"
                    >
                      <NotebookPen className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {!taskInfo?.bolIsPrivate && (
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {taskInfo?.strBoardName && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Project:</span>
                        <span>{taskInfo.strBoardName}</span>
                      </div>
                    )}
                    {taskInfo?.strBoardSection && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Module:</span>
                        <span className="inline-flex items-center gap-1.5">
                          {taskInfo.strColor && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: taskInfo.strColor }}
                            />
                          )}
                          <span>{taskInfo.strBoardSection}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {tags.length > 0 && (
                <div className="shrink-0 mb-2">
                  <div
                    className={cn(
                      "flex gap-1.5 items-center",
                      isTagsExpanded ? "flex-wrap" : "overflow-hidden"
                    )}
                  >
                    <svg
                      className="w-4 h-4 text-muted-foreground shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <div
                      className={cn(
                        "flex gap-1.5 items-center min-w-0",
                        isTagsExpanded ? "flex-wrap" : "overflow-hidden"
                      )}
                    >
                      {(isTagsExpanded ? tags : tags.slice(0, 2)).map(
                        (tag, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 text-xs text-foreground font-medium flex items-center gap-1 bg-muted/50 rounded whitespace-nowrap shrink-0"
                          >
                            <div
                              className="h-2 w-2 rounded shrink-0"
                              style={{ backgroundColor: getTagColor(tag) }}
                            />
                            {tag}
                          </div>
                        )
                      )}
                    </div>
                    {tags.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTagsExpanded(!isTagsExpanded);
                        }}
                        className="px-2 py-1 text-xs text-primary font-medium hover:bg-muted rounded transition-colors flex items-center gap-1 shrink-0"
                      >
                        {isTagsExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />+
                            {tags.length - 2}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-1 space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Progress</span>
                  </div>
                  <span className="font-medium">
                    {actualTime} / {estimatedTime}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    "h-2",
                    isOverdue
                      ? "bg-red-100 dark:bg-red-950/30"
                      : "bg-gray-200 dark:bg-gray-800"
                  )}
                  indicatorClassName={cn(
                    isOverdue ? "bg-red-500" : "bg-primary"
                  )}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground italic">No active task</p>
        </div>
      )}

      {taskInfo?.strDescription && (
        <NotesDialog
          open={isNotesOpen}
          onOpenChange={setIsNotesOpen}
          title={taskInfo?.strTaskTitle || "Task Description"}
          description={taskInfo.strDescription}
        />
      )}
    </Card>
  );
}
