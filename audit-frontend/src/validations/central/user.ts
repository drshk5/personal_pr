import { z } from "zod";

// Base schema shared between create and edit; fields that differ are overridden per mode
const baseUserSchema = z.object({
  strName: z.string().min(1, "Name is required"),
  strEmailId: z.string().email("Invalid email address"),
  strMobileNo: z.string().min(1, "Mobile number is required"),
  strPassword: z.string().optional(),
  dtBirthDate: z.union([z.date(), z.null()]),
  bolIsActive: z.boolean(),
  dtWorkingStartTime: z.string().min(1, "Start time is required"),
  dtWorkingEndTime: z.string().min(1, "End time is required"),
  strRoleGUID: z.string().optional(),
  strDesignationGUID: z.string().min(1, "Designation is required"),
  strDepartmentGUID: z.string().min(1, "Department is required"),
  RemoveProfileImage: z.boolean().optional(),
  strProfileImg: z.string().optional(),
  strTimeZone: z.string().min(1, "Timezone is required"),
});

// Create: enforce role + password
export const userCreateSchema = baseUserSchema.extend({
  strRoleGUID: z.string().min(1, "User role is required"),
  strPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Backward compatibility: keep the original export name mapped to create schema
export const userSchema = userCreateSchema;

// Edit: allow empty role/password, but validate password length if provided
export const userEditSchema = baseUserSchema
  .extend({
    strRoleGUID: z.string().optional(),
    strPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.strPassword &&
      data.strPassword.length > 0 &&
      data.strPassword.length < 6
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Password must be at least 6 characters",
        path: ["strPassword"],
      });
    }
  });

export const profileFormSchema = z.object({
  strName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name cannot exceed 100 characters." }),

  strEmailId: z
    .string()
    .email({ message: "Please enter a valid email address." }),

  strMobileNo: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." })
    .max(15, { message: "Phone number cannot exceed 15 digits." })
    .optional()
    .or(z.literal("")),

  bolIsActive: z.boolean(),

  strProfileImg: z.string().optional(),

  strTimeZone: z.string().min(1, "Timezone is required"),
});

export type UserFormValues = z.infer<typeof userEditSchema>;
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
