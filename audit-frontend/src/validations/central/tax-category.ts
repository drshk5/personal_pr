import { z } from "zod";

export const taxCategoryCreateSchema = z.object({
  strTaxTypeGUID: z
    .string()
    .min(1, { message: "Tax Type GUID is required" }),

  strCategoryCode: z
    .string()
    .min(1, { message: "Category code is required" })
    .max(50, { message: "Category code cannot exceed 50 characters" }),

  strCategoryName: z
    .string()
    .min(1, { message: "Category name is required" })
    .max(100, { message: "Category name cannot exceed 100 characters" }),

  strDescription: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .or(z.literal("")),

  decTotalTaxPercentage: z
    .number()
    .min(0, { message: "Total tax percentage must be between 0 and 100" })
    .max(100, { message: "Total tax percentage must be between 0 and 100" }),

  bolIsActive: z.boolean().default(true),
});

export const taxCategoryUpdateSchema = z.object({
  strTaxTypeGUID: z
    .string()
    .min(1, { message: "Tax Type GUID is required" }),

  strCategoryCode: z
    .string()
    .min(1, { message: "Category code is required" })
    .max(50, { message: "Category code cannot exceed 50 characters" }),

  strCategoryName: z
    .string()
    .min(1, { message: "Category name is required" })
    .max(100, { message: "Category name cannot exceed 100 characters" }),

  strDescription: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .or(z.literal("")),

  decTotalTaxPercentage: z
    .number()
    .min(0, { message: "Total tax percentage must be between 0 and 100" })
    .max(100, { message: "Total tax percentage must be between 0 and 100" }),

  bolIsActive: z.boolean(),
});

export type TaxCategoryCreateValues = z.infer<typeof taxCategoryCreateSchema>;
export type TaxCategoryUpdateValues = z.infer<typeof taxCategoryUpdateSchema>;
