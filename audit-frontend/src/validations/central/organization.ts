import { z } from "zod";

// Organization schema for form validation
export const organizationSchema = z
  .object({
    strOrganizationName: z
      .string()
      .min(1, { message: "Organization name is required" })
      .max(100, { message: "Organization name cannot exceed 100 characters" }),
    strDescription: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .nullable()
      .optional(),
    strPAN: z
      .string()
      .max(20, { message: "PAN cannot exceed 20 characters" })
      .nullable()
      .optional(),
    strTAN: z
      .string()
      .max(20, { message: "TAN cannot exceed 20 characters" })
      .nullable()
      .optional(),
    strCIN: z
      .string()
      .max(21, { message: "CIN cannot exceed 21 characters" })
      .nullable()
      .optional(),
    strParentOrganizationGUID: z.string().nullable().optional(),
    bolIsActive: z.boolean().default(true).optional(),
    bolIsTaxApplied: z.boolean().default(false).optional(),
    strIndustryGUID: z
      .string()
      .min(1, { message: "Industry is required" })
      .max(50, { message: "Industry cannot exceed 50 characters" }),

    strUDFCode: z
      .string()
      .min(1, { message: "Organization code is required" })
      .max(50, { message: "Organization code cannot exceed 50 characters" }),

    strLegalStatusTypeGUID: z
      .string()
      .min(1, { message: "Legal status is required" })
      .max(50, { message: "Legal status cannot exceed 50 characters" }),

    strCurrencyTypeGUID: z
      .string()
      .min(1, { message: "Currency type is required" })
      .max(50, { message: "Currency type cannot exceed 50 characters" }),

    dtClientAcquiredDate: z
      .union([z.date(), z.string(), z.null()])
      .nullable()
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined) return null;
        return val;
      })
      .refine((val) => val !== undefined, "Invalid date"),

    // Logo path - this will be set by the server
    strLogo: z.string().nullable().optional(),

    // Tax Configuration fields (optional)
    strCountryGUID: z
      .string()
      .max(50, { message: "Country cannot exceed 50 characters" })
      .nullable()
      .optional(),
    strTaxTypeGUID: z.string().nullable().optional(),
    strTaxRegNo: z
      .string()
      .max(50, {
        message: "Tax registration number cannot exceed 50 characters",
      })
      .nullable()
      .optional(),
    strStateGUID: z.string().nullable().optional(),
    dtRegistrationDate: z
      .union([z.date(), z.string(), z.null()])
      .nullable()
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined) return null;
        return val;
      })
      .refine((val) => val !== undefined, "Invalid date"),
    jsonTaxSettings: z
      .string()
      .max(4000, { message: "Tax settings cannot exceed 4000 characters" })
      .nullable()
      .optional(),

    // India GST specific fields
    gstNumber: z.string().optional(),
    eInvoiceEnabled: z.boolean().optional(),
    compositionScheme: z.boolean().optional(),
    gstinVerificationRequired: z.boolean().optional(),
    printHSNCode: z.boolean().optional(),

    // UK VAT specific fields
    vatNumber: z.string().optional(),
    vatScheme: z.enum(["Standard", "FlatRate", "CashAccounting"]).optional(),
    mtdEnabled: z.boolean().optional(),
    accountingBasis: z.enum(["Accrual", "Cash"]).optional(),
    flatRatePercentage: z.number().nullable().optional(),

    // USA Sales Tax specific fields
    primaryState: z.string().optional(),
    taxLicenseNumber: z.string().optional(),
    nexusStates: z.array(z.string()).optional(),
    economicNexusEnabled: z.boolean().optional(),
    marketplaceFacilitator: z.boolean().optional(),
    showTaxBreakdownOnInvoice: z.boolean().optional(),

    // Year creation fields for newly created organization
    dtStartDate: z.union([z.date(), z.string()]).nullable().optional(),
    dtEndDate: z.union([z.date(), z.string()]).nullable().optional(),
    strYearName: z
      .string()
      .max(100, { message: "Year name cannot exceed 100 characters" })
      .nullable()
      .optional(),
    strPreviousYearGUID: z.string().nullable().optional(),
    strNextYearGUID: z.string().nullable().optional(),

    // Billing address fields
    strAttention_billing: z
      .string()
      .max(150, { message: "Billing attention cannot exceed 150 characters" })
      .nullable()
      .optional(),
    strCountryGUID_billing: z.string().nullable().optional(),
    strAddress_billing: z
      .string()
      .max(500, { message: "Billing address cannot exceed 500 characters" })
      .nullable()
      .optional(),
    strStateGUID_billing: z.string().nullable().optional(),
    strCityGUID_billing: z.string().nullable().optional(),
    strPinCode_billing: z
      .string()
      .max(20, { message: "Billing pin code cannot exceed 20 characters" })
      .nullable()
      .optional(),
    strPhone_billing: z
      .string()
      .max(30, { message: "Billing phone cannot exceed 30 characters" })
      .nullable()
      .optional(),
    strFaxNumber_billing: z
      .string()
      .max(30, { message: "Billing fax number cannot exceed 30 characters" })
      .nullable()
      .optional(),

    // Shipping address fields
    strAttention_shipping: z
      .string()
      .max(150, { message: "Shipping attention cannot exceed 150 characters" })
      .nullable()
      .optional(),
    strCountryGUID_shipping: z.string().nullable().optional(),
    strAddress_shipping: z
      .string()
      .max(500, { message: "Shipping address cannot exceed 500 characters" })
      .nullable()
      .optional(),
    strStateGUID_shipping: z.string().nullable().optional(),
    strCityGUID_shipping: z.string().nullable().optional(),
    strPinCode_shipping: z
      .string()
      .max(20, { message: "Shipping pin code cannot exceed 20 characters" })
      .nullable()
      .optional(),
    strPhone_shipping: z
      .string()
      .max(30, { message: "Shipping phone cannot exceed 30 characters" })
      .nullable()
      .optional(),
    strFaxNumber_shipping: z
      .string()
      .max(30, { message: "Shipping fax number cannot exceed 30 characters" })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.bolIsTaxApplied === false) return;

    const isEmpty = (val: unknown) => !val || `${val}`.trim().length === 0;

    if (isEmpty(data.strCountryGUID)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required when tax configuration is enabled",
        path: ["strCountryGUID"],
      });
    }

    if (isEmpty(data.strStateGUID)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required when tax configuration is enabled",
        path: ["strStateGUID"],
      });
    }

    if (isEmpty(data.strTaxRegNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tax registration number is required when tax configuration is enabled",
        path: ["strTaxRegNo"],
      });
    }
  })
  .refine(
    (data) => {
      if (!data.dtStartDate || !data.dtEndDate) return true;

      const startDate = new Date(data.dtStartDate);
      const endDate = new Date(data.dtEndDate);

      const oneYearLater = new Date(startDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      oneYearLater.setDate(oneYearLater.getDate() - 1);

      return endDate.getTime() === oneYearLater.getTime();
    },
    {
      message: "End date must be start date + 1 year - 1 day",
      path: ["dtEndDate"],
    }
  );

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

export const exchangeRateParamsSchema = z.object({
  strFromCurrencyGUID: z.string().uuid("Invalid currency GUID format"),
});

export type ExchangeRateParamsInput = z.infer<typeof exchangeRateParamsSchema>;
