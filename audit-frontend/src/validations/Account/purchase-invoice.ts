import { z } from "zod";

export type FormData = z.infer<typeof purchaseInvoiceSchema>;

const invoiceAddressSchema = z.object({
  strAttention: z.string().trim().optional().nullable(),
  strCountryGUID: z.string().trim().optional().nullable(),
  strCountryName: z.string().trim().optional().nullable(),
  strAddress: z.string().trim().optional().nullable(),
  strStateGUID: z.string().trim().optional().nullable(),
  strStateName: z.string().trim().optional().nullable(),
  strCityGUID: z.string().trim().optional().nullable(),
  strCityName: z.string().trim().optional().nullable(),
  strPinCode: z.string().trim().optional().nullable(),
  strPhone: z.string().trim().optional().nullable(),
  strFaxNumber: z.string().trim().optional().nullable(),
});

export const purchaseInvoiceSchema = z
  .object({
  // Required fields with strict validation
  dPurchaseInvoiceDate: z
    .string({
      required_error: "Purchase invoice date is required",
      invalid_type_error: "Invalid date format",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),

  strStatus: z
    .string({
      required_error: "Status is required",
    })
    .min(1, "Status is required")
    .default("Draft"),

  strSubject: z
    .string()
    .trim()
    .max(200, "Subject cannot exceed 200 characters")
    .optional()
    .nullable(),

  // Party - required for purchase invoice
  strPartyGUID: z
    .string({
      required_error: "Party is required",
    })
    .min(1, "Party is required"),

  // Currency
  strCurrencyTypeGUID: z.string().uuid().optional().nullable(),

  strAdjustment_AccountGUID: z.string().uuid().optional().nullable(),

  strBillingAddress: invoiceAddressSchema.optional().nullable(),
  strShippingAddress: invoiceAddressSchema.optional().nullable(),

  // Optional fields with validation when provided
  strCustomerNotes: z
    .string()
    .trim()
    .max(1000, "Customer notes cannot exceed 1000 characters")
    .optional()
    .nullable(),

  strTC: z
    .string()
    .trim()
    .max(1000, "Terms & Conditions cannot exceed 1000 characters")
    .optional()
    .nullable(),

  strOrderNo: z.string().trim().optional().nullable(),

  strAdjustmentName: z
    .string()
    .trim()
    .max(100, "Adjustment description cannot exceed 100 characters")
    .optional()
    .nullable(),

  // Number fields - amounts
  dblGrossTotalAmt: z
    .number({
      invalid_type_error: "Gross total must be a number",
    })
    .default(0),

  dblTotalDiscountAmt: z
    .number({
      invalid_type_error: "Discount amount must be a number",
    })
    .default(0),

  dblAdjustmentAmt: z
    .number({
      invalid_type_error: "Adjustment amount must be a number",
    })
    .optional()
    .nullable(),

  dblTaxAmt: z
    .number({
      invalid_type_error: "Tax amount must be a number",
    })
    .min(0, "Tax amount cannot be negative")
    .default(0),

  dblNetAmt: z
    .number({
      required_error: "Net amount is required",
      invalid_type_error: "Net amount must be a number",
    })
    .min(0, "Net amount cannot be negative"),

  // Exchange rate for multi-currency
  dblExchangeRate: z.number().optional().nullable(),

  dtExchangeRateDate: z.string().optional().nullable(),

  // Base currency amounts
  dblGrossTotalAmtBase: z.number().optional().nullable(),
  dblTotalDiscountAmtBase: z.number().optional().nullable(),
  dblTaxAmtBase: z.number().optional().nullable(),
  dblAdjustmentAmtBase: z.number().optional().nullable(),
  dblNetAmtBase: z.number().optional().nullable(),
  dblPendingAmount: z.number().optional().nullable(),
  dblPendingAmountBase: z.number().optional().nullable(),

  // Purchase invoice items validation
  items: z
    .array(z.lazy(() => purchaseInvoiceItemSchema))
    .min(1, "At least one item is required")
    .default([]),
  })
  .superRefine((value, ctx) => {
    if (value.dblAdjustmentAmt && value.dblAdjustmentAmt !== 0) {
      if (!value.strAdjustment_AccountGUID) {
        ctx.addIssue({
          code: "custom",
          path: ["strAdjustment_AccountGUID"],
          message: "Adjustment account is required when adjustment amount is specified",
        });
      }
    }
  });

export type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

export const purchaseInvoiceItemSchema = z.object({
  strPurchaseInvoice_ItemGUID: z.string().optional().nullable(),

  intSeqNo: z
    .number({
      required_error: "Sequence number is required",
      invalid_type_error: "Sequence number must be a number",
    })
    .int("Sequence number must be an integer")
    .min(1, "Sequence number must be greater than 0"),

  strItemGUID: z.string().optional().nullable(),
  strCategoryGUID: z.string().optional().nullable(),
  strUoMGUID: z.string().optional().nullable(),

  strDesc: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional()
    .nullable(),

  dblQty: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .min(0, "Quantity must be 0 or greater")
    .max(999999.99, "Quantity is too large")
    .optional()
    .nullable(),

  dblRate: z
    .number({
      required_error: "Rate is required",
      invalid_type_error: "Rate must be a number",
    })
    .min(0, "Rate cannot be negative")
    .max(999999999.99, "Rate is too large")
    .optional()
    .nullable(),

  dblTotalAmt: z
    .number()
    .min(0, "Amount cannot be negative")
    .max(999999999.99, "Amount is too large")
    .optional()
    .nullable(),

  dblTaxPercentage: z.number().optional().nullable(),
  dblTaxAmt: z.number().optional().nullable(),
  dblNetAmt: z.number().optional().nullable(),
  dblDiscountPercentage: z.number().optional().nullable(),
  dblDiscountAmt: z.number().optional().nullable(),

  dblRateBase: z.number().optional().nullable(),
  dblTaxAmtBase: z.number().optional().nullable(),
  dblNetAmtBase: z.number().optional().nullable(),
  dblTotalAmtBase: z.number().optional().nullable(),
  dblDiscountAmtBase: z.number().optional().nullable(),

  strAccountGUID: z
    .string({
      required_error: "Account is required",
    })
    .min(1, "Account is required")
    .optional()
    .nullable(),
});

export type PurchaseInvoiceItemFormValues = z.infer<
  typeof purchaseInvoiceItemSchema
>;
