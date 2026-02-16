import { z } from "zod";

// Party Contact schema for form validation matching backend validation
export const partyContactSchema = z.object({
  strPartyGUID: z.string().uuid({ message: "Valid Party GUID is required" }),
  strSalutation: z.string().min(1, "Salutation is required").max(10),
  strFirstName: z.string().min(1, "First name is required").max(100),
  strLastName: z.string().min(1, "Last name is required").max(100),
  strEmail: z.string().max(100).optional().nullable(),
  strPhoneNo_Work: z.string().max(20).optional().nullable(),
  strPhoneNo: z.string().max(20).optional().nullable(),
  strSkype: z.string().max(100).optional().nullable(),
  strDesignation: z.string().max(100).optional().nullable(),
  strDepartment: z.string().max(100).optional().nullable(),
  strTwitter: z.string().max(100).optional().nullable(),
  strFacebook: z.string().max(100).optional().nullable(),
  strInstagram: z.string().max(100).optional().nullable(),
});

export type PartyContactFormValues = z.infer<typeof partyContactSchema>;
