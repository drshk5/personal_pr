import * as z from "zod";

/**
 * Validation schema for creating a new BoardTeamGroup (Team/Sub-Team)
 */
export const createBoardTeamGroupSchema = z.object({
  strBoardGUID: z
    .string({
      required_error: "Board GUID is required",
    })
    .uuid("Invalid board GUID format"),
  strParentTeamGUID: z
    .string()
    .uuid("Invalid parent team GUID format")
    .nullable()
    .optional(),
  strTeamName: z
    .string({
      required_error: "Team name is required",
    })
    .min(1, "Team name is required")
    .max(200, "Team name must not exceed 200 characters")
    .trim(),
  strDescription: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
});

export const updateBoardTeamGroupSchema = z.object({
  strBoardGUID: z
    .string({
      required_error: "Board GUID is required",
    })
    .uuid("Invalid board GUID format"),
  strParentTeamGUID: z
    .string()
    .uuid("Invalid parent team GUID format")
    .nullable()
    .optional(),
  strTeamName: z
    .string({
      required_error: "Team name is required",
    })
    .min(1, "Team name is required")
    .max(200, "Team name must not exceed 200 characters")
    .trim(),
  strDescription: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
  bolIsActive: z.boolean().default(true),
});

export const boardTeamGroupParamsSchema = z.object({
  strBoardGUID: z.string().uuid("Invalid board GUID format").optional(),
  pageNumber: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().default("strTeamName"),
  ascending: z.boolean().default(true),
  search: z.string().optional(),
});

export type CreateBoardTeamGroupFormValues = z.infer<
  typeof createBoardTeamGroupSchema
>;
export type UpdateBoardTeamGroupFormValues = z.infer<
  typeof updateBoardTeamGroupSchema
>;
export type BoardTeamGroupParamsFormValues = z.infer<
  typeof boardTeamGroupParamsSchema
>;
