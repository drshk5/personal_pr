import { z } from "zod";

// Validation schema for account types tree query parameters
export const accountsByTypesTreeParamsSchema = z.object({
  strAccountTypeGUIDs: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // Optional, so empty/undefined is valid
        const guids = value.split(",").map((g) => g.trim());
        return guids.every(
          (guid) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              guid
            )
        );
      },
      {
        message: "All GUIDs must be valid UUID format",
      }
    ),
  maxLevel: z.number().int().nonnegative().nullable().optional(),
});

export type AccountsByTypesTreeParamsFormValues = z.infer<
  typeof accountsByTypesTreeParamsSchema
>;

// Validation schema for account info
export const accountInfoSchema = z.object({
  strAccountGUID: z.string().uuid({ message: "Invalid account GUID" }),
  strAccountName: z
    .string()
    .min(1, { message: "Account name is required" })
    .max(200, { message: "Account name cannot exceed 200 characters" }),
  strAccountTypeGUID: z
    .string()
    .uuid({ message: "Invalid account type GUID" }),
  strAccountTypeName: z.string().min(1, { message: "Account type name is required" }),
  strDesc: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .nullable()
    .optional(),
  bolIsActive: z.boolean(),
});

export type AccountInfoFormValues = z.infer<typeof accountInfoSchema>;
