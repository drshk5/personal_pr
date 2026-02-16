import { z } from "zod";

/**
 * Validation schema for year form
 */
const computeMaxEndDateFromStart = (startDate: Date) => {
  const maxEndDate = new Date(startDate);
  maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);
  maxEndDate.setDate(maxEndDate.getDate() - 1);
  return maxEndDate;
};

export const yearSchema = z
  .object({
    strName: z
      .string()
      .min(1, { message: "Name is required" })
      .max(100, { message: "Name cannot exceed 100 characters" }),
    dtStartDate: z.coerce
      .date({ required_error: "Start date is required" })
      .refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date format",
      }),
    dtEndDate: z.coerce
      .date({ required_error: "End date is required" })
      .refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date format",
      }),
    bolIsActive: z.boolean().default(true),
    strPreviousYearGUID: z.string().nullable().optional(),
    strNextYearGUID: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        return data.dtStartDate < data.dtEndDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["dtEndDate"],
    }
  )
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        const maxEndDate = computeMaxEndDateFromStart(data.dtStartDate);
        return data.dtEndDate <= maxEndDate;
      }
      return true;
    },
    {
      message:
        "End date cannot be more than 1 year minus 1 day after the start date",
      path: ["dtEndDate"],
    }
  )
  .refine(
    (data) => {
      // If both previous and next year GUIDs are provided, ensure they're not the same
      if (data.strPreviousYearGUID && data.strNextYearGUID) {
        return data.strPreviousYearGUID !== data.strNextYearGUID;
      }
      return true;
    },
    {
      message: "Previous year and Next year cannot be the same",
      path: ["strNextYearGUID"],
    }
  );

/**
 * Type definition for the form values
 */
export type YearFormValues = z.infer<typeof yearSchema>;
