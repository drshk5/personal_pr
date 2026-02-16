import { useQuery } from "@tanstack/react-query";

import { createQueryKeys } from "@/hooks/api/common";
import { taskActivityLogService } from "@/services/task/task-activity-log.service";
import type { TaskActivityLog } from "@/types/task/task-activity-log";

export const taskActivityLogQueryKeys = createQueryKeys("taskActivityLogs");

export const useTaskActivityLogs = (taskGuid?: string) => {
  return useQuery<TaskActivityLog[]>({
    queryKey: [...taskActivityLogQueryKeys.all, "by-task", taskGuid || ""],
    queryFn: async () => {
      return await taskActivityLogService.getActivityLogsByTask(taskGuid!);
    },
    enabled: !!taskGuid,
  });
};
