import { z } from "zod";

export const paymentMadeItemSchema = z
  .object({
    strPaymentMade_ItemGUID: z.string().optional(),
    strPurchaseInvoiceGUID: z
      .string()
      .min(1, { message: "Purchase invoice is required" }),
    dtPaymentMadeOn: z
      .union([z.date(), z.string()])
      .refine((val) => val !== undefined && val !== "", {
        message: "Payment date is required",
      }),
    dblPaymentAmount: z
      .number({ invalid_type_error: "Payment amount must be a number" })
      .min(0, { message: "Payment amount cannot be negative" }),
    strPurchaseInvoiceNo: z.string().optional(),
    dblInvoiceAmount: z.number().optional(),
    dblPendingAmount: z.number().optional(),
    dblPurchaseInvoiceAmount: z.number().optional(),
    dblUnProcessedAmount: z.number().optional(),
    manuallyEdited: z.boolean().optional(),
    warningDismissed: z.boolean().optional(),
  })
  .passthrough();

const paymentMadeBaseSchema = z.object({
  dtPaymentMadeDate: z
    .union([z.date(), z.string()])
    .refine((val) => val !== undefined && val !== "", {
      message: "Payment date is required",
    }),
  strVendorGUID: z
    .string()
    .min(1, { message: "Vendor is required" })
    .refine((val) => val !== "", { message: "Vendor is required" }),
  strAccountGUID: z
    .string()
    .min(1, { message: "Deposit To is required" })
    .refine((val) => val !== "", { message: "Deposit To is required" }),
  strRefNo: z
    .string()
    .max(100, { message: "Reference number cannot exceed 100 characters" })
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  strPaymentMode: z
    .string()
    .min(1, { message: "Payment mode is required" })
    .max(20, { message: "Payment mode cannot exceed 20 characters" }),
  strSubject: z
    .string()
    .max(500, { message: "Subject cannot exceed 500 characters" })
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  dblTotalAmountMade: z
    .number({ invalid_type_error: "Total amount must be a number" })
    .min(0.01, { message: "Total amount made must be greater than 0" }),
  strNotes: z
    .string()
    .max(1000, { message: "Notes cannot exceed 1000 characters" })
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  dtExchangeRateDate: z
    .union([z.date(), z.string(), z.null()])
    .nullable()
    .default(null),
  dblExchangeRate: z
    .number({ invalid_type_error: "Exchange rate must be a number" })
    .min(0.000001, { message: "Exchange rate must be greater than 0" })
    .default(1),
  strCurrencyTypeGUID: z.string().nullable().optional(),
});

export const createPaymentMadeSchema = paymentMadeBaseSchema.extend({
  Items: z.array(paymentMadeItemSchema),
});

export const updatePaymentMadeSchema = paymentMadeBaseSchema.extend({
  Items: z.array(paymentMadeItemSchema),
  strRemovePaymentMadeItemGUIDs: z.array(z.string()).optional(),
});

export const paymentMadeFilterSchema = z.object({
  fromDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  toDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  strStatus: z.string().optional(),
  strVendorGUID: z.string().optional(),
  strAccountGUID: z.string().optional(),
  strPaymentMode: z.string().optional(),
  search: z.string().optional(),
  strCreatedByGUID: z.string().optional(),
  strUpdatedByGUID: z.string().optional(),
  PageNumber: z.number().min(1).default(1).optional(),
  PageSize: z.number().min(1).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const paymentMadePendingApprovalFilterSchema = z.object({
  fromDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  toDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  strPaymentMode: z.string().optional(),
  strVendorGUID: z.string().optional(),
  strAccountGUID: z.string().optional(),
  search: z.string().optional(),
  PageNumber: z.number().min(1).default(1).optional(),
  PageSize: z.number().min(1).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const paymentMadeChangeStatusSchema = z
  .object({
    strPaymentMadeGUIDs: z
      .array(z.string())
      .min(1, { message: "At least one payment made record is required" }),
    strStatus: z
      .string()
      .min(1, { message: "Status is required" })
      .max(20, { message: "Status cannot exceed 20 characters" }),
    strRejectedReason: z
      .string()
      .max(500, { message: "Rejected reason cannot exceed 500 characters" })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.strStatus === "Rejected" && !data.strRejectedReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejected reason is required when status is Rejected",
        path: ["strRejectedReason"],
      });
    }
  });

export type CreatePaymentMadeFormData = z.infer<typeof createPaymentMadeSchema>;
export type UpdatePaymentMadeFormData = z.infer<typeof updatePaymentMadeSchema>;
export type PaymentMadeFilterFormData = z.infer<typeof paymentMadeFilterSchema>;
export type PaymentMadePendingApprovalFilterFormData = z.infer<
  typeof paymentMadePendingApprovalFilterSchema
>;
export type PaymentMadeChangeStatusFormData = z.infer<
  typeof paymentMadeChangeStatusSchema
>;
