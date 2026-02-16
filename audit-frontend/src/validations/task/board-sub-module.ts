import * as z from "zod";

export const createBoardSubModuleSchema = z.object({
  strBoardGUID: z
    .string()
    .uuid("Select Project")
    .min(1, "Project GUID is required"),
  strBoardSectionGUID: z
    .string()
    .uuid("Select Module")
    .min(1, "Module GUID is required"),
  strName: z
    .string()
    .trim()
    .min(1, "Sub module name is required")
    .max(1000, "Sub module names are too long")
    .refine((value) => {
      const names = value
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      return names.length > 0 && names.every((name) => name.length <= 100);
    }, "Each sub module name must be 100 characters or less"),
  bolIsActive: z.boolean(),
});

/**
 * Validation schema for updating a board sub-module
 */
export const updateBoardSubModuleSchema = z.object({
  strName: z
    .string()
    .trim()
    .min(1, "Sub module name is required")
    .max(100, "Sub module name cannot exceed 100 characters"),
  bolIsActive: z.boolean(),
});

export const bulkCreateBoardSubModuleSchema = z.object({
  strBoardGUID: z
    .string()
    .uuid("Select Project")
    .min(1, "Project GUID is required"),
  strBoardSectionGUID: z
    .string()
    .uuid("Select Module")
    .min(1, "Module GUID is required"),
  strSubModuleNames: z
    .string()
    .trim()
    .min(1, "At least one sub module name is required")
    .max(1000, "Sub module names are too long"),
});

export type CreateBoardSubModuleFormValues = z.infer<typeof createBoardSubModuleSchema>;
export type UpdateBoardSubModuleFormValues = z.infer<typeof updateBoardSubModuleSchema>;
export type BulkCreateBoardSubModuleFormValues = z.infer<
  typeof bulkCreateBoardSubModuleSchema
>;
