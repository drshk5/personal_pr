import { z } from "zod";

// Bank schema for form validation with conditional validation
export const bankSchema = z.object({
  strAccountName: z
    .string()
    .min(1, { message: "Account name is required" })
    .max(100, { message: "Account name cannot exceed 100 characters" }),
  strUDFCode: z.string().regex(/^[A-Za-z0-9]{6}$/, {
    message: "Account Code must be exactly 6 alphanumeric characters",
  }),
  strAccountTypeGUID: z
    .string()
    .min(1, { message: "Account type is required" }),
  strCurrencyTypeGUID: z
    .string()
    .min(1, { message: "Currency type is required" }),
  strAccountNumber: z
    .string()
    .max(100, { message: "Account number cannot exceed 100 characters" })
    .nullable()
    .optional(),
  strBankName: z
    .string()
    .max(150, { message: "Bank name cannot exceed 150 characters" })
    .nullable()
    .optional(),
  strIFSCCode: z
    .string()
    .max(50, { message: "IFSC code cannot exceed 50 characters" })
    .nullable()
    .optional(),
  strDesc: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .nullable()
    .optional(),
  strBranchName: z
    .string()
    .max(150, { message: "Branch name cannot exceed 150 characters" })
    .nullable()
    .optional(),
  bolIsPrimary: z.boolean().default(false),
});

export type BankFormValues = z.infer<typeof bankSchema>;
