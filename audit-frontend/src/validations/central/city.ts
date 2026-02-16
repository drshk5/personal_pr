import {z} from 'zod';

export const cityCreateSchema = z.object({
  strName: z
    .string()
    .min(1, {message: 'Name is required'})
    .max(100, {message: 'Name cannot exceed 100 characters'}),
  strCountryGUID: z.string().min(1, {message: 'Country is required'}),
  strStateGUID: z.string().min(1, {message: 'State is required'}),
  bolIsActive: z.boolean().default(true),
});

export const cityUpdateSchema = cityCreateSchema.extend({
  strCityGUID: z.string(),
});

export type CityCreateValues = z.infer<typeof cityCreateSchema>;
export type CityUpdateValues = z.infer<typeof cityUpdateSchema>;
