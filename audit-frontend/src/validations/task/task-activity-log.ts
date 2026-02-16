import * as z from "zod";

export const getActivityLogsRequestSchema = z.object({
  strTaskGUID: z.string().min(1, "Task ID is required"),
});

export type GetActivityLogsRequestFormData = z.infer<typeof getActivityLogsRequestSchema>;
