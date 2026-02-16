import {z} from 'zod';

// Legal Status Type schema for form validation
export const legalStatusTypeSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(450, {message: 'Name cannot exceed 450 characters'}),
  bolIsActive: z.boolean().default(true),
});

export type LegalStatusTypeFormValues = z.infer<typeof legalStatusTypeSchema>;
