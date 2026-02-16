import * as z from "zod";

/**
 * Validation schema for creating a board section
 */
export const createBoardSectionSchema = z.object({
  strBoardGUID: z
    .string()
    .uuid("Invalid Project GUID")
    .min(1, "Project GUID is required"),
  strName: z
    .string()
    .trim()
    .min(1, "Module name is required")
    .max(1000, "Module names are too long")
    .refine((value) => {
      const names = value
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      return names.length > 0 && names.every((name) => name.length <= 100);
    }, "Each module name must be 100 characters or less"),
  strColor: z
    .string()
    .length(7, "Color must be in hex format (#RRGGBB)")
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color")
    .nullable()
    .optional(),
  intPosition: z
    .number()
    .int("Position must be an integer")
    .min(0, "Position must be non-negative")
    .default(0),
});

/**
 * Validation schema for updating a board section
 */
export const updateBoardSectionSchema = z.object({
  strName: z
    .string()
    .trim()
    .min(1, "Module name is required")
    .max(100, "Module name cannot exceed 100 characters"),
  strColor: z
    .string()
    .length(7, "Color must be in hex format (#RRGGBB)")
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color")
    .nullable()
    .optional(),
  intPosition: z
    .number()
    .int("Position must be an integer")
    .min(0, "Position must be non-negative"),
});

/**
 * Validation schema for bulk creating board sections
 */
export const bulkCreateBoardSectionSchema = z.object({
  strBoardGUID: z
    .string()
    .uuid("Invalid Project GUID")
    .min(1, "Project GUID is required"),
  strSectionNames: z
    .string()
    .trim()
    .min(1, "At least one module name is required")
    .max(1000, "Module names are too long"),
});

/**
 * Validation schema for reordering board sections
 */
export const reorderBoardSectionsSchema = z.object({
  strBoardGUID: z
    .string()
    .uuid("Invalid project GUID")
    .min(1, "Project GUID is required"),
  orderedSectionGUIDs: z
    .array(z.string().uuid("Invalid module GUID"))
    .min(1, "At least one module GUID is required"),
});

export type CreateBoardSectionFormValues = z.infer<typeof createBoardSectionSchema>;
export type UpdateBoardSectionFormValues = z.infer<typeof updateBoardSectionSchema>;
export type ReorderBoardSectionsFormValues = z.infer<typeof reorderBoardSectionsSchema>;
export type BulkCreateBoardSectionFormValues = z.infer<
  typeof bulkCreateBoardSectionSchema
>;
