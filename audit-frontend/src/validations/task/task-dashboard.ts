import * as z from "zod";

/**
 * Available task statuses for dashboard filtering
 */
const taskStatusEnum = z.enum([
  "Open",
  "In Progress", 
  "Completed",
  "Closed",
  "Cancelled"
]);

/**
 * Validation schema for dashboard status user parameters
 */
export const dashboardStatusParamsSchema = z.object({
  status: taskStatusEnum
    .refine((val) => val.trim().length > 0, {
      message: "Status is required and cannot be empty"
    })
});

/**
 * Validation schema for dashboard status user response data
 */
export const dashboardStatusUserResponseSchema = z.object({
  statusCode: z.number().int().min(100).max(599),
  message: z.string(),
  data: z.object({
    total: z.number().int().min(0)
  })
});

/**
 * Validation schema for multiple status parameters
 */
export const dashboardMultipleStatusSchema = z.object({
  statuses: z.array(taskStatusEnum).min(1, "At least one status is required")
});

/**
 * Validation schema for user status parameters
 */
export const userStatusParamsSchema = z.object({
  strBoardGUID: z.string().uuid("Invalid project GUID format"),
  strUserGUID: z.string().uuid("Invalid user GUID format"),
  strUserStatus: z.enum(["Active", "Idle"]).optional(),
  strPriority: z.string().optional(),
  strDepartmentGUID: z.string().uuid("Invalid department GUID format").optional(),
  strDesignationGUID: z.string().uuid("Invalid designation GUID format").optional()
});

/**
 * Validation schema for board status parameters
 */
export const boardStatusParamsSchema = z.object({
  strBoardGUID: z.string().uuid("Invalid project GUID format")
});

/**
 * Type exports for TypeScript
 */
export type DashboardStatusParams = z.infer<typeof dashboardStatusParamsSchema>;
export type DashboardStatusUserResponse = z.infer<typeof dashboardStatusUserResponseSchema>;
export type DashboardMultipleStatusParams = z.infer<typeof dashboardMultipleStatusSchema>;
export type UserStatusParamsValidation = z.infer<typeof userStatusParamsSchema>;
export type BoardStatusParamsValidation = z.infer<typeof boardStatusParamsSchema>;

/**
 * Validation functions for runtime validation
 */
export const validateDashboardStatusParams = (data: unknown): DashboardStatusParams => {
  return dashboardStatusParamsSchema.parse(data);
};

export const validateDashboardStatusUserResponse = (data: unknown): DashboardStatusUserResponse => {
  return dashboardStatusUserResponseSchema.parse(data);
};

export const validateDashboardMultipleStatus = (data: unknown): DashboardMultipleStatusParams => {
  return dashboardMultipleStatusSchema.parse(data);
};

export const validateUserStatusParams = (data: unknown): UserStatusParamsValidation => {
  return userStatusParamsSchema.parse(data);
};

export const validateBoardStatusParams = (data: unknown): BoardStatusParamsValidation => {
  return boardStatusParamsSchema.parse(data);
};