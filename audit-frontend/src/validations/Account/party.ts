import { z } from "zod";

export const partySchema = z.object({
  strPartyType: z.string().min(1, "Party type is required").max(50),
  strSalutation: z.string().max(10).optional().nullable(),
  strFirstName: z
    .string({
      required_error: "First name is required",
    })
    .min(1, "First name is required")
    .max(100),
  strLastName: z.string().max(100).optional().nullable(),
  strCompanyName: z.string().min(1, "Company name is required").max(200),
  strPartyName_Display: z.string().max(100).optional().nullable(),
  strUDFCode: z
    .string({
      required_error: "UDF Code is required",
    })
    .regex(/^[A-Za-z0-9]{6}$/, {
      message: "Account Code must be exactly 6 alphanumeric characters",
    }),
  strEmail: z
    .string()
    .email("Invalid email address")
    .max(100)
    .optional()
    .nullable(),
  strPhoneNoWork: z.string().max(20).optional().nullable(),
  strPhoneNoPersonal: z.string().max(20).optional().nullable(),
  strPAN: z.string().max(20).optional().nullable(),
  strCurrencyTypeGUID: z.string().uuid().optional().nullable(),
  intPaymentTerms_inDays: z.coerce.number().int().optional().nullable(),
  strPartyLanguage: z.string().max(20).optional().nullable(),
  strTaxRegNo: z.string().max(50).optional().nullable(),
  strWebsiteURL: z.string().max(200).optional().nullable(),
  strDepartment: z.string().max(100).optional().nullable(),
  strDesignation: z.string().max(100).optional().nullable(),
  strTwitter: z.string().max(100).optional().nullable(),
  strSkype: z.string().max(100).optional().nullable(),
  strFacebook: z.string().max(100).optional().nullable(),
  strInstagram: z.string().max(100).optional().nullable(),
  dblIntrest_per: z.coerce.number().optional().nullable(),
  strRemarks: z.string().max(500).optional().nullable(),

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

export type PartyFormValues = z.infer<typeof partySchema>;
