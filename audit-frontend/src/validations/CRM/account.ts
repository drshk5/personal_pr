import { z } from "zod";

// ── Account Create/Edit Form ────────────────────────────────

export const accountSchema = z.object({
  strAccountName: z
    .string()
    .min(1, { message: "Account name is required" })
    .max(200, { message: "Account name cannot exceed 200 characters" }),
  strIndustry: z
    .string()
    .max(100, { message: "Industry cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strWebsite: z
    .string()
    .max(500, { message: "Website cannot exceed 500 characters" })
    .nullable()
    .optional(),
  strPhone: z
    .string()
    .max(20, { message: "Phone cannot exceed 20 characters" })
    .nullable()
    .optional(),
  strEmail: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email cannot exceed 255 characters" })
    .or(z.literal(""))
    .nullable()
    .optional(),
  intEmployeeCount: z
    .number()
    .int({ message: "Employee count must be a whole number" })
    .min(0, { message: "Employee count cannot be negative" })
    .nullable()
    .optional(),
  dblAnnualRevenue: z
    .number()
    .min(0, { message: "Annual revenue cannot be negative" })
    .nullable()
    .optional(),
  strAddress: z
    .string()
    .max(500, { message: "Address cannot exceed 500 characters" })
    .nullable()
    .optional(),
  strCity: z
    .string()
    .max(100, { message: "City cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strState: z
    .string()
    .max(100, { message: "State cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strCountry: z
    .string()
    .max(100, { message: "Country cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strPostalCode: z
    .string()
    .max(20, { message: "Postal code cannot exceed 20 characters" })
    .nullable()
    .optional(),
  strDescription: z
    .string()
    .max(4000, { message: "Description cannot exceed 4000 characters" })
    .nullable()
    .optional(),
  strAssignedToGUID: z
    .string()
    .nullable()
    .optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
