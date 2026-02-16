import { z } from "zod";

export const moduleSchema = z.object({
  strName: z
    .string()
    .min(1, "Module name is required")
    .max(450, "Module name cannot exceed 450 characters"),
  strDesc: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .default(""),
  strSQlfilePath: z
    .string()
    .min(1, "SQL file path is required")
    .max(450, "SQL file path cannot exceed 450 characters"),
  strImagePath: z.string().default(""),
  bolIsActive: z.boolean().default(true),
  // We don't validate ImageFile in the schema as it's handled separately
  // It will be attached to the form data before submission
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;
