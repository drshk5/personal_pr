import { z } from "zod";

/**
 * Validation schema for master menu form
 * Strictly aligned with backend MasterMenuCreateDto
 * @see MasterMenuCreateDto in backend
 */
export const masterMenuSchema = z.object({
  // Parent menu GUID can be undefined (null), "none" (root), or a valid GUID
  strParentMenuGUID: z.string().optional(),

  // Module GUID can be undefined or a valid GUID
  strModuleGUID: z.string().optional(),

  // Sequence number is required and must be non-negative
  dblSeqNo: z.preprocess(
    // First preprocess to handle empty strings and convert to number
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return Number(val);
    },
    // Then validate the number
    z
      .number({
        required_error: "Sequence number is required",
        invalid_type_error: "Sequence number must be a valid number",
      })
      .nonnegative({ message: "Sequence number must be non-negative" })
      .refine((val) => val !== undefined, {
        message: "Sequence number is required",
      })
  ),

  // Name is required, maximum 100 characters
  strName: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name cannot exceed 100 characters" }),

  // Path is required, maximum 255 characters
  strPath: z
    .string()
    .min(1, { message: "Path is required" })
    .max(255, { message: "Path cannot exceed 255 characters" }),

  // Menu position is required, maximum 50 characters
  strMenuPosition: z
    .string()
    .min(1, { message: "Menu position is required" })
    .max(50, { message: "Menu position cannot exceed 50 characters" }),

  // Map key is required, maximum 100 characters
  strMapKey: z
    .string()
    .min(1, { message: "Map key is required" })
    .max(100, { message: "Map key cannot exceed 100 characters" }),

  // Has submenu is boolean, defaults to false
  bolHasSubMenu: z.boolean().default(false),

  // Icon name is optional, maximum 50 characters
  strIconName: z
    .string()
    .max(50, { message: "Icon name cannot exceed 50 characters" })
    .optional(),

  // Is active is boolean, defaults to true
  bolIsActive: z.boolean().default(true),

  // Super admin access is boolean, defaults to false
  bolSuperAdminAccess: z.boolean().default(false),

  // Category is optional, maximum 50 characters
  strCategory: z
    .string()
    .max(50, { message: "Category cannot exceed 50 characters" })
    .optional(),

  // Page template GUID is optional
  strPageTemplateGUID: z.string().optional(),

  // Is single menu is boolean, defaults to false
  bolIsSingleMenu: z.boolean().default(false),
});

/**
 * Type definition for the form values
 */
export type MasterMenuFormValues = z.infer<typeof masterMenuSchema>;
