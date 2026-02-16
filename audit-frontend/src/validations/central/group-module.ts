import { z } from "zod";

export const groupModuleFormSchema = z.object({
  strModuleGUID: z
    .string({
      required_error: "Please select a module",
    })
    .min(1, { message: "Please select a module" }),
  intVersion: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({
        required_error: "Version is required",
        invalid_type_error: "Version must be a number",
      })
      .min(1, { message: "Version must be at least 1" })
  ),
});

export type GroupModuleFormValues = z.infer<typeof groupModuleFormSchema>;