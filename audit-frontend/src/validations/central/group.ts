import { z } from "zod";

const computeMaxEndDateFromStart = (startDate: Date) => {
  const maxEndDate = new Date(startDate);
  maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);
  maxEndDate.setDate(maxEndDate.getDate() - 1);
  return maxEndDate;
};

const baseGroupSchema = {
  strName: z
    .string()
    .min(1, { message: "Group name is required" })
    .max(100, { message: "Group name cannot exceed 100 characters" }),
  strLicenseNo: z
    .string()
    .min(1, { message: "License number is required" })
    .max(50, { message: "License number cannot exceed 50 characters" }),
  strPAN: z
    .string()
    .max(20, { message: "PAN cannot exceed 20 characters" })
    .optional(),
  strTAN: z
    .string()
    .max(20, { message: "TAN cannot exceed 20 characters" })
    .optional(),
  strCIN: z
    .string()
    .max(50, { message: "CIN cannot exceed 50 characters" })
    .optional(),
};

export const groupSchema = z
  .object({
    ...baseGroupSchema,
    strUDFCode: z
      .string()
      .max(50, { message: "Organization code cannot exceed 50 characters" })
      .optional(),
    strIndustryGUID: z
      .string()
      .max(50, { message: "Industry Type cannot exceed 50 characters" })
      .optional(),
    strLegalStatusTypeGUID: z
      .string()
      .max(50, { message: "Legal Status Type cannot exceed 50 characters" })
      .optional(),
    dtLicenseIssueDate: z.union([z.date(), z.string()]).transform((val) => {
      if (val === null || val === undefined || val === "") {
        return new Date();
      }

      try {
        return val instanceof Date ? val : new Date(val);
      } catch {
        return new Date();
      }
    }),
    dtLicenseExpired: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }

        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    dtStartDate: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }

        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    dtEndDate: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }

        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    strYearName: z.string().optional(),
    strCountryGUID: z
      .string()
      .min(1, { message: "Country is required" })
      .max(50, { message: "Country cannot exceed 50 characters" }),
    strCurrencyGUID: z
      .string()
      .min(1, { message: "Currency is required" })
      .max(50, { message: "Currency cannot exceed 50 characters" }),
    // Tax configuration fields (optional)
    strTaxTypeGUID: z.string().optional(),
    strTaxRegNo: z
      .string()
      .max(50, {
        message: "Tax registration number cannot exceed 50 characters",
      })
      .optional(),
    strStateGUID: z.string().optional(),
    dtRegistrationDate: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }
        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    bolIsDefaultTaxConfig: z.boolean().default(true).optional(),
    bolIsTaxApplied: z.boolean().default(false).optional(),
    jsonTaxSettings: z
      .string()
      .max(4000, { message: "Tax settings JSON cannot exceed 4000 characters" })
      .optional(),
    // India GST fields
    gstNumber: z.string().optional(),
    eInvoiceEnabled: z.boolean().default(false).optional(),
    compositionScheme: z.boolean().default(false).optional(),
    gstinVerificationRequired: z.boolean().default(true).optional(),
    printHSNCode: z.boolean().default(true).optional(),
    // UK VAT fields
    vatNumber: z.string().optional(),
    vatScheme: z
      .enum(["Standard", "FlatRate", "CashAccounting"])
      .default("Standard")
      .optional(),
    mtdEnabled: z.boolean().default(true).optional(),
    accountingBasis: z.enum(["Accrual", "Cash"]).default("Accrual").optional(),
    flatRatePercentage: z.number().nullable().optional(),
    // USA Sales Tax fields
    primaryState: z.string().optional(),
    taxLicenseNumber: z.string().optional(),
    nexusStates: z.array(z.string()).default([]).optional(),
    economicNexusEnabled: z.boolean().default(true).optional(),
    marketplaceFacilitator: z.boolean().default(false).optional(),
    showTaxBreakdownOnInvoice: z.boolean().default(true).optional(),
    // Admin user fields
    strAdminName: z
      .string()
      .min(1, { message: "Admin name is required" })
      .max(100, { message: "Admin name cannot exceed 100 characters" })
      .optional(),
    strAdminMobileNo: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits." })
      .max(15, { message: "Phone number cannot exceed 15 digits." })
      .optional(),
    strAdminEmailId: z
      .string()
      .email({ message: "Please enter a valid email address" })
      .optional(),
    strAdminPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .optional(),
    strTimeZone: z
      .string()
      .min(1, { message: "Timezone is required" })
      .max(50, { message: "Timezone cannot exceed 50 characters" })
      .default("Asia/Kolkata")
      .optional(),
    strDesignationGUID: z.string().optional(),
    strDepartmentGUID: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        return data.dtStartDate < data.dtEndDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["dtEndDate"],
    }
  )
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        const maxEndDate = computeMaxEndDateFromStart(data.dtStartDate);
        return data.dtEndDate <= maxEndDate;
      }
      return true;
    },
    {
      message:
        "End date cannot be more than 1 year minus 1 day after the start date",
      path: ["dtEndDate"],
    }
  );

