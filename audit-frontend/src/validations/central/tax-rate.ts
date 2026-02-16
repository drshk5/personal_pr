import { z } from "zod";

export const taxRateCreateSchema = z
  .object({
    strTaxTypeGUID: z.string().min(1, { message: "Tax type is required" }),
    strTaxCategoryGUID: z.string().min(1, { message: "Tax category is required" }),
    strScheduleGUID: z.string().min(1, { message: "Schedule is required" }),
    strTaxRateName: z
      .string()
      .min(1, { message: "Tax rate name is required" })
      .max(100, { message: "Tax rate name cannot exceed 100 characters" }),
    decTaxPercentage: z
      .number()
      .min(0, { message: "Tax percentage must be between 0 and 100" })
      .max(100, { message: "Tax percentage must be between 0 and 100" }),
    strTaxRateCode: z
      .string()
      .min(1, { message: "Tax rate code is required" })
      .max(50, { message: "Tax rate code cannot exceed 50 characters" }),
    strStateGUID: z.string().optional(),
    intDisplayOrder: z.number().int().min(0).default(0),
    dtEffectiveFrom: z.string().optional(),
    dtEffectiveTo: z.string().optional(),
    bolIsActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.dtEffectiveFrom && data.dtEffectiveTo) {
        return new Date(data.dtEffectiveFrom) <= new Date(data.dtEffectiveTo);
      }
      return true;
    },
    {
      message: "Effective from date must be before or equal to effective to date",
      path: ["dtEffectiveTo"],
    }
  );

export const taxRateUpdateSchema = z
  .object({
    strTaxTypeGUID: z.string().min(1, { message: "Tax type is required" }),
    strTaxCategoryGUID: z.string().min(1, { message: "Tax category is required" }),
    strScheduleGUID: z.string().min(1, { message: "Schedule is required" }),
    strTaxRateName: z
      .string()
      .min(1, { message: "Tax rate name is required" })
      .max(100, { message: "Tax rate name cannot exceed 100 characters" }),
    decTaxPercentage: z
      .number()
      .min(0, { message: "Tax percentage must be between 0 and 100" })
      .max(100, { message: "Tax percentage must be between 0 and 100" }),
    strTaxRateCode: z
      .string()
      .min(1, { message: "Tax rate code is required" })
      .max(50, { message: "Tax rate code cannot exceed 50 characters" }),
    strStateGUID: z.string().optional(),
    intDisplayOrder: z.number().int().min(0),
    dtEffectiveFrom: z.string().optional(),
    dtEffectiveTo: z.string().optional(),
    bolIsActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.dtEffectiveFrom && data.dtEffectiveTo) {
        return new Date(data.dtEffectiveFrom) <= new Date(data.dtEffectiveTo);
      }
      return true;
    },
    {
      message: "Effective from date must be before or equal to effective to date",
      path: ["dtEffectiveTo"],
    }
  );

export type TaxRateCreateValues = z.infer<typeof taxRateCreateSchema>;
export type TaxRateUpdateValues = z.infer<typeof taxRateUpdateSchema>;
