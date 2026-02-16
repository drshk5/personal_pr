import {z} from 'zod';

export const stateCreateSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(100, {message: 'Name cannot exceed 100 characters'}),
  strCountryGUID: z.string().min(1, {message: 'Country is required'}),
  bolIsActive: z.boolean().default(true),
});

export const stateUpdateSchema = stateCreateSchema;

export type StateCreateValues = z.infer<typeof stateCreateSchema>;
export type StateUpdateValues = z.infer<typeof stateUpdateSchema>;
