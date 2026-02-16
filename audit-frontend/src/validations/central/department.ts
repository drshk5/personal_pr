import { z } from "zod";

export const departmentSchema = z.object({
  strDepartmentName: z
    .string()
    .min(1, { message: "Department name is required" })
    .max(450, { message: "Department name cannot exceed 450 characters" }),
  bolsActive: z.boolean().default(true),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
