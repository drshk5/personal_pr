import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/CRM/lead";

// ── Lead Create/Edit Form ────────────────────────────────────

export const leadSchema = z.object({
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
  strCompanyName: z
    .string()
    .max(200, { message: "Company name cannot exceed 200 characters" })
    .nullable()
    .optional(),
  strJobTitle: z
    .string()
    .max(150, { message: "Job title cannot exceed 150 characters" })
    .nullable()
    .optional(),
  strSource: z.enum(LEAD_SOURCES, {
    required_error: "Lead source is required",
  }),
  strStatus: z
    .enum(LEAD_STATUSES)
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
  bolSkipDuplicateCheck: z.boolean().optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

// ── Lead Conversion ──────────────────────────────────────────

export const convertLeadSchema = z.object({
  strLeadGUID: z.string().min(1, { message: "Lead is required" }),
  bolCreateAccount: z.boolean().default(true),
  bolCreateOpportunity: z.boolean().default(true),
  strExistingAccountGUID: z.string().nullable().optional(),
  strOpportunityName: z.string().max(200).nullable().optional(),
  strPipelineGUID: z.string().nullable().optional(),
  dblAmount: z.number().min(0).nullable().optional(),
});

export type ConvertLeadFormValues = z.infer<typeof convertLeadSchema>;

// ── Lead Merge ───────────────────────────────────────────────

export const leadMergeSchema = z.object({
  strPrimaryLeadGUID: z.string().min(1, { message: "Primary lead is required" }),
  strDuplicateLeadGUIDs: z
    .array(z.string())
    .min(1, { message: "At least one duplicate lead is required" }),
  fieldOverrides: z.record(z.string(), z.string()).optional(),
});

export type LeadMergeFormValues = z.infer<typeof leadMergeSchema>;

// ── Lead Import ──────────────────────────────────────────────

export const leadImportMappingSchema = z.object({
  strCsvColumn: z.string().min(1, { message: "CSV column is required" }),
  strLeadField: z.string().min(1, { message: "Lead field is required" }),
});

export const leadImportSchema = z.object({
  mappings: z
    .array(leadImportMappingSchema)
    .min(3, { message: "Map at least First Name, Last Name, and Email" }),
  skipDuplicates: z.boolean().default(false),
});

export type LeadImportFormValues = z.infer<typeof leadImportSchema>;

// ── Bulk Assignment ──────────────────────────────────────────

export const bulkAssignSchema = z.object({
  guids: z
    .array(z.string())
    .min(1, { message: "Select at least one lead" }),
  strAssignedToGUID: z
    .string()
    .min(1, { message: "Select a team member to assign" }),
});

export type BulkAssignFormValues = z.infer<typeof bulkAssignSchema>;

// ── Scoring Rule ─────────────────────────────────────────────

export const scoringRuleSchema = z.object({
  strRuleName: z
    .string()
    .min(1, { message: "Rule name is required" })
    .max(100, { message: "Rule name cannot exceed 100 characters" }),
  strConditionField: z
    .string()
    .min(1, { message: "Condition field is required" }),
  strConditionOperator: z
    .string()
    .min(1, { message: "Operator is required" }),
  strConditionValue: z
    .string()
    .min(1, { message: "Condition value is required" }),
  intPoints: z
    .number({ required_error: "Points are required" })
    .int()
    .min(-100, { message: "Points cannot be less than -100" })
    .max(100, { message: "Points cannot exceed 100" }),
  strCategory: z
    .string()
    .min(1, { message: "Category is required" }),
  bolIsActive: z.boolean().default(true),
  intDisplayOrder: z.number().int().min(0).default(0),
});

export type ScoringRuleFormValues = z.infer<typeof scoringRuleSchema>;
