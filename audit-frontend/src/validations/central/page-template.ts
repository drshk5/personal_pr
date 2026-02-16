import { z } from "zod";

// Page template schema for form validation
export const pageTemplateSchema = z.object({
  strPageTemplateName: z
    .string()
    .min(1, { message: "Template name is required" })
    .max(100, { message: "Template name cannot exceed 100 characters" }),
  bolIsSave: z.boolean().default(false),
  bolIsView: z.boolean().default(false),
  bolIsEdit: z.boolean().default(false),
  bolIsDelete: z.boolean().default(false),
  bolIsPrint: z.boolean().default(false),
  bolIsExport: z.boolean().default(false),
  bolIsImport: z.boolean().default(false),
  bolIsApprove: z.boolean().default(false),
});

export type PageTemplateFormValues = z.infer<typeof pageTemplateSchema>;
