import { z } from "zod";

/**
 * Validation schema for user role form
 */
export const userRoleSchema = z.object({
  strName: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name cannot exceed 100 characters" }),
  strDesc: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .nullable(),
  bolIsActive: z.boolean().default(true),
});

/**
 * Type definition for the form values
 */
export type UserRoleFormValues = z.infer<typeof userRoleSchema>;
