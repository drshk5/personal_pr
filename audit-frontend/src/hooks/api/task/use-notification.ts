import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import type { NotificationCreate, NotificationParams } from "@/types";
import { notificationService } from "@/services";

export const notificationQueryKeys = createQueryKeys("notifications");

export const useNotifications = (
  params?: NotificationParams,
  enabled = true
) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(params || {}),
    queryFn: () => notificationService.getNotifications(params),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useNotification = (guid?: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.detail(guid || ""),
    queryFn: () => notificationService.getNotification(guid!),
    enabled: !!guid,
  });
};

export const useUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: notificationQueryKeys.list({ type: "unread-count" }),
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NotificationCreate) =>
      notificationService.createNotification(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      toast.success("Notification created successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to create notification"),
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guid }: { guid: string }) =>
      notificationService.markAsRead(guid),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(variables.guid),
      });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list({ type: "unread-count" }),
      });
      toast.success("Notification marked as read");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to mark notification as read"),
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.list({ type: "unread-count" }),
      });
      toast.success("All notifications marked as read");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to mark all notifications as read"),
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guid }: { guid: string }) =>
      notificationService.deleteNotification(guid),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      toast.success("Notification deleted successfully");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to delete notification"),
  });
};
