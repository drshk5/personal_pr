import { z } from "zod";

// Journal Voucher Template Item schema for form validation
export const journalVoucherTemplateItemSchema = z.object({
  strJournal_Voucher_Template_ItemGUID: z.string().uuid().optional().nullable(),
  intSeqNo: z
    .number()
    .int()
    .min(1, { message: "Sequence number must be greater than 0" }),
  strAccountGUID: z.string().uuid({ message: "Account is required" }),
  strDesc: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .nullable(),
  strRefNo: z
    .string()
    .max(100, { message: "Reference cannot exceed 100 characters" })
    .optional()
    .nullable(),
  dblDebit: z
    .number()
    .min(0, { message: "Debit amount must be non-negative" })
    .optional()
    .nullable(),
  dblCredit: z
    .number()
    .min(0, { message: "Credit amount must be non-negative" })
    .optional()
    .nullable(),
  dblDebit_BaseCurrency: z
    .number()
    .min(0, { message: "Debit base currency amount must be non-negative" })
    .optional()
    .nullable(),
  dblCredit_BaseCurrency: z
    .number()
    .min(0, { message: "Credit base currency amount must be non-negative" })
    .optional()
    .nullable(),
});

// Journal Voucher Template Item schema for create (no GUID)
export const journalVoucherTemplateItemCreateSchema =
  journalVoucherTemplateItemSchema.omit({
    strJournal_Voucher_Template_ItemGUID: true,
  });

// Journal Voucher Template schema for form validation
export const journalVoucherTemplateSchema = z.object({
  strTemplateName: z
    .string()
    .min(1, { message: "Template name is required" })
    .max(100, { message: "Template name cannot exceed 100 characters" }),

  strRefNo: z
    .string()
    .max(100, { message: "Reference cannot exceed 100 characters" })
    .optional()
    .nullable()
    .or(z.literal("")),

  strNotes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional()
    .nullable()
    .or(z.literal("")),

  strCurrencyTypeGUID: z
    .string()
    .uuid({ message: "Currency type is required" }),

  bolIsJouranl_Adjustement: z.boolean().optional(),

  dblExchangeRate: z
    .number()
    .min(0, { message: "Exchange rate must be non-negative" })
    .default(0),

  items: z.array(journalVoucherTemplateItemCreateSchema).optional().nullable(),
});

// Journal Voucher Template schema for update (with items that may have GUIDs)
export const journalVoucherTemplateUpdateSchema = z.object({
  strTemplateName: z
    .string()
    .min(1, { message: "Template name is required" })
    .max(100, { message: "Template name cannot exceed 100 characters" }),

  strRefNo: z
    .string()
    .max(100, { message: "Reference cannot exceed 100 characters" })
    .optional()
    .nullable()
    .or(z.literal("")),

  strNotes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional()
    .nullable()
    .or(z.literal("")),

  strCurrencyTypeGUID: z
    .string()
    .uuid({ message: "Currency type is required" }),

  bolIsJouranl_Adjustement: z.boolean().optional(),

  dblExchangeRate: z
    .number()
    .min(0, { message: "Exchange rate must be non-negative" })
    .default(0),

  items: z.array(journalVoucherTemplateItemSchema).optional().nullable(),
});

export type JournalVoucherTemplateFormValues = z.infer<
  typeof journalVoucherTemplateSchema
>;

export type JournalVoucherTemplateUpdateFormValues = z.infer<
  typeof journalVoucherTemplateUpdateSchema
>;

export type JournalVoucherTemplateItemFormValues = z.infer<
  typeof journalVoucherTemplateItemSchema
>;
