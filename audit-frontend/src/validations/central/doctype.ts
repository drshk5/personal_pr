import {z} from 'zod';

// Doc type schema for form validation
export const docTypeSchema = z.object({
  strDocTypeCode: z
    .string()
    .min(1, {message: 'Code is required'})
    .max(50, {message: 'Code cannot exceed 50 characters'}),
  strDocTypeName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(100, {message: 'Name cannot exceed 100 characters'}),
  bolIsActive: z.boolean().default(true),
});

export type DocTypeFormValues = z.infer<typeof docTypeSchema>;