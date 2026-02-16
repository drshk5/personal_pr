import { z } from "zod";

/**
 * Validation schema for user details (team members) form
 */
export const userDetailsSchema = z.object({
  strUserGUID: z.string().min(1, { message: "User is required" }),
  strUserRoleGUID: z.string().min(1, { message: "Role is required" }),
  strOrganizationGUID: z
    .string()
    .min(1, { message: "Organization is required" }),
  strYearGUID: z.string().min(1, { message: "Year is required" }),
  bolIsActive: z.boolean().default(true).optional(),
});

/**
 * Type definition for the form values
 */
export type UserDetailsFormValues = z.infer<typeof userDetailsSchema>;
