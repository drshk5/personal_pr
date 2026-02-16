import { z } from "zod";

// Journal Voucher Recurring Profile schema for form validation (Create/Update)
export const journalVoucherRecurringProfileSchema = z.object({
  strProfileName: z
    .string()
    .min(1, { message: "Profile name is required" })
    .max(150, { message: "Profile name cannot exceed 150 characters" }),

  strRepeatType: z
    .string()
    .min(1, { message: "Repeat type is required" })
    .max(20, { message: "Repeat type cannot exceed 20 characters" }),

  intRepeatEveryValue: z
    .number()
    .int()
    .min(1, { message: "Repeat every value must be at least 1" }),

  strRepeatEveryUnit: z
    .string()
    .max(20, { message: "Repeat every unit cannot exceed 20 characters" })
    .nullable()
    .optional(),

  intRepeatOnDay: z
    .number()
    .int()
    .min(1, { message: "Repeat on day must be between 1 and 31" })
    .max(31, { message: "Repeat on day must be between 1 and 31" })
    .nullable()
    .optional(),

  strRepeatOnWeekday: z
    .string()
    .max(20, { message: "Weekday cannot exceed 20 characters" })
    .nullable()
    .optional(),

  strCustomFrequencyJson: z.string().nullable().optional(),

  dStartDate: z.string().min(1, { message: "Start date is required" }),

  dEndDate: z.string().nullable().optional(),

  bolNeverExpires: z.boolean().default(false),

  strStatus: z
    .string()
    .max(20, { message: "Status cannot exceed 20 characters" })
    .optional()
    .default("Active"),
});

export type JournalVoucherRecurringProfileFormValues = z.infer<
  typeof journalVoucherRecurringProfileSchema
>;
