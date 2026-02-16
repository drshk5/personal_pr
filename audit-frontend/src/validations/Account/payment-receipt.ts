import { z } from "zod";

// Payment Receipt schema - matches backend DTO exactly
export const paymentReceiptSchema = z.object({
  strTransactionType: z
    .string()
    .min(1, { message: "Transaction type is required" })
    .refine((val) => ["PAYMENT", "RECEIPT"].includes(val), {
      message: "Transaction type must be PAYMENT or RECEIPT",
    }),

  dtTransactionDate: z
    .string()
    .min(1, { message: "Transaction date is required" }),

  strPaymentMode: z
    .string()
    .min(1, { message: "Payment mode is required" })
    .refine((val) => ["BANK", "CARD", "CASH", "CHEQUE"].includes(val), {
      message: "Invalid payment mode",
    }),

  strToAccountGUID: z.string().min(1, { message: "Account is required" }),

  dblTotalAmount: z
    .number()
    .positive({ message: "Amount must be greater than 0" }),

  strCurrencyTypeGUID: z
    .string({ required_error: "Currency is required" })
    .uuid({ message: "Invalid currency type" }),

  dblExchangeRate: z
    .number()
    .positive({ message: "Exchange rate must be greater than 0" }),

  dblBaseTotalAmount: z
    .number()
    .positive({ message: "Base amount must be greater than 0" }),

  strBankCashGUID: z.string().uuid().nullable().optional(),

  strChequeNo: z.string().max(100).nullable().optional(),

  dtChequeDate: z.string().nullable().optional(),

  strCardType: z.string().max(20).nullable().optional(),

  strCardLastFourDigits: z
    .string()
    .max(4, { message: "Last 4 digits cannot exceed 4 characters" })
    .nullable()
    .optional(),

  strCardIssuerBank: z.string().max(200).nullable().optional(),

  strCardTransactionId: z.string().max(100).nullable().optional(),

  dblCardProcessingFee: z.number().nonnegative().nullable().optional(),

  strReferenceNo: z.string().max(100).nullable().optional(),

  strNarration: z.string().max(1000).nullable().optional(),
});

// Conditional validation based on payment mode
export const paymentReceiptSchemaWithRefinements = paymentReceiptSchema
  .refine(
    (data) => {
      if (data.strPaymentMode === "BANK") {
        return !!data.strBankCashGUID;
      }
      return true;
    },
    {
      message: "Bank/Cash account is required for Bank payment mode",
      path: ["strBankCashGUID"],
    }
  )
  .refine(
    (data) => {
      if (data.strPaymentMode === "CASH") {
        return !!data.strBankCashGUID;
      }
      return true;
    },
    {
      message: "Cash account is required for Cash payment mode",
      path: ["strBankCashGUID"],
    }
  )
  .refine(
    (data) => {
      if (data.strPaymentMode === "CARD") {
        return !!data.strCardType && !!data.strCardLastFourDigits;
      }
      return true;
    },
    {
      message: "Card type and last 4 digits are required for Card payment mode",
      path: ["strCardType"],
    }
  )
  .refine(
    (data) => {
      if (data.strPaymentMode === "CHEQUE") {
        return (
          !!data.strChequeNo && !!data.dtChequeDate && !!data.strBankCashGUID
        );
      }
      return true;
    },
    {
      message:
        "Cheque number, date and bank are required for Cheque payment mode",
      path: ["strChequeNo"],
    }
  )
  .refine(
    (data) => {
      if (!data.strBankCashGUID) return true;
      return data.strToAccountGUID !== data.strBankCashGUID;
    },
    {
      message: "From and To accounts cannot be the same",
      path: ["strToAccountGUID"],
    }
  );

export type PaymentReceiptFormValues = z.infer<
  typeof paymentReceiptSchemaWithRefinements
>;
