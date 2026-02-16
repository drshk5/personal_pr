import { z } from "zod";

export const helpCategorySchema = z.object({
  strCategoryName: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name cannot exceed 100 characters"),
  strDescription: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  strIcon: z
    .string()
    .max(50, "Icon name cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  strModuleGUID: z.string().optional().or(z.literal("")),
  intOrder: z.number().int().min(0, "Order must be a positive number"),
  bolIsActive: z.boolean(),
});

export const helpArticleSchema = z.object({
  strCategoryGUID: z.string().min(1, "Category is required"),
  strModuleGUID: z.string().optional().or(z.literal("")),
  strTitle: z
    .string()
    .min(1, "Article title is required")
    .max(200, "Title cannot exceed 200 characters"),
  strContent: z.string().min(1, "Article content is required"),
  strVideoUrl: z
    .string()
    .max(500, "Video URL cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  intOrder: z.number().int().min(0, "Order must be a positive number"),
  bolIsActive: z.boolean(),
  bolIsFeatured: z.boolean(),
});

export type HelpCategoryFormData = z.infer<typeof helpCategorySchema>;
export type HelpArticleFormData = z.infer<typeof helpArticleSchema>;
