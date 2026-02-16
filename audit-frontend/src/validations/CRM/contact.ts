import { z } from "zod";
import { CONTACT_LIFECYCLE_STAGES } from "@/types/CRM/contact";

// ── Contact Create/Edit Form ────────────────────────────────

export const contactSchema = z.object({
  strAccountGUID: z
    .string()
    .nullable()
    .optional(),
  strFirstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(100, { message: "First name cannot exceed 100 characters" }),
  strLastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Last name cannot exceed 100 characters" }),
  strEmail: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email cannot exceed 255 characters" }),
  strPhone: z
    .string()
    .max(20, { message: "Phone cannot exceed 20 characters" })
    .nullable()
    .optional(),
  strMobilePhone: z
    .string()
    .max(20, { message: "Mobile phone cannot exceed 20 characters" })
    .nullable()
    .optional(),
  strJobTitle: z
    .string()
    .max(150, { message: "Job title cannot exceed 150 characters" })
    .nullable()
    .optional(),
  strDepartment: z
    .string()
    .max(100, { message: "Department cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strLifecycleStage: z
    .enum(CONTACT_LIFECYCLE_STAGES)
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
  strNotes: z
    .string()
    .nullable()
    .optional(),
  strAssignedToGUID: z
    .string()
    .nullable()
    .optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
