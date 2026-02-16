import { z } from "zod";

// Picklist type schema for form validation
export const picklistTypeSchema = z.object({
  strType: z
    .string()
    .min(1, { message: "Type name is required" })
    .max(100, { message: "Type name cannot exceed 100 characters" }),
  strDescription: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .nullable()
    .optional(),
  bolIsActive: z.boolean().default(true),
});

export type PicklistTypeFormValues = z.infer<typeof picklistTypeSchema>;
