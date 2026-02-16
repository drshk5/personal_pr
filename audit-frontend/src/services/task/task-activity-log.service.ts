import { ApiService } from "@/lib/api/api-service";
import { TASK_API_PREFIX } from "@/constants/api-prefix";
import type { TaskActivityLog } from "@/types/task/task-activity-log";

export const taskActivityLogService = {
  getActivityLogsByTask: async (
    taskGuid: string
  ): Promise<TaskActivityLog[]> => {
    return await ApiService.getArray<TaskActivityLog>(
      `${TASK_API_PREFIX}/TaskActivityLog/task/${taskGuid}`
    );
  },
};
