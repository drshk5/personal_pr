import { z } from "zod";

export const documentModuleSchema = z.object({
  strModuleGUID: z.string().min(1, "Module is required"),
  strModuleName: z
    .string()
    .min(1, "Module name is required")
    .max(255, "Module name cannot exceed 255 characters"),
  bolIsActive: z.boolean(),
});

export type DocumentModuleFormValues = z.infer<typeof documentModuleSchema>;