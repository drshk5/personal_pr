import { z } from "zod";

/**
 * Validation schema for menu form
 */
export const menuSchema = z.object({
  strParentMenuGUID: z.string().nullable().optional(),
  dblSeqNo: z.coerce
    .number()
    .min(0, { message: "Sequence number is required" }),
  strName: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name cannot exceed 100 characters" }),
  strPath: z
    .string()
    .min(1, { message: "Path is required" })
    .max(255, { message: "Path cannot exceed 255 characters" }),
  strMenuPosition: z
    .string()
    .min(1, { message: "Menu position is required" })
    .max(50, { message: "Menu position cannot exceed 50 characters" }),
  strMapKey: z
    .string()
    .min(1, { message: "Map key is required" })
    .max(100, { message: "Map key cannot exceed 100 characters" }),
  bolHasSubMenu: z.boolean().default(false),
  strIconName: z
    .string()
    .max(50, { message: "Icon name cannot exceed 50 characters" })
    .nullable()
    .optional(),
  bolIsActive: z.boolean().default(true),
  bolSuperAdminAccess: z.boolean().default(false),
});

/**
 * Type definition for the form values
 */
export type MenuFormValues = z.infer<typeof menuSchema>;
