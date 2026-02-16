import { z } from "zod";

// General Account schema for form validation
export const generalAccountSchema = z.object({
  strGeneralAccountName: z
    .string()
    .min(1, { message: "General Account name is required" })
    .max(100, { message: "General Account name cannot exceed 100 characters" }),
  strAccountTypeGUID: z
    .string()
    .min(1, { message: "Account type is required" }),
  strScheduleGUID: z.string().min(1, { message: "Schedule is required" }),
  strUDFCode: z
    .string()
    .min(1, { message: "Account code is required" })
    .regex(/^[A-Za-z0-9]{6}$/, {
      message: "Account code must be exactly 6 alphanumeric characters",
    }),
  strDesc: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .nullable()
    .optional(),
  bolIsActive: z.boolean().default(true),
});

export type GeneralAccountFormValues = z.infer<typeof generalAccountSchema>;
