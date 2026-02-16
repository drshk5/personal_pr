import { z } from "zod";

// ── Pipeline Stage Schema ────────────────────────────────────────

export const pipelineStageSchema = z.object({
  strStageName: z
    .string()
    .min(1, { message: "Stage name is required" })
    .max(100, { message: "Stage name cannot exceed 100 characters" }),
  intDisplayOrder: z
    .number()
    .int()
    .min(1, { message: "Display order must be at least 1" }),
  intProbabilityPercent: z
    .number()
    .int()
    .min(0, { message: "Probability must be at least 0%" })
    .max(100, { message: "Probability cannot exceed 100%" }),
  intDefaultDaysToRot: z
    .number()
    .int()
    .min(0, { message: "Days to rot must be at least 0" })
    .default(30),
  bolIsWonStage: z.boolean().default(false),
  bolIsLostStage: z.boolean().default(false),
});

export type PipelineStageFormValues = z.infer<typeof pipelineStageSchema>;

// ── Pipeline Create/Edit Form ────────────────────────────────────

export const pipelineSchema = z
  .object({
    strPipelineName: z
      .string()
      .min(1, { message: "Pipeline name is required" })
      .max(200, { message: "Pipeline name cannot exceed 200 characters" }),
    strDescription: z
      .string()
      .max(2000, { message: "Description cannot exceed 2000 characters" })
      .nullable()
      .optional(),
    bolIsDefault: z.boolean().default(false),
    Stages: z
      .array(pipelineStageSchema)
      .min(2, { message: "Pipeline must have at least 2 stages" }),
  })
  .refine(
    (data) => {
      // Check for exactly one Won stage
      const wonStages = data.Stages.filter((s) => s.bolIsWonStage);
      return wonStages.length === 1;
    },
    {
      message: "Pipeline must have exactly one Won stage",
      path: ["Stages"],
    }
  )
  .refine(
    (data) => {
      // Check for exactly one Lost stage
      const lostStages = data.Stages.filter((s) => s.bolIsLostStage);
      return lostStages.length === 1;
    },
    {
      message: "Pipeline must have exactly one Lost stage",
      path: ["Stages"],
    }
  )
  .refine(
    (data) => {
      // Check for no duplicate stage names
      const stageNames = data.Stages.map((s) => s.strStageName.trim().toLowerCase());
      return stageNames.length === new Set(stageNames).size;
    },
    {
      message: "Pipeline cannot have duplicate stage names",
      path: ["Stages"],
    }
  )
  .refine(
    (data) => {
      // Won stage must have 100% probability
      const wonStage = data.Stages.find((s) => s.bolIsWonStage);
      return !wonStage || wonStage.intProbabilityPercent === 100;
    },
    {
      message: "Won stage must have 100% probability",
      path: ["Stages"],
    }
  )
  .refine(
    (data) => {
      // Lost stage must have 0% probability
      const lostStage = data.Stages.find((s) => s.bolIsLostStage);
      return !lostStage || lostStage.intProbabilityPercent === 0;
    },
    {
      message: "Lost stage must have 0% probability",
      path: ["Stages"],
    }
  );

export type PipelineFormValues = z.infer<typeof pipelineSchema>;
