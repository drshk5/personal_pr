import * as z from "zod";

/**
 * Validation schema for creating a board
 */
export const createBoardSchema = z.object({
  strName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name cannot exceed 100 characters"),
  strDescription: z.string().trim(),
  // Removed strColor and strIcon
  bolIsActive: z.boolean(),
});

/**
 * Validation schema for updating a board
 */
export const updateBoardSchema = z.object({
  strName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name cannot exceed 100 characters"),
  strDescription: z.string().trim(),
  // Removed strColor and strIcon
  bolIsActive: z.boolean(),
});

export type CreateBoardFormValues = z.infer<typeof createBoardSchema>;
export type UpdateBoardFormValues = z.infer<typeof updateBoardSchema>;