import { z } from "zod";

// Unit schema for form validation
export const unitSchema = z.object({
  strUnitName: z
    .string()
    .min(1, { message: "Unit name is required" })
    .max(100, { message: "Unit name cannot exceed 100 characters" }),
  bolIsActive: z.boolean().default(true),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
