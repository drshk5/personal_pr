import {z} from 'zod';

// Address type schema for form validation
export const addressTypeSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(100, {message: 'Name cannot exceed 100 characters'}),
  bolIsActive: z.boolean().default(true),
});

export type AddressTypeFormValues = z.infer<typeof addressTypeSchema>;
