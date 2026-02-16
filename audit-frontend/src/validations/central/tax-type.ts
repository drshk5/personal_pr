import { z } from "zod";

export const taxTypeCreateSchema = z.object({
  strTaxTypeCode: z
    .string()
    .min(1, { message: "Tax type code is required" })
    .max(50, { message: "Tax type code cannot exceed 50 characters" }),
  strTaxTypeName: z
    .string()
    .min(1, { message: "Tax type name is required" })
    .max(100, { message: "Tax type name cannot exceed 100 characters" }),
  strDescription: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  strCountryGUID: z.string().min(1, { message: "Country is required" }),
  bolIsCompound: z.boolean().default(false),
  bolIsActive: z.boolean().default(true),
});

export const taxTypeUpdateSchema = taxTypeCreateSchema;

export type TaxTypeCreateValues = z.infer<typeof taxTypeCreateSchema>;
export type TaxTypeUpdateValues = z.infer<typeof taxTypeUpdateSchema>;
