import * as z from "zod";

export const taskRecurrenceSchema = z.object({
  strRecurrenceType: z.enum(["Daily", "Weekly", "Monthly", "Yearly"]),
  intRecurrenceInterval: z.number().int().min(1).default(1),
  strDaysOfWeek: z.array(z.string()).nullable().optional(),
  intDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  strWeekPattern: z
    .enum(["First", "Second", "Third", "Fourth", "Fifth", "Last"])
    .nullable()
    .optional(),
  strWeekDay: z.string().nullable().optional(),
  intMonthOfYear: z.number().int().min(1).max(12).nullable().optional(),
  dtStartDate: z.date({ required_error: "Start date is required" }),
  dtEndDate: z.date().nullable().optional(),
  bolNoEndDate: z.boolean().default(false),
});

export const createTaskSchema = z
  .object({
    strTitle: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    strDescription: z.string().nullable().optional(),
    strStatus: z.string().default("Not Started"),
    strPriority: z.string().default("None"),
    strCompletionRule: z.enum(["ANY_ONE", "ALL_USERS"]).optional(),
    intPercentage: z
      .number()
      .int()
      .min(0, "Percentage must be between 0 and 100")
      .max(100, "Percentage must be between 0 and 100")
      .default(0),
    strAssignedToGUID: z.string().nullable().optional(),
    assignments: z
      .array(
        z.object({
          strAssignToGUID: z.string().min(1),
          strAssignToType: z.enum(["USER", "TEAM"]),
        })
      )
      .optional(),
    dtStartDate: z.date().nullable().optional(),
    dtDueDate: z.date().nullable().optional(),
    dtReminderDate: z.date().nullable().optional(),
    strReminderTo: z.string().nullable().optional(),
    strTicketKey: z.string().max(50).nullable().optional(),
    strTicketUrl: z.string().max(500).nullable().optional(),
    strTicketSource: z.string().max(50).nullable().optional(),
    intEstimatedMinutes: z
      .number({ required_error: "Estimated minutes is required" })
      .int("Estimated minutes must be an integer")
      .min(0, "Estimated minutes cannot be negative"),
    intActualMinutes: z
      .number()
      .int("Actual minutes must be an integer")
      .min(0, "Actual minutes cannot be negative")
      .nullable()
      .optional(),
    strTags: z.string().nullable().optional(),
    strBoardGUID: z.string().nullable().optional(),
    strBoardSectionGUID: z.string().nullable().optional(),
    strBoardSubModuleGUID: z.string().nullable().optional(),
    bolIsReviewReq: z.boolean().optional(),
    strReviewedByGUID: z.string().nullable().optional(),
    bolIsTimeTrackingReq: z.boolean().optional(),
    bolIsBillable: z.boolean().optional(),
    bolIsPrivate: z.boolean().optional(),
    bolIsNotificationSend: z.boolean().optional(),
    strAssignedByGUID: z.string().nullable().optional(),
    strChecklists: z.array(z.string()).optional().nullable(),
    recurrence: taskRecurrenceSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAssignments =
      Array.isArray(data.assignments) && data.assignments.length > 0;
    const hasLegacyAssignee =
      data.strAssignedToGUID && data.strAssignedToGUID.trim() !== "";

    if (!hasAssignments && !hasLegacyAssignee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments"],
        message: "Assignee is required",
      });
    }

    // Validate board and section when task is explicitly not private
    if (data.bolIsPrivate === false) {
      if (!data.strBoardGUID || data.strBoardGUID.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["strBoardGUID"],
          message: "Project is required for non-private tasks",
        });
      }
      if (!data.strBoardSectionGUID || data.strBoardSectionGUID.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["strBoardSectionGUID"],
          message: "Module is required for non-private tasks",
        });
      }
    }

    // Validate reviewed by when review is required
    if (data.bolIsReviewReq) {
      if (!data.strReviewedByGUID || data.strReviewedByGUID.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["strReviewedByGUID"],
          message: "Reviewed by is required when review is required",
        });
      }
    }

    if (data.bolIsBillable && !data.bolIsTimeTrackingReq) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bolIsTimeTrackingReq"],
        message: "Time tracking is required for billable tasks",
      });
    }

    // Validate recurrence fields
    if (data.recurrence) {
      const rec = data.recurrence;

      // Weekly recurrence must have days of week
      if (
        rec.strRecurrenceType === "Weekly" &&
        (!rec.strDaysOfWeek || rec.strDaysOfWeek.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrence", "strDaysOfWeek"],
          message: "Days of week are required for weekly recurrence",
        });
      }

      // Monthly/Yearly with specific day pattern validation
      if (
        rec.strRecurrenceType === "Monthly" ||
        rec.strRecurrenceType === "Yearly"
      ) {
        const hasWeekPattern = rec.strWeekPattern && rec.strWeekDay;
        const hasDayOfMonth =
          rec.intDayOfMonth !== null && rec.intDayOfMonth !== undefined;

        if (!hasWeekPattern && !hasDayOfMonth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recurrence"],
            message:
              "Either day of month or week pattern (with weekday) is required",
          });
        }
      }

      // Yearly must have month
      if (
        rec.strRecurrenceType === "Yearly" &&
        (!rec.intMonthOfYear ||
          rec.intMonthOfYear < 1 ||
          rec.intMonthOfYear > 12)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrence", "intMonthOfYear"],
          message: "Month is required for yearly recurrence",
        });
      }

      // End date validation
      if (!rec.bolNoEndDate && rec.dtEndDate && rec.dtStartDate) {
        if (rec.dtEndDate <= rec.dtStartDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recurrence", "dtEndDate"],
            message: "End date must be after start date",
          });
        }
      }
    }
  });

