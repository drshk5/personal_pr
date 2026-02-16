import { z } from "zod";

export const countryCreateSchema = z
  .object({
    strName: z
      .string()
      .min(1, { message: "Name is required" })
      .max(100, { message: "Name cannot exceed 100 characters" }),
    strCountryCode: z
      .string()
      .max(10, { message: "Country code cannot exceed 10 characters" })
      .optional()
      .or(z.literal("").transform(() => undefined)),
    strDialCode: z
      .string()
      .max(10, { message: "Dial code cannot exceed 10 characters" })
      .optional()
      .or(z.literal("").transform(() => undefined)),
    intPhoneMinLength: z
      .union([
        z.number().int().min(0, { message: "Min length must be >= 0" }),
        z.nan(),
      ])
      .optional()
      .transform((val) =>
        Number.isNaN(val as number) ? undefined : (val as number | undefined)
      ),
    intPhoneMaxLength: z
      .union([
        z.number().int().min(0, { message: "Max length must be >= 0" }),
        z.nan(),
      ])
      .optional()
      .transform((val) =>
        Number.isNaN(val as number) ? undefined : (val as number | undefined)
      ),
    bolIsActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (
        typeof data.intPhoneMinLength === "number" &&
        typeof data.intPhoneMaxLength === "number"
      ) {
        return data.intPhoneMinLength <= data.intPhoneMaxLength;
      }
      return true;
    },
    {
      path: ["intPhoneMaxLength"],
      message: "Max length must be greater than or equal to min length",
    }
  );

export const countryUpdateSchema = countryCreateSchema;

export type CountryCreateValues = z.infer<typeof countryCreateSchema>;
export type CountryUpdateValues = z.infer<typeof countryUpdateSchema>;
