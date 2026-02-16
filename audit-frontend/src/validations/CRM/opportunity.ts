import { z } from "zod";
import { OPPORTUNITY_STATUSES, OPPORTUNITY_CURRENCIES } from "@/types/CRM/opportunity";

// ── Opportunity Create/Edit Form ────────────────────────────

export const opportunitySchema = z.object({
  strOpportunityName: z
    .string()
    .min(1, { message: "Opportunity name is required" })
    .max(200, { message: "Opportunity name cannot exceed 200 characters" }),
  strAccountGUID: z
    .string()
    .nullable()
    .optional(),
  strPipelineGUID: z
    .string()
    .min(1, { message: "Pipeline is required" }),
  strStageGUID: z
    .string()
    .min(1, { message: "Stage is required" }),
  dblAmount: z
    .number()
    .min(0, { message: "Amount cannot be negative" })
    .nullable()
    .optional(),
  strCurrency: z.enum(OPPORTUNITY_CURRENCIES).default("INR"),
  dtExpectedCloseDate: z
    .string()
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

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

// ── Close Opportunity ────────────────────────────────────────

export const closeOpportunitySchema = z.object({
  strStatus: z.enum(["Won", "Lost"], {
    required_error: "Outcome is required",
  }),
  strLossReason: z
    .string()
    .max(500, { message: "Loss reason cannot exceed 500 characters" })
    .nullable()
    .optional(),
  dtActualCloseDate: z
    .string()
    .nullable()
    .optional(),
}).refine(
  (data) => {
    if (data.strStatus === "Lost" && (!data.strLossReason || data.strLossReason.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Loss reason is required when closing as Lost",
    path: ["strLossReason"],
  }
);

export type CloseOpportunityFormValues = z.infer<typeof closeOpportunitySchema>;
