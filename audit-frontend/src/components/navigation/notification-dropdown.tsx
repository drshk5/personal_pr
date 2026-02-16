import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, ExternalLink, Eye } from "lucide-react";

import {
  useMarkAsRead,
  useMarkAllAsRead,
  useNotifications,
  useUnreadCount,
  useNotificationUpdateWS,
} from "@/hooks";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import type { Notification } from "@/types";

import { cn } from "@/lib/utils";
import { notificationSound } from "@/lib/notification-sound";
import { desktopNotification } from "@/lib/utils/desktop-notification";
import { NOTIFICATION_TYPES } from "@/constants/Task/task";
import { signalRService } from "@/services";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotificationColor, getNotificationIcon } from "@/lib/task/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";
import { ModuleBase } from "@/lib/permissions";

type FilterType = "unread" | "archive";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("unread");
  const [notificationType, setNotificationType] = useState<string>("all");
  const [unreadPage, setUnreadPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const [accumulatedUnread, setAccumulatedUnread] = useState<Notification[]>(
    () => {
      try {
        const cached = sessionStorage.getItem("notification_unread_cache");
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  );
  const [accumulatedArchived, setAccumulatedArchived] = useState<
    Notification[]
  >(() => {
    try {
      const cached = sessionStorage.getItem("notification_archived_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskGUID, setSelectedTaskGUID] = useState<
    string | undefined
  >();
  const [taskModalModule, setTaskModalModule] = useState<string>(
    ModuleBase.MY_TASK
  );
  const [isLoadingMoreUnread, setIsLoadingMoreUnread] = useState(false);
  const [isLoadingMoreArchived, setIsLoadingMoreArchived] = useState(false);
  const [lastProcessedNotificationGUID, setLastProcessedNotificationGUID] =
    useState<string | null>(null);
  const [isInitialLoadUnread, setIsInitialLoadUnread] = useState(true);
  const [isInitialLoadArchived, setIsInitialLoadArchived] = useState(true);
  const pageSize = 10;

  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Hooks must be called unconditionally
  const { data: initialCount } = useUnreadCount(!!user);
  const notificationUpdate = useNotificationUpdateWS(!!user);

  const unreadCount =
    notificationUpdate.unreadCount > 0
      ? notificationUpdate.unreadCount
      : (initialCount ?? 0);

  // Reset pagination when dropdown opens; keep cached data visible while fetching
  useEffect(() => {
    if (isOpen) {
      setUnreadPage(1);
      setArchivePage(1);
      // If we already have cached data, skip skeleton
      if (filter === "unread" && accumulatedUnread.length > 0) {
        setIsInitialLoadUnread(false);
      }
      if (filter === "archive" && accumulatedArchived.length > 0) {
        setIsInitialLoadArchived(false);
      }
    }
  }, [isOpen, filter, accumulatedUnread.length, accumulatedArchived.length]);

  const { data: unreadResponse, refetch: refetchUnread } = useNotifications(
    {
      pageNumber: unreadPage,
      pageSize,
      bIsRead: false,
      strNotificationType:
        notificationType === "all" ? undefined : notificationType,
    },
    !!user && isOpen && filter === "unread"
  );

  const { data: archivedResponse, refetch: refetchArchived } = useNotifications(
    {
      pageNumber: archivePage,
      pageSize,
      bIsRead: true,
      strNotificationType:
        notificationType === "all" ? undefined : notificationType,
    },
    !!user && isOpen && filter === "archive"
  );

  useEffect(() => {
    if (unreadResponse !== undefined) {
      setIsLoadingMoreUnread(false);
      setIsInitialLoadUnread(false);
      if (unreadResponse?.data && unreadResponse.data.length > 0) {
        setAccumulatedUnread((prev) => {
          // If page is 1, replace the entire list
          if (unreadPage === 1) {
            sessionStorage.setItem(
              "notification_unread_cache",
              JSON.stringify(unreadResponse.data)
            );
            return unreadResponse.data;
          }
          // For pagination, add only new items
          const newItems = unreadResponse.data.filter(
            (item) =>
              !prev.some(
                (p) => p.strNotificationGUID === item.strNotificationGUID
              )
          );
          const updated = [...prev, ...newItems];
          sessionStorage.setItem(
            "notification_unread_cache",
            JSON.stringify(updated)
          );
          return updated;
        });
      } else if (unreadPage === 1) {
        // Clear accumulated on first page with no items
        setAccumulatedUnread([]);
        sessionStorage.setItem("notification_unread_cache", JSON.stringify([]));
      }
    }
  }, [unreadResponse, unreadPage]);

  useEffect(() => {
    if (archivedResponse !== undefined) {
      setIsLoadingMoreArchived(false);
      setIsInitialLoadArchived(false);
      if (archivedResponse?.data && archivedResponse.data.length > 0) {
        setAccumulatedArchived((prev) => {
          // If page is 1, replace the entire list
          if (archivePage === 1) {
            sessionStorage.setItem(
              "notification_archived_cache",
              JSON.stringify(archivedResponse.data)
            );
            return archivedResponse.data;
          }
          // For pagination, add only new items
          const newItems = archivedResponse.data.filter(
            (item) =>
              !prev.some(
                (p) => p.strNotificationGUID === item.strNotificationGUID
              )
          );
          const updated = [...prev, ...newItems];
          sessionStorage.setItem(
            "notification_archived_cache",
            JSON.stringify(updated)
          );
          return updated;
        });
      } else if (archivePage === 1) {
        // Clear accumulated on first page with no items
        setAccumulatedArchived([]);
        sessionStorage.setItem(
          "notification_archived_cache",
          JSON.stringify([])
        );
      }
    }
  }, [archivedResponse, archivePage]);

  // Removed sessionStorage persistence - always fetch fresh data
  const unreadNotifications = accumulatedUnread;
  const archivedNotifications = accumulatedArchived;

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Clear notification state when user logs out and disconnect WebSocket
  useEffect(() => {
    if (!user) {
      // Immediately disconnect WebSocket to signal backend
      signalRService.stop().catch((err) => {
        console.warn("[NotificationDropdown] Error stopping SignalR:", err);
      });

      // Clear all notification state
      setAccumulatedUnread([]);
      setAccumulatedArchived([]);
      setIsOpen(false);
      setUnreadPage(1);
      setArchivePage(1);
      setLastProcessedNotificationGUID(null);
      setIsInitialLoadUnread(true);
      setIsInitialLoadArchived(true);
    }
  }, [user]);

  useEffect(() => {
    if (user && desktopNotification.isSupported()) {
      desktopNotification.requestPermission();
    }
  }, [user]);
  // Removed: automatic refetch effect was causing infinite loop
  // Query automatically triggers when enabled state changes (isOpen && filter)

  useEffect(() => {
    if (notificationUpdate.lastNotification && user) {
      const notification = notificationUpdate.lastNotification;

      // Only process if this is a NEW notification we haven't seen before
      if (notification.strNotificationGUID !== lastProcessedNotificationGUID) {
        setLastProcessedNotificationGUID(notification.strNotificationGUID);

        // Play sound and show desktop notification ONLY for new messages
        notificationSound.play();

        desktopNotification.show({
          title: notification.strTitle,
          body: notification.strMessage,
          tag: notification.strNotificationGUID,
          data: notification,
          onClick: () => {
            setIsOpen(true);
          },
        });

        // Reset and refetch notifications when new notification arrives
        setUnreadPage(1);
        setArchivePage(1);
        setAccumulatedUnread([]);
        setAccumulatedArchived([]);
        if (isOpen) {
          refetchUnread();
          refetchArchived();
        }
      }
    }
  }, [
    notificationUpdate.lastNotification,
    user,
    lastProcessedNotificationGUID,
    isOpen,
    refetchUnread,
    refetchArchived,
  ]);

  const resetAccumulatedNotifications = () => {
    setUnreadPage(1);
    setArchivePage(1);
    setAccumulatedUnread([]);
    setAccumulatedArchived([]);
  };

  const handleMarkAsRead = (guid: string) => {
    markAsReadMutation.mutate(
      { guid },
      {
        onSuccess: () => {
          resetAccumulatedNotifications();
        },
      }
    );
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        resetAccumulatedNotifications();
      },
    });
  };

  const handleShowMore = () => {
    if (filter === "unread") {
      setIsLoadingMoreUnread(true);
      setUnreadPage((prev) => prev + 1);
    } else {
      setIsLoadingMoreArchived(true);
      setArchivePage((prev) => prev + 1);
    }
  };

  const currentNotifications =
    filter === "unread" ? unreadNotifications : archivedNotifications;
  const currentResponse =
    filter === "unread" ? unreadResponse : archivedResponse;
  const hasMore = currentResponse?.hasNextPage ?? false;

  const filteredNotifications = currentNotifications;

  // Don't render if user not logged in
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-gray-200 dark:hover:bg-gray-900"
          title="Notifications"
        >
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute text-white -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[80vw] sm:w-95 p-0  max-sm:-translate-x-[-12%]"
      >
        <div className="flex flex-col px-3 sm:px-4 py-2 sm:py-3 border-b border-border space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAllAsRead}
                className="h-8 w-8"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="h-8 text-xs"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === "archive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("archive")}
              className="h-8 text-xs"
            >
              Archive
            </Button>

            <Select
              value={notificationType}
              onValueChange={(value) => {
                setNotificationType(value);
                resetAccumulatedNotifications();
              }}
            >
              <SelectTrigger className="h-8 border-border text-xs ml-auto">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="text-xs"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-[45vh] sm:h-100 overflow-y-auto">
          {!isOpen ? null : isInitialLoadUnread && filter === "unread" ? ( // Don't render anything if dropdown is closed
            <>
              <NotificationSkeletonLoader />
            </>
          ) : isInitialLoadArchived && filter === "archive" ? (
            <>
              <NotificationSkeletonLoader />
            </>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border-color">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.strNotificationGUID}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    getIcon={getNotificationIcon}
                    getColor={getNotificationColor}
                    navigate={navigate}
                    onClose={() => setIsOpen(false)}
                    onViewTask={(taskGUID, module) => {
                      setSelectedTaskGUID(taskGUID);
                      setTaskModalModule(module);
                      setShowTaskModal(true);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {currentNotifications.length > 0 && hasMore && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              {(
                filter === "unread"
                  ? isLoadingMoreUnread
                  : isLoadingMoreArchived
              ) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center"
                  disabled
                >
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-current rounded-full"></span>
                  Loading...
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleShowMore}
                >
                  Show More
                </Button>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>

      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        taskGUID={selectedTaskGUID}
        mode="edit"
        permissionModule={taskModalModule}
        onSuccess={async () => {
          setShowTaskModal(false);
          setUnreadPage(1);
          setArchivePage(1);
          setAccumulatedUnread([]);
          setAccumulatedArchived([]);
          refetchUnread();
          refetchArchived();
        }}
      />
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (guid: string) => void;
  getIcon: (type: string) => React.ReactNode;
  getColor: (type: string) => string;
  navigate: (path: string) => void;
  onClose: () => void;
  onViewTask: (taskGUID: string, module: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  getIcon,
  getColor,
  navigate,
  onClose,
  onViewTask,
}: NotificationItemProps) {
  const handleJumpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const type = notification.strNotificationType;

    if (
      type === "assign" ||
      type === "Reminder" ||
      type === "task_review_reassigned"
    ) {
      navigate("/mytask");
      onClose();
    } else if (type === "review_request") {
      navigate("/review-task");
      onClose();
    }
  };

  const shouldShowJumpIcon =
    notification.strNotificationType === "assign" ||
    notification.strNotificationType === "Reminder" ||
    notification.strNotificationType === "task_review_reassigned" ||
    notification.strNotificationType === "review_request";

  const getTaskModule = () => {
    const type = notification.strNotificationType;
    if (type === "review_request") {
      return ModuleBase.REVIEW_TASK;
    } else if (
      type === "assign" ||
      type === "Reminder" ||
      type === "task_review_reassigned"
    ) {
      return ModuleBase.MY_TASK;
    }
    return ModuleBase.MY_TASK;
  };

  const handleViewTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.strTaskGUID) {
      onViewTask(notification.strTaskGUID, getTaskModule());
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
        !notification.bIsRead && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "mt-1 shrink-0",
          getColor(notification.strNotificationType)
        )}
      >
        {getIcon(notification.strNotificationType)}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              !notification.bIsRead && "font-semibold"
            )}
          >
            {notification.strTitle}
          </p>
          {!notification.bIsRead && (
            <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.strMessage}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.dtCreatedOn), {
              addSuffix: true,
            })}
          </span>
        </div>

        {notification.strTaskTitle && (
          <p className="text-xs text-muted-foreground">
            Task: {notification.strTaskTitle}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          {notification.strBoardName && (
            <p className="text-xs text-muted-foreground">
              Project: {notification.strBoardName}
            </p>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {shouldShowJumpIcon && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleJumpClick}
                title="Jump to task"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {notification.strTaskGUID && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleViewTask}
                title="View task details"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {!notification.bIsRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.strNotificationGUID);
                }}
                title="Mark as read"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSkeletonLoader() {
  return (
    <div className="divide-y divide-border-color">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-4 py-3 space-y-3">
          <Skeleton className="h-5 w-5 rounded mt-1 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 w-full">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-3 w-2/3 rounded" />
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-1/3 rounded" />
              <div className="flex items-center gap-1 ml-auto">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
