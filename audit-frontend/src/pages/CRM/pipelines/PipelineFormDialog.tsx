import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GripVertical,
  Plus,
  Trash2,
  Star,
  X,
  AlertCircle,
} from "lucide-react";

import type { PipelineListDto, CreatePipelineDto } from "@/types/CRM/pipeline";
import {
  pipelineSchema,
  type PipelineFormValues,
} from "@/validations/CRM/pipeline";
import {
  useCreatePipeline,
  useUpdatePipeline,
  usePipeline,
} from "@/hooks/api/CRM/use-pipelines";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PipelineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: PipelineListDto | null;
}

export const PipelineFormDialog: React.FC<PipelineFormDialogProps> = ({
  open,
  onOpenChange,
  pipeline,
}) => {
  const isEditMode = !!pipeline;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: pipelineDetail, isLoading: isLoadingDetail } = usePipeline(
    pipeline?.strPipelineGUID
  );
  const { mutate: createPipeline, isPending: isCreating } = useCreatePipeline();
  const { mutate: updatePipeline, isPending: isUpdating } = useUpdatePipeline();

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      strPipelineName: "",
      strDescription: "",
      bolIsDefault: false,
      Stages: [
        {
          strStageName: "Qualification",
          intDisplayOrder: 1,
          intProbabilityPercent: 20,
          intDefaultDaysToRot: 30,
          bolIsWonStage: false,
          bolIsLostStage: false,
        },
        {
          strStageName: "Proposal",
          intDisplayOrder: 2,
          intProbabilityPercent: 50,
          intDefaultDaysToRot: 30,
          bolIsWonStage: false,
          bolIsLostStage: false,
        },
        {
          strStageName: "Negotiation",
          intDisplayOrder: 3,
          intProbabilityPercent: 75,
          intDefaultDaysToRot: 30,
          bolIsWonStage: false,
          bolIsLostStage: false,
        },
        {
          strStageName: "Won",
          intDisplayOrder: 4,
          intProbabilityPercent: 100,
          intDefaultDaysToRot: 0,
          bolIsWonStage: true,
          bolIsLostStage: false,
        },
        {
          strStageName: "Lost",
          intDisplayOrder: 5,
          intProbabilityPercent: 0,
          intDefaultDaysToRot: 0,
          bolIsWonStage: false,
          bolIsLostStage: true,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "Stages",
  });

  useEffect(() => {
    if (isEditMode && pipelineDetail) {
      form.reset({
        strPipelineName: pipelineDetail.strPipelineName,
        strDescription: pipelineDetail.strDescription || "",
        bolIsDefault: pipelineDetail.bolIsDefault,
        Stages: pipelineDetail.Stages.sort((a, b) => a.intDisplayOrder - b.intDisplayOrder),
      });
    } else if (!isEditMode) {
      form.reset({
        strPipelineName: "",
        strDescription: "",
        bolIsDefault: false,
        Stages: [
          {
            strStageName: "Qualification",
            intDisplayOrder: 1,
            intProbabilityPercent: 20,
            intDefaultDaysToRot: 30,
            bolIsWonStage: false,
            bolIsLostStage: false,
          },
          {
            strStageName: "Proposal",
            intDisplayOrder: 2,
            intProbabilityPercent: 50,
            intDefaultDaysToRot: 30,
            bolIsWonStage: false,
            bolIsLostStage: false,
          },
          {
            strStageName: "Negotiation",
            intDisplayOrder: 3,
            intProbabilityPercent: 75,
            intDefaultDaysToRot: 30,
            bolIsWonStage: false,
            bolIsLostStage: false,
          },
          {
            strStageName: "Won",
            intDisplayOrder: 4,
            intProbabilityPercent: 100,
            intDefaultDaysToRot: 0,
            bolIsWonStage: true,
            bolIsLostStage: false,
          },
          {
            strStageName: "Lost",
            intDisplayOrder: 5,
            intProbabilityPercent: 0,
            intDefaultDaysToRot: 0,
            bolIsWonStage: false,
            bolIsLostStage: true,
          },
        ],
      });
    }
  }, [isEditMode, pipelineDetail, form, open]);

  const onSubmit = (data: PipelineFormValues) => {
    // Update display orders based on array position
    const stagesWithOrder = data.Stages.map((stage, index) => ({
      ...stage,
      intDisplayOrder: index + 1,
    }));

    const payload: CreatePipelineDto = {
      strPipelineName: data.strPipelineName,
      strDescription: data.strDescription || null,
      bolIsDefault: data.bolIsDefault,
      Stages: stagesWithOrder,
    };

    if (isEditMode && pipeline) {
      updatePipeline(
        { id: pipeline.strPipelineGUID, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createPipeline(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const addStage = () => {
    const newOrder = fields.length + 1;
    append({
      strStageName: "",
      intDisplayOrder: newOrder,
      intProbabilityPercent: 50,
      intDefaultDaysToRot: 30,
      bolIsWonStage: false,
      bolIsLostStage: false,
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      move(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isPending = isCreating || isUpdating;
  const wonStagesCount = fields.filter((_, index) =>
    form.watch(`Stages.${index}.bolIsWonStage`)
  ).length;
  const lostStagesCount = fields.filter((_, index) =>
    form.watch(`Stages.${index}.bolIsLostStage`)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Pipeline" : "Create Pipeline"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the pipeline configuration and stages"
              : "Create a new sales pipeline with custom stages"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingDetail ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Pipeline Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="strPipelineName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sales Pipeline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this pipeline..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bolIsDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as default pipeline</FormLabel>
                        <FormDescription>
                          New opportunities will use this pipeline by default
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Stages Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Pipeline Stages</h3>
                    <p className="text-sm text-muted-foreground">
                      Define the stages in your pipeline. Drag to reorder.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStage}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stage
                  </Button>
                </div>

                {(wonStagesCount !== 1 || lostStagesCount !== 1) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pipeline must have exactly one "Won" stage and one "Lost" stage.
                      {wonStagesCount !== 1 && ` Currently ${wonStagesCount} Won stages.`}
                      {lostStagesCount !== 1 && ` Currently ${lostStagesCount} Lost stages.`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <Card
                      key={field.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`p-4 ${
                        draggedIndex === index ? "opacity-50" : ""
                      } cursor-move`}
                    >
                      <div className="flex gap-3">
                        <div className="flex items-start pt-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 grid gap-4 md:grid-cols-6">
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`Stages.${index}.strStageName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Stage Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Qualification" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormField
                              control={form.control}
                              name={`Stages.${index}.intProbabilityPercent`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Probability %</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormField
                              control={form.control}
                              name={`Stages.${index}.intDefaultDaysToRot`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Days to Rot</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2 flex items-end gap-2 pb-2">
                            <FormField
                              control={form.control}
                              name={`Stages.${index}.bolIsWonStage`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (checked) {
                                          form.setValue(`Stages.${index}.bolIsLostStage`, false);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">Won</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`Stages.${index}.bolIsLostStage`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        if (checked) {
                                          form.setValue(`Stages.${index}.bolIsWonStage`, false);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">Lost</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex items-start pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <FormMessage>
                  {form.formState.errors.Stages?.message}
                </FormMessage>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Pipeline"
                    : "Create Pipeline"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
