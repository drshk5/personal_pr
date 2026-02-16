import * as z from "zod";

/**
 * Validation schema for adding users to a board team
 */
export const createBoardTeamSchema = z.object({
  strUserGUIDs: z
    .array(z.string().uuid("Invalid user GUID"))
    .min(1, "At least one user must be selected")
    .max(50, "Cannot add more than 50 users at once"),
  strReportingToGUID: z
    .string({
      required_error: "Reporting manager is required",
    })
    .uuid("Reporting to is required"),
});

/**
 * Validation schema for board team query parameters
 */
export const boardTeamParamsSchema = z.object({
  pageNumber: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default("dtCreatedOn"),
  ascending: z.boolean().default(false),
  search: z.string().optional(),
  strReportingToGUID: z.string().uuid("Reporting to is required").nullable().optional(),
});

/**
 * Validation schema for user hierarchy parameters
 */
export const userHierarchyParamsSchema = z.object({
  userGuid: z.string().uuid("Invalid user GUID format"),
  strBoardGUID: z.string().uuid("Invalid board GUID format"),
});

export type CreateBoardTeamFormValues = z.infer<typeof createBoardTeamSchema>;
export type BoardTeamParamsFormValues = z.infer<typeof boardTeamParamsSchema>;
export type UserHierarchyParamsFormValues = z.infer<typeof userHierarchyParamsSchema>;
