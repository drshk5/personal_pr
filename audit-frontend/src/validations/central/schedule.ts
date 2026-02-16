import { z } from "zod";

// Schedule schema for form validation
export const scheduleSchema = z.object({
  code: z.number().int().nonnegative().optional(),
  strScheduleCode: z
    .string()
    .min(1, { message: "Schedule code is required" })
    .max(50, { message: "Schedule code cannot exceed 50 characters" }),
  strRefNo: z
    .string()
    .max(100, { message: "Reference number cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strScheduleName: z
    .string()
    .min(1, { message: "Schedule name is required" })
    .max(100, { message: "Schedule name cannot exceed 100 characters" }),
  strTemplateName: z
    .string()
    .max(100, { message: "Template name cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strUnderCode: z
    .string()
    .max(50, { message: "Under code cannot exceed 50 characters" })
    .nullable()
    .optional(),
  strParentScheduleGUID: z
    .string()
    .uuid({ message: "Invalid parent schedule ID" })
    .nullable()
    .optional(),
  dblChartType: z.number().nullable().optional(),
  strDefaultAccountTypeGUID: z
    .string()
    .uuid({ message: "Invalid account type ID" })
    .nullable()
    .optional(),
  bolIsActive: z.boolean().default(true),
  bolIsEditable: z.boolean().default(true),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
