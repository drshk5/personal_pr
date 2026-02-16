import { z } from "zod";
import { ACTIVITY_TYPES, ENTITY_TYPES } from "@/types/CRM/activity";

export const activityLinkSchema = z.object({
  strEntityType: z.enum(ENTITY_TYPES, {
    required_error: "Entity type is required",
  }),
  strEntityGUID: z
    .string()
    .min(1, { message: "Entity is required" }),
});

export const activitySchema = z.object({
  strActivityType: z.enum(ACTIVITY_TYPES, {
    required_error: "Activity type is required",
  }),
  strSubject: z
    .string()
    .min(1, { message: "Subject is required" })
    .max(300, { message: "Subject cannot exceed 300 characters" }),
  strDescription: z
    .string()
    .max(4000, { message: "Description cannot exceed 4000 characters" })
    .nullable()
    .optional(),
  dtScheduledOn: z.string().nullable().optional(),
  dtCompletedOn: z.string().nullable().optional(),
  intDurationMinutes: z
    .number()
    .int()
    .min(0, { message: "Duration must be positive" })
    .max(1440, { message: "Duration cannot exceed 24 hours" })
    .nullable()
    .optional(),
  strOutcome: z
    .string()
    .max(200, { message: "Outcome cannot exceed 200 characters" })
    .nullable()
    .optional(),
  strAssignedToGUID: z.string().nullable().optional(),
  links: z.array(activityLinkSchema).default([]),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
