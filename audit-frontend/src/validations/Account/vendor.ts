import { z } from "zod";

export const vendorSchema = z.object({
  strPartyType: z.string().default("Vendor"),
  strSalutation: z.string().optional().nullable(),
  strFirstName: z
    .string({
      required_error: "First name is required",
    })
    .min(1, "First name is required"),
  strLastName: z
    .string()
    .max(100, "Last name must be less than 100 characters")
    .optional()
    .nullable(),
  strCompanyName: z
    .string()
    .max(200, "Company name must be less than 200 characters")
    .optional()
    .nullable(),
  strPartyName_Display: z
    .string({
      required_error: "Display name is required",
    })
    .min(1, "Display name is required"),
  strUDFCode: z.string().regex(/^[A-Za-z0-9]{6}$/, {
    message: "UDF Code must be exactly 6 alphanumeric characters",
  }),
  strEmail: z.string().email("Invalid email address").optional().nullable(),
  strPhoneNoWork: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .nullable(),
  strPhoneNoPersonal: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .nullable(),
  strPAN: z
    .string()
    .max(20, "PAN must be less than 20 characters")
    .optional()
    .nullable(),
  strCurrencyTypeGUID: z
    .string({
      required_error: "Currency is required",
    })
    .min(1, "Currency is required"),
  intPaymentTerms_inDays: z.coerce.number().int().optional().nullable(),
  strPartyLanguage: z
    .string()
    .max(20, "Language must be less than 20 characters")
    .optional()
    .nullable(),
  strTaxRegNo: z
    .string()
    .max(100, "Tax registration number must be less than 100 characters")
    .optional()
    .nullable(),
  strWebsiteURL: z
    .string()
    .max(200, "Website URL must be less than 200 characters")
    .optional()
    .nullable(),
  strDepartment: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .nullable(),
  strDesignation: z
    .string()
    .max(100, "Designation must be less than 100 characters")
    .optional()
    .nullable(),
  strTwitter: z
    .string()
    .max(100, "Twitter handle must be less than 100 characters")
    .optional()
    .nullable(),
  strSkype: z
    .string()
    .max(100, "Skype ID must be less than 100 characters")
    .optional()
    .nullable(),
  strFacebook: z
    .string()
    .max(100, "Facebook profile must be less than 100 characters")
    .optional()
    .nullable(),
  strInstagram: z
    .string()
    .max(100, "Instagram handle must be less than 100 characters")
    .optional()
    .nullable(),
  dblIntrest_per: z.coerce.number().optional().nullable(),
  strRemarks: z
    .string()
    .max(500, "Remarks must be less than 500 characters")
    .optional()
    .nullable(),

  // Billing address fields
  strAttention_billing: z.string().max(150).optional().nullable(),
  strCountryGUID_billing: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strAddress_billing: z.string().max(500).optional().nullable(),
  strStateGUID_billing: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strCityGUID_billing: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strPinCode_billing: z.string().max(20).optional().nullable(),
  strPhone_billing: z.string().max(30).optional().nullable(),
  strFaxNumber_billing: z.string().max(30).optional().nullable(),

  // Shipping address fields
  strAttention_shipping: z.string().max(150).optional().nullable(),
  strCountryGUID_shipping: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strAddress_shipping: z.string().max(500).optional().nullable(),
  strStateGUID_shipping: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strCityGUID_shipping: z
    .string()
    .uuid()
    .or(z.literal(""))
    .optional()
    .nullable(),
  strPinCode_shipping: z.string().max(20).optional().nullable(),
  strPhone_shipping: z.string().max(30).optional().nullable(),
  strFaxNumber_shipping: z.string().max(30).optional().nullable(),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
