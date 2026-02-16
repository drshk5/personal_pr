import { z } from "zod";

export const paymentReceivedItemSchema = z.object({
  strPaymentReceived_ItemGUID: z.string().optional(),
  strInvoiceGUID: z.string().min(1, { message: "Invoice is required" }),
  dtPaymentReceivedOn: z
    .union([z.date(), z.string()])
    .refine((val) => val !== undefined && val !== "", {
      message: "Payment received date is required",
    }),
  dblPaymentAmount: z
    .number({ invalid_type_error: "Payment amount must be a number" })
    .min(0, { message: "Payment amount cannot be negative" }),
  strInvoiceNo: z.string().optional(),
  dblInvoiceAmount: z.number().optional(),
  dblPendingAmount: z.number().optional(),
});

const paymentReceivedBaseSchema = z.object({
  dPaymentReceivedDate: z
    .union([z.date(), z.string()])
    .refine((val) => val !== undefined && val !== "", {
      message: "Payment received date is required",
    }),
  strCustomerGUID: z
    .string()
    .min(1, { message: "Customer is required" })
    .refine((val) => val !== "", { message: "Customer is required" }),
  strAccountGUID: z
    .string()
    .min(1, { message: "Deposit To is required" })
    .refine((val) => val !== "", { message: "Deposit To is required" }),
  strRefNo: z
    .string()
    .max(100, { message: "Reference number cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strPaymentMode: z
    .string()
    .min(1, { message: "Payment mode is required" })
    .max(20, { message: "Payment mode cannot exceed 20 characters" }),
  strSubject: z
    .string()
    .max(500, { message: "Subject cannot exceed 500 characters" })
    .nullable()
    .optional(),
  dblBankCharges: z
    .number({ invalid_type_error: "Bank charges must be a number" })
    .min(0, { message: "Bank charges cannot be negative" })
    .default(0)
    .optional(),
  dblTotalAmountReceived: z
    .number({ invalid_type_error: "Total amount must be a number" })
    .min(0.01, { message: "Total amount received must be greater than 0" }),
  strNotes: z
    .string()
    .max(1000, { message: "Notes cannot exceed 1000 characters" })
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

export const createPaymentReceivedSchema = paymentReceivedBaseSchema.extend({
  Items: z.array(paymentReceivedItemSchema),
});

export const updatePaymentReceivedSchema = paymentReceivedBaseSchema.extend({
  Items: z.array(paymentReceivedItemSchema),
  strRemovePaymentReceivedItemGUIDs: z.array(z.string()).optional(),
});

export const paymentReceivedFilterSchema = z.object({
  FromDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  ToDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  strStatus: z.string().optional(),
  strCustomerGUID: z.string().optional(),
  strAccountGUID: z.string().optional(),
  strPaymentMode: z.string().optional(),
  Search: z.string().optional(),
  strCreatedByGUID: z.string().optional(),
  strUpdatedByGUID: z.string().optional(),
  PageNumber: z.number().min(1).default(1).optional(),
  PageSize: z.number().min(1).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const paymentReceivedPendingApprovalFilterSchema = z.object({
  FromDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  ToDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
  strPaymentMode: z.string().optional(),
  strCustomerGUID: z.string().optional(),
  strAccountGUID: z.string().optional(),
  Search: z.string().optional(),
  PageNumber: z.number().min(1).default(1).optional(),
  PageSize: z.number().min(1).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const paymentReceivedChangeStatusSchema = z
  .object({
    strPaymentReceivedGUIDs: z
      .array(z.string())
      .min(1, { message: "At least one payment received record is required" }),
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

export type CreatePaymentReceivedFormData = z.infer<
  typeof createPaymentReceivedSchema
>;
export type UpdatePaymentReceivedFormData = z.infer<
  typeof updatePaymentReceivedSchema
>;
export type PaymentReceivedFilterFormData = z.infer<
  typeof paymentReceivedFilterSchema
>;
export type PaymentReceivedPendingApprovalFilterFormData = z.infer<
  typeof paymentReceivedPendingApprovalFilterSchema
>;
export type PaymentReceivedChangeStatusFormData = z.infer<
  typeof paymentReceivedChangeStatusSchema
>;
