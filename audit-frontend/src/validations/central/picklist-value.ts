import { z } from "zod";

// Picklist value schema for form validation
export const picklistValueSchema = z.object({
  strValue: z
    .string()
    .min(1, { message: "Value is required" })
    .max(100, { message: "Value cannot exceed 100 characters" }),
  strPicklistTypeGUID: z
    .string()
    .min(1, { message: "Picklist type is required" }),
  bolIsActive: z.boolean().default(true),
});

export type PicklistValueFormValues = z.infer<typeof picklistValueSchema>;
