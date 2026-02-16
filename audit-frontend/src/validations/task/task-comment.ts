import * as z from "zod";

export const createTaskCommentSchema = z.object({
  strTaskGUID: z.string().min(1, "Task ID is required"),
  strParentCommentGUID: z.string().nullable().optional(),
  strContent: z.string().min(1, "Comment content is required"),
  bolIsPrivate: z.boolean().nullable().optional(),
});

export const updateTaskCommentSchema = z.object({
  strContent: z.string().min(1, "Comment content is required"),
});

export const likeCommentSchema = z.object({
  isLike: z.boolean().default(true),
});

export type CreateTaskCommentFormData = z.infer<typeof createTaskCommentSchema>;
export type UpdateTaskCommentFormData = z.infer<typeof updateTaskCommentSchema>;
export type LikeCommentFormData = z.infer<typeof likeCommentSchema>;
