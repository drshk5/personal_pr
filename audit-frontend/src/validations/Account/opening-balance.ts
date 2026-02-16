import { z } from "zod";
export const openingBalanceSchema = z
  .object({
    dtOpeningBalanceDate: z
      .string()
      .min(1, { message: "Opening balance date is required" }),

    strAccountGUID: z
      .string({ required_error: "Account is required" })
      .uuid({ message: "Select account" }),

    strAccountName: z.string().optional().nullable(),

    strCurrencyTypeGUID: z
      .string()
      .uuid({ message: "Invalid currency type" })
      .optional()
      .nullable(),

    dblDebit: z
      .number()
      .nonnegative({ message: "Debit amount must be non-negative" })
      .optional()
      .nullable(),

    dblCredit: z
      .number()
      .nonnegative({ message: "Credit amount must be non-negative" })
      .optional()
      .nullable(),

    dblExchangeRate: z
      .number()
      .positive({ message: "Exchange rate must be positive" })
      .optional()
      .nullable(),

    dtExchangeDate: z.string().optional().nullable(),

    dblDebit_BaseCurrency: z
      .number()
      .nonnegative({ message: "Base currency debit must be non-negative" })
      .optional()
      .nullable(),

    dblCredit_BaseCurrency: z
      .number()
      .nonnegative({ message: "Base currency credit must be non-negative" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const hasDebit = data.dblDebit != null && data.dblDebit > 0;
      const hasCredit = data.dblCredit != null && data.dblCredit > 0;
      return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
    },
    {
      message: "Either debit or credit amount is required (not both)",
      path: ["dblDebit"],
    }
  );

export type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>;

// Import validation schema
export const openingBalanceImportSchema = z.object({
  file: z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size > 0, {
      message: "File cannot be empty",
    })
    .refine(
      (file) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        return extension === "xlsx" || extension === "xls";
      },
      {
        message: "Only Excel files (.xlsx, .xls) are supported",
      }
    )
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size must be less than 10MB",
    }),
  columnMapping: z
    .object({
      accountName: z.string().optional(),
      accountType: z.string().optional(),
      accountCode: z.string().optional(),
      openingBalanceDate: z.string().optional(),
      debit: z.string().optional(),
      credit: z.string().optional(),
    })
    .optional(),
});

export type OpeningBalanceImportFormValues = z.infer<
  typeof openingBalanceImportSchema
>;
