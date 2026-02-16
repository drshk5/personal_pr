import {z} from 'zod';

// Industry schema for form validation
export const industrySchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(450, {message: 'Name cannot exceed 450 characters'}),
  bolIsActive: z.boolean().default(true),
});

export type IndustryFormValues = z.infer<typeof industrySchema>;
