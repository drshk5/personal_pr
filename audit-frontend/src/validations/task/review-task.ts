import * as z from "zod";

/**
 * AddReviewDto validation schema
 */
export const addReviewSchema = z.object({
  strTaskGUID: z
    .string()
    .min(1, "Task GUID is required")
    .uuid("Task GUID must be a valid UUID"),
  strReview: z
    .string()
    .min(1, "Review text is required")
    .max(10000, "Review text cannot exceed 10,000 characters"),
});

/**
 * UpdateReviewDto validation schema
 */
export const updateReviewSchema = z.object({
  strReview: z
    .string()
    .min(1, "Review text is required")
    .max(10000, "Review text cannot exceed 10,000 characters"),
});

export type AddReviewFormData = z.infer<typeof addReviewSchema>;
export type UpdateReviewFormData = z.infer<typeof updateReviewSchema>;
