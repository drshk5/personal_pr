import {z} from 'zod';

// Currency type schema for form validation
export const currencyTypeSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(450, {message: 'Name cannot exceed 450 characters'}),
  strCountryGUID: z.string().optional(),
  bolIsActive: z.boolean().default(true),
});

export type CurrencyTypeFormValues = z.infer<typeof currencyTypeSchema>;
