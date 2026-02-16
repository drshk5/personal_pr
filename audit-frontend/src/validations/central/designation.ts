import { z } from "zod";

export const designationSchema = z.object({
  strName: z
    .string()
    .min(1, { message: "Designation name is required" })
    .max(450, { message: "Designation name cannot exceed 450 characters" }),
  bolIsActive: z.boolean().default(true),
});

export type DesignationFormValues = z.infer<typeof designationSchema>;
