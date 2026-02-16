import { z } from "zod";

export const userHourlyRateSchema = z
  .object({
    strUserGUID: z.string().min(1, { message: "User is required" }),
    strBoardGUID: z.string().min(1, { message: "Board is required" }),
    decHourlyRate: z
      .number({
        required_error: "Hourly rate is required",
        invalid_type_error: "Hourly rate must be a number",
      })
      .positive({ message: "Hourly rate must be greater than 0" })
      .min(0.01, { message: "Hourly rate must be at least 0.01" })
      .max(9999999.99, { message: "Hourly rate cannot exceed 9,999,999.99" }),
    dEffectiveFrom: z
      .string()
      .min(1, { message: "Effective from date is required" }),
    dEffectiveTo: z
      .string()
      .min(1, { message: "Effective to date is required" }),
    strCurrencyTypeGUID: z.string().min(1, { message: "Currency is required" }),
  })
  .refine(
    (data) => {
      const fromDate = new Date(data.dEffectiveFrom);
      const toDate = new Date(data.dEffectiveTo);
      return toDate >= fromDate;
    },
    {
      message:
        "Effective to date must be after or equal to effective from date",
      path: ["dEffectiveTo"],
    }
  );

export type UserHourlyRateFormValues = z.infer<typeof userHourlyRateSchema>;
