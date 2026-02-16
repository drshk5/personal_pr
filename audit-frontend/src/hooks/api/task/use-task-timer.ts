import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import { taskTimerService } from "@/services/task/task-timer.service";
import type {
  StartTimerRequest,
  PauseTimerRequest,
  TimerActionRequest,
} from "@/services/task/task-timer.service";
import type {
  TaskTimerFilterParams,
  TaskTimelineFilterDto,
  TaskTimelineByUserParams,
  TaskActivityResponse,
} from "@/types/task/task-timer";

export const taskTimerQueryKeys = createQueryKeys("task-timer");

export const useGetTaskTimersWithFilter = (params: TaskTimerFilterParams) => {
  return useQuery({
    queryKey: taskTimerQueryKeys.list({ type: "filter", ...params }),
    queryFn: () => taskTimerService.getTaskTimersWithFilter(params),
  });
};

export const useStartTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: StartTimerRequest) => taskTimerService.start(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKeys.all });
      toast.success("Task started");
    },
    onError: (error) => handleMutationError(error, "Failed to start task"),
  });
};

export const useResumeTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: StartTimerRequest) => taskTimerService.resume(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: taskTimerQueryKeys.all });
      toast.success("Task resumed");
    },
    onError: (error) => handleMutationError(error, "Failed to resume task"),
  });
};

export const useOnHoldTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: PauseTimerRequest) => taskTimerService.onHold(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: taskTimerQueryKeys.list({ type: "active-session" }),
      });
      toast.success("Task put on hold");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to put task on hold"),
  });
};

export const useIncompleteTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: TimerActionRequest) => taskTimerService.incomplete(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: taskTimerQueryKeys.list({ type: "active-session" }),
      });
      toast.success("Task marked as Incomplete");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to mark task incomplete"),
  });
};

export const useForReviewTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: TimerActionRequest) => taskTimerService.forReview(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: taskTimerQueryKeys.list({ type: "active-session" }),
      });
      toast.success("Task submitted for review");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to submit for review"),
  });
};

export const useCompleteTaskTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: TimerActionRequest) => taskTimerService.complete(req),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: taskTimerQueryKeys.list({ type: "active-session" }),
      });
      toast.success("Task completed");
    },
    onError: (error) => handleMutationError(error, "Failed to complete task"),
  });
};

export const useGetActiveSession = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: taskTimerQueryKeys.list({ type: "active-session" }),
    queryFn: () => taskTimerService.getActiveSession(),
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: options?.enabled ?? true,
  });
};

export const useGetTaskTimeline = (params: TaskTimelineFilterDto) => {
  return useQuery({
    queryKey: taskTimerQueryKeys.list({ type: "timeline", ...params }),
    queryFn: () => taskTimerService.getTimeline(params),
  });
};

export const useGetTaskTimelineByUser = (params: TaskTimelineByUserParams) => {
  return useQuery({
    queryKey: taskTimerQueryKeys.list({ type: "timeline-by-user", ...params }),
    queryFn: () => taskTimerService.getTimelineByUser(params),
    enabled: !!params.strUserGUID || !!params.strBoardGUID, // Fetch when user GUID is provided or board GUID is provided (for all users)
  });
};

export const useGetTaskActivity = (
  taskGuid?: string,
  enabled: boolean = true
) => {
  return useQuery<TaskActivityResponse>({
    queryKey: taskTimerQueryKeys.list({ type: "activity", taskGuid }),
    queryFn: () => taskTimerService.getTaskActivity(taskGuid!),
    enabled: !!taskGuid && enabled,
  });
};

export const useExportTimelineToCsv = () => {
  return useMutation({
    mutationFn: (
      params: Omit<
        TaskTimelineByUserParams,
        "pageNumber" | "pageSize" | "sortBy" | "ascending"
      >
    ) => taskTimerService.exportTimelineToCsv(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const userPart =
        !variables.strUserGUID || variables.strUserGUID === "all"
          ? "AllUsers"
          : "User";
      const dateRange =
        variables.dtFromDate && variables.dtToDate
          ? `${variables.dtFromDate}-${variables.dtToDate}`
          : new Date().toISOString().split("T")[0];
      link.download = `TaskTimeline_${userPart}_${dateRange}.csv`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Timeline exported successfully as CSV");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export timeline as CSV"),
  });
};

export const useExportTimelineToPdf = () => {
  return useMutation({
    mutationFn: (
      params: Omit<
        TaskTimelineByUserParams,
        "pageNumber" | "pageSize" | "sortBy" | "ascending"
      >
    ) => taskTimerService.exportTimelineToPdf(params),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const userPart =
        !variables.strUserGUID || variables.strUserGUID === "all"
          ? "AllUsers"
          : "User";
      const dateRange =
        variables.dtFromDate && variables.dtToDate
          ? `${variables.dtFromDate}-${variables.dtToDate}`
          : new Date().toISOString().split("T")[0];
      link.download = `TaskTimeline_${userPart}_${dateRange}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Timeline exported successfully as PDF");
    },
    onError: (error) =>
      handleMutationError(error, "Failed to export timeline as PDF"),
  });
};

export const usePreviewTimelineToPdf = () => {
  return useMutation({
    mutationFn: (
      params: Omit<
        TaskTimelineByUserParams,
        "pageNumber" | "pageSize" | "sortBy" | "ascending"
      >
    ) => taskTimerService.exportTimelineToPdf(params),
    onError: (error) =>
      handleMutationError(error, "Failed to preview timeline PDF"),
  });
};