export const updateTaskSchema = z
  .object({
    strTitle: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    strDescription: z.string().nullable().optional(),
    strStatus: z.string().nullable().optional(),
    strPriority: z.string().nullable().optional(),
    strCompletionRule: z.enum(["ANY_ONE", "ALL_USERS"]).nullable().optional(),
    intPercentage: z
      .number()
      .int()
      .min(0, "Percentage must be between 0 and 100")
      .max(100, "Percentage must be between 0 and 100")
      .nullable()
      .optional(),
    strAssignedToGUID: z.string().nullable().optional(),
    assignments: z
      .array(
        z.object({
          strAssignToGUID: z.string().min(1),
          strAssignToType: z.enum(["USER", "TEAM"]),
        })
      )
      .optional(),
    dtStartDate: z.date().nullable().optional(),
    dtDueDate: z.date().nullable().optional(),
    dtCompletedDate: z.date().nullable().optional(),
    dtReminderDate: z.date().nullable().optional(),
    strReminderTo: z.string().nullable().optional(),
    strTicketKey: z.string().max(50).nullable().optional(),
    strTicketUrl: z.string().max(500).nullable().optional(),
    strTicketSource: z.string().max(50).nullable().optional(),
    intEstimatedMinutes: z
      .number()
      .int("Estimated minutes must be an integer")
      .min(0, "Estimated minutes cannot be negative")
      .nullable()
      .optional(),
    intActualMinutes: z
      .number()
      .int("Actual minutes must be an integer")
      .min(0, "Actual minutes cannot be negative")
      .nullable()
      .optional(),
    strTags: z.string().nullable().optional(),
    bolIsPrivate: z.boolean().nullable().optional(),
    bolIsReviewReq: z.boolean().nullable().optional(),
    bolIsBillable: z.boolean().nullable().optional(),
    bolIsNotificationSend: z.boolean().nullable().optional(),
    strReviewedByGUID: z.string().nullable().optional(),
    bolIsTimeTrackingReq: z.boolean().nullable().optional(),
    strAssignedByGUID: z.string().nullable().optional(),
    strBoardGUID: z.string().nullable().optional(),
    strBoardSectionGUID: z.string().nullable().optional(),
    strBoardSubModuleGUID: z.string().nullable().optional(),
    recurrence: taskRecurrenceSchema.nullable().optional(),
    strChecklists: z.array(z.string()).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate reviewed by when review is required
    if (data.bolIsReviewReq) {
      if (!data.strReviewedByGUID || data.strReviewedByGUID.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["strReviewedByGUID"],
          message: "Reviewed by is required when review is required",
        });
      }
    }

    // Validate recurrence fields
    if (data.recurrence) {
      const rec = data.recurrence;

      // Weekly recurrence must have days of week
      if (
        rec.strRecurrenceType === "Weekly" &&
        (!rec.strDaysOfWeek || rec.strDaysOfWeek.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrence", "strDaysOfWeek"],
          message: "Days of week are required for weekly recurrence",
        });
      }

      // Monthly/Yearly with specific day pattern validation
      if (
        rec.strRecurrenceType === "Monthly" ||
        rec.strRecurrenceType === "Yearly"
      ) {
        const hasWeekPattern = rec.strWeekPattern && rec.strWeekDay;
        const hasDayOfMonth =
          rec.intDayOfMonth !== null && rec.intDayOfMonth !== undefined;

        if (!hasWeekPattern && !hasDayOfMonth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recurrence"],
            message:
              "Either day of month or week pattern (with weekday) is required",
          });
        }
      }

      // Yearly must have month
      if (
        rec.strRecurrenceType === "Yearly" &&
        (!rec.intMonthOfYear ||
          rec.intMonthOfYear < 1 ||
          rec.intMonthOfYear > 12)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrence", "intMonthOfYear"],
          message: "Month is required for yearly recurrence",
        });
      }

      // End date validation
      if (!rec.bolNoEndDate && rec.dtEndDate && rec.dtStartDate) {
        if (rec.dtEndDate <= rec.dtStartDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recurrence", "dtEndDate"],
            message: "End date must be after start date",
          });
        }
      }
    }
  });

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type TaskRecurrenceFormData = z.infer<typeof taskRecurrenceSchema>;
