import { z } from "zod";

// Journal Voucher Item schema for form validation
export const journalVoucherItemSchema = z
  .object({
    intSeqNo: z
      .number()
      .int({ message: "Sequence number must be an integer" })
      .min(1, { message: "Sequence number must be greater than 0" }),

    strAccountGUID: z.string().min(1, { message: "Account is required" }),

    strDesc: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .nullable()
      .optional(),

    strRefNo: z
      .string()
      .max(100, { message: "Reference number cannot exceed 100 characters" })
      .nullable()
      .optional(),

    strNotes: z
      .string()
      .max(1000, { message: "Notes cannot exceed 1000 characters" })
      .nullable()
      .optional(),

    strCurrencyTypeGUID: z.string().nullable().optional(),

    dblDebit: z
      .number()
      .nonnegative({ message: "Debit amount must be non-negative" })
      .nullable()
      .optional(),

    dblCredit: z
      .number()
      .nonnegative({ message: "Credit amount must be non-negative" })
      .nullable()
      .optional(),

    dblDebit_BaseCurrency: z
      .number()
      .nonnegative({ message: "Base currency debit amount must be non-negative" })
      .nullable()
      .optional(),

    dblCredit_BaseCurrency: z
      .number()
      .nonnegative({ message: "Base currency credit amount must be non-negative" })
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure that at least one of debit or credit is provided, but not both with values > 0
      if (
        data.dblDebit &&
        data.dblCredit &&
        data.dblDebit > 0 &&
        data.dblCredit > 0
      ) {
        return false;
      }
      return (
        (data.dblDebit !== null &&
          data.dblDebit !== undefined &&
          data.dblDebit > 0) ||
        (data.dblCredit !== null &&
          data.dblCredit !== undefined &&
          data.dblCredit > 0)
      );
    },
    {
      message: "Either debit or credit must be provided, but not both",
      path: ["dblDebit"],
    }
  );

export type JournalVoucherItemFormValues = z.infer<
  typeof journalVoucherItemSchema
>;