export type GroupFormValues = z.infer<typeof groupSchema>;

export const newGroupSchema = z
  .object({
    ...baseGroupSchema,
    strUDFCode: z
      .string()
      .min(1, { message: "Organization code is required" })
      .max(50, { message: "Organization code cannot exceed 50 characters" }),
    strIndustryGUID: z
      .string()
      .min(1, { message: "Industry Type is required" })
      .max(50, { message: "Industry Type cannot exceed 50 characters" }),
    strLegalStatusTypeGUID: z
      .string()
      .min(1, { message: "Legal Status Type is required" })
      .max(50, { message: "Legal Status Type cannot exceed 50 characters" }),
    dtLicenseIssueDate: z.union([z.date(), z.string()]).transform((val) => {
      if (val === null || val === undefined || val === "") {
        return new Date();
      }

      try {
        return val instanceof Date ? val : new Date(val);
      } catch {
        return new Date();
      }
    }),
    dtLicenseExpired: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }

        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    dtStartDate: z.coerce
      .date({ required_error: "Start date is required" })
      .refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date format",
      }),
    dtEndDate: z.coerce
      .date({ required_error: "End date is required" })
      .refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date format",
      }),
    strYearName: z
      .string()
      .min(1, { message: "Year name is required" })
      .max(50, { message: "Year name cannot exceed 50 characters" }),
    strCountryGUID: z
      .string()
      .min(1, { message: "Country is required" })
      .max(50, { message: "Country cannot exceed 50 characters" }),
    strCurrencyGUID: z
      .string()
      .min(1, { message: "Currency is required" })
      .max(50, { message: "Currency cannot exceed 50 characters" }),
    // Tax configuration fields (optional)
    strTaxTypeGUID: z.string().optional(),
    strTaxRegNo: z
      .string()
      .max(50, {
        message: "Tax registration number cannot exceed 50 characters",
      })
      .optional(),
    strStateGUID: z.string().optional(),
    dtRegistrationDate: z
      .union([z.date(), z.string(), z.null(), z.undefined()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          return null;
        }
        try {
          return val instanceof Date ? val : new Date(val);
        } catch {
          return null;
        }
      }),
    bolIsDefaultTaxConfig: z.boolean().default(true).optional(),
    bolIsTaxApplied: z.boolean().default(false).optional(),
    jsonTaxSettings: z
      .string()
      .max(4000, { message: "Tax settings JSON cannot exceed 4000 characters" })
      .optional(),
    // India GST fields
    gstNumber: z.string().optional(),
    eInvoiceEnabled: z.boolean().default(false).optional(),
    compositionScheme: z.boolean().default(false).optional(),
    gstinVerificationRequired: z.boolean().default(true).optional(),
    printHSNCode: z.boolean().default(true).optional(),
    // UK VAT fields
    vatNumber: z.string().optional(),
    vatScheme: z
      .enum(["Standard", "FlatRate", "CashAccounting"])
      .default("Standard")
      .optional(),
    mtdEnabled: z.boolean().default(true).optional(),
    accountingBasis: z.enum(["Accrual", "Cash"]).default("Accrual").optional(),
    flatRatePercentage: z.number().nullable().optional(),
    // USA Sales Tax fields
    primaryState: z.string().optional(),
    taxLicenseNumber: z.string().optional(),
    nexusStates: z.array(z.string()).default([]).optional(),
    economicNexusEnabled: z.boolean().default(true).optional(),
    marketplaceFacilitator: z.boolean().default(false).optional(),
    showTaxBreakdownOnInvoice: z.boolean().default(true).optional(),
    // Admin user fields
    strAdminName: z.string().min(1, { message: "Admin name is required" }),
    strAdminMobileNo: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits." })
      .max(15, { message: "Phone number cannot exceed 15 digits." }),
    strAdminEmailId: z
      .string()
      .email({ message: "Please enter a valid email address" }),
    strAdminPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    strTimeZone: z
      .string()
      .min(1, { message: "Timezone is required" })
      .max(50, { message: "Timezone cannot exceed 50 characters" })
      .default("Asia/Kolkata"),
    strDesignationGUID: z.string().optional(),
    strDepartmentGUID: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        return data.dtStartDate < data.dtEndDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["dtEndDate"],
    }
  )
  .refine(
    (data) => {
      if (data.dtStartDate && data.dtEndDate) {
        const maxEndDate = computeMaxEndDateFromStart(data.dtStartDate);
        return data.dtEndDate <= maxEndDate;
      }
      return true;
    },
    {
      message:
        "End date cannot be more than 1 year minus 1 day after the start date",
      path: ["dtEndDate"],
    }
  );
