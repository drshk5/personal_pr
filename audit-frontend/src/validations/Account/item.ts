import { z } from "zod";

export const itemSchema = z
  .object({
    strType: z
      .string()
      .min(1, { message: "Item type is required" })
      .max(50, { message: "Item type cannot exceed 50 characters" }),
    strName: z
      .string()
      .min(1, { message: "Item name is required" })
      .max(200, { message: "Item name cannot exceed 200 characters" }),
    strUnitGUID: z.string().min(1, { message: "Unit is required" }),
    bolIsSellable: z.boolean().default(false),
    dblSellingPrice: z
      .number()
      .nullable()
      .optional()
      .refine(
        (val) => val === null || val === undefined || val >= 0,
        "Selling price must be a positive number"
      ),
    strSalesAccountGUID: z.string().nullable().optional(),
    strSalesDescription: z
      .string()
      .max(500, { message: "Sales description cannot exceed 500 characters" })
      .nullable()
      .optional(),
    bolIsPurchasable: z.boolean().default(false),
    dblCostPrice: z
      .number()
      .nullable()
      .optional()
      .refine(
        (val) => val === null || val === undefined || val >= 0,
        "Cost price must be a positive number"
      ),
    strPurchaseAccountGUID: z.string().nullable().optional(),
    strPurchaseDescription: z
      .string()
      .max(500, {
        message: "Purchase description cannot exceed 500 characters",
      })
      .nullable()
      .optional(),
    strPreferredVendorGUID: z.string().nullable().optional(),
    strTaxCategoryGUID: z.string().nullable().optional(),
    strHSNCode: z
      .string()
      .max(50, { message: "HSN Code cannot exceed 50 characters" })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.bolIsSellable) {
        return (
          data.dblSellingPrice !== null &&
          data.dblSellingPrice !== undefined &&
          !isNaN(data.dblSellingPrice) &&
          data.dblSellingPrice > 0
        );
      }
      return true;
    },
    {
      message: "Selling price is required when sellable",
      path: ["dblSellingPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.bolIsSellable) {
        return (
          data.strSalesAccountGUID !== null &&
          data.strSalesAccountGUID !== undefined &&
          data.strSalesAccountGUID.length > 0
        );
      }
      return true;
    },
    {
      message: "Sales account is required when sellable",
      path: ["strSalesAccountGUID"],
    }
  )
  .refine(
    (data) => {
      // If item is purchasable, cost price is required
      if (data.bolIsPurchasable) {
        return (
          data.dblCostPrice !== null &&
          data.dblCostPrice !== undefined &&
          !isNaN(data.dblCostPrice) &&
          data.dblCostPrice > 0
        );
      }
      return true;
    },
    {
      message: "Cost price is required when purchasable",
      path: ["dblCostPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.bolIsPurchasable) {
        return (
          data.strPurchaseAccountGUID !== null &&
          data.strPurchaseAccountGUID !== undefined &&
          data.strPurchaseAccountGUID.length > 0
        );
      }
      return true;
    },
    {
      message: "Purchase account is required when purchasable",
      path: ["strPurchaseAccountGUID"],
    }
  );

export const getItemSchema = (isTaxApplied: boolean) =>
  itemSchema.superRefine((data, ctx) => {
    if (!isTaxApplied) return;

    if (!data.strTaxCategoryGUID || data.strTaxCategoryGUID.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["strTaxCategoryGUID"],
        message: "Tax category is required",
      });
    }
  });

export type ItemFormValues = z.infer<typeof itemSchema>;
