import * as z from "zod";

const guidSchema = z.string().uuid("Invalid GUID format");
const dateSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
    message: "Invalid date format",
  });

const dateRangeRefinement = (data: {
  dtFromDate?: string;
  dtToDate?: string;
}) =>
  !data.dtFromDate ||
  !data.dtToDate ||
  Date.parse(data.dtToDate) >= Date.parse(data.dtFromDate);

export const userDailyWorkSummaryParamsSchema = z
  .object({
    strUserGUID: guidSchema.optional(),
    strBoardGUID: guidSchema.optional(),
    dtFromDate: dateSchema,
    dtToDate: dateSchema,
    pageNumber: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
    search: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    ascending: z.boolean().optional(),
  })
  .refine(dateRangeRefinement, {
    message: "End date cannot be earlier than start date",
    path: ["dtToDate"],
  });

export const userBoardBillableParamsSchema = z
  .object({
    strUserGUID: guidSchema.optional(),
    strBoardGUID: guidSchema,
    dtFromDate: dateSchema,
    dtToDate: dateSchema,
  })
  .refine(dateRangeRefinement, {
    message: "End date cannot be earlier than start date",
    path: ["dtToDate"],
  });

export const userBoardBillableDetailParamsSchema =
  userBoardBillableParamsSchema;

export type UserDailyWorkSummaryParamsInput = z.infer<
  typeof userDailyWorkSummaryParamsSchema
>;
export type UserBoardBillableParamsInput = z.infer<
  typeof userBoardBillableParamsSchema
>;
export type UserBoardBillableDetailParamsInput = z.infer<
  typeof userBoardBillableDetailParamsSchema
>;

export const validateUserDailyWorkSummaryParams = (data: unknown) =>
  userDailyWorkSummaryParamsSchema.parse(data);

export const validateUserBoardBillableParams = (data: unknown) =>
  userBoardBillableParamsSchema.parse(data);

export const validateUserBoardBillableDetailParams = (data: unknown) =>
  userBoardBillableDetailParamsSchema.parse(data);

// User Performance Report validation
export const userPerformanceReportParamsSchema = z
  .object({
    strUserGUID: guidSchema.optional(),
    strBoardGUID: guidSchema.optional(),
    strBoardSectionGUID: guidSchema.optional(),
    dtFromDate: dateSchema,
    dtToDate: dateSchema,
    pageNumber: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
    search: z.string().trim().optional(),
    sortBy: z.string().trim().optional(),
    ascending: z.boolean().optional(),
  })
  .refine(dateRangeRefinement, {
    message: "End date cannot be earlier than start date",
    path: ["dtToDate"],
  });

export type UserPerformanceReportParamsInput = z.infer<
  typeof userPerformanceReportParamsSchema
>;

export const validateUserPerformanceReportParams = (data: unknown) =>
  userPerformanceReportParamsSchema.parse(data);
