import {z} from 'zod';

// Account type schema for form validation
export const accountTypeSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(100, {message: 'Name cannot exceed 100 characters'}),
  bolIsActive: z.boolean().default(true),
});

export type AccountTypeFormValues = z.infer<typeof accountTypeSchema>;
