import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  scheduleSchema,
  type ScheduleFormValues,
} from "@/validations/central/schedule";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SingleSelect } from "@/components/ui/select/single-select";
import { ScheduleFormSkeleton } from "./ScheduleFormSkeleton";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { ArrowLeft, ListFilter, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useActiveSchedules,
} from "@/hooks/api/central/use-schedules";

import type { ScheduleCreate, ScheduleUpdate } from "@/types/central/schedule";
import { useMenuIcon } from "@/hooks";

const ScheduleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const [parentSearch, setParentSearch] = useState<string>("");
  const [isParentDropdownOpen, setIsParentDropdownOpen] =
    useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(
      scheduleSchema
    ) as unknown as Resolver<ScheduleFormValues>,
    defaultValues: {
      code: 0,
      strScheduleCode: "",
      strRefNo: "",
      strScheduleName: "",
      strTemplateName: "",
      strParentScheduleGUID: undefined,
      dblChartType: undefined,
      strDefaultAccountTypeGUID: undefined,
      bolIsActive: true,
      bolIsEditable: true,
    },
  });

  const { data: scheduleData, isLoading: isLoadingSchedule } = useSchedule(
    isEditMode ? id : undefined
  );

  const {
    data: activeSchedules,
    isLoading: isLoadingParentSchedules,
    refetch: refetchParentSchedules,
  } = useActiveSchedules(
    parentSearch.length >= 3 ? parentSearch : undefined,
    isParentDropdownOpen
  );

  const isLoading =
    (isEditMode && isLoadingSchedule) ||
    (isParentDropdownOpen && isLoadingParentSchedules);

  useEffect(() => {
    if (scheduleData && isEditMode) {
      form.reset({
        code: scheduleData.code,
        strScheduleCode: scheduleData.strScheduleCode,
        strRefNo: scheduleData.strRefNo || "",
        strScheduleName: scheduleData.strScheduleName,
        strTemplateName: scheduleData.strTemplateName || "",
        strParentScheduleGUID: scheduleData.strParentScheduleGUID || undefined,
        dblChartType: scheduleData.dblChartType || undefined,
        strDefaultAccountTypeGUID:
          scheduleData.strDefaultAccountTypeGUID || undefined,
        bolIsActive: scheduleData.bolIsActive,
        bolIsEditable: scheduleData.bolIsEditable,
      });
    }
  }, [scheduleData, form, isEditMode]);

  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule();

  const handleDelete = () => {
    if (!id) return;

    deleteSchedule(id, {
      onSuccess: () => {
        navigate("/schedule");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: ScheduleFormValues) => {
    const scheduleData: ScheduleCreate | ScheduleUpdate = {
      code: data.code || 0,
      strScheduleCode: data.strScheduleCode,
      strRefNo: data.strRefNo || undefined,
      strScheduleName: data.strScheduleName,
      strTemplateName: data.strTemplateName || undefined,
      strParentScheduleGUID: data.strParentScheduleGUID || undefined,
      dblChartType: data.dblChartType || undefined,
      strDefaultAccountTypeGUID: data.strDefaultAccountTypeGUID || undefined,
      bolIsActive: data.bolIsActive,
      bolIsEditable: data.bolIsEditable,
    };

    if (isEditMode && id) {
      updateSchedule(
        { id, data: scheduleData },
        {
          onSuccess: () => {
            navigate("/schedule");
          },
        }
      );
    } else {
      createSchedule(scheduleData, {
        onSuccess: () => {
          navigate("/schedule");
        },
      });
    }
  };

  const buildParentScheduleOptions = () => {
    const options = (activeSchedules || []).map((schedule) => ({
      value: schedule.strScheduleGUID,
      label:
        schedule.strScheduleInfo ||
        `${schedule.strScheduleCode} - ${schedule.strScheduleName}`,
    }));

    if (
      isEditMode &&
      scheduleData?.strParentScheduleGUID &&
      scheduleData?.strParentScheduleName &&
      !options.some((opt) => opt.value === scheduleData.strParentScheduleGUID)
    ) {
      options.push({
        value: scheduleData.strParentScheduleGUID,
        label: `${scheduleData.strUnderCode || ""} - ${
          scheduleData.strParentScheduleName
        }`,
      });
    }

    return options;
  };

  const HeaderIcon = useMenuIcon("schedule_form", ListFilter);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Schedule" : "New Schedule"}
        description={
          isEditMode ? "Update schedule details" : "Create a new schedule"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/schedule")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading && !isParentDropdownOpen ? (
        <ScheduleFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="scheduleForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strScheduleCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter schedule code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strScheduleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter schedule name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strRefNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference No.</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter reference number"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strParentScheduleGUID"
                    render={({ field }) => {
                      const parentScheduleOptions =
                        buildParentScheduleOptions();

                      return (
                        <FormItem>
                          <FormLabel>Parent Schedule</FormLabel>
                          <FormControl>
                            <SingleSelect
                              options={parentScheduleOptions}
                              selectedValue={field.value || undefined}
                              onChange={(val) => {
                                field.onChange(val === "" ? undefined : val);
                              }}
                              onInputChange={(value) => {
                                setParentSearch(value || "");
                              }}
                              placeholder="Select a parent schedule"
                              isLoading={isLoadingParentSchedules}
                              searchMinLength={3}
                              allowNone={true}
                              noneLabel="None"
                              onOpenChange={setIsParentDropdownOpen}
                              onRefresh={refetchParentSchedules}
                              refreshLabel="Refresh Schedules"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="strTemplateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter template name"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dblChartType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chart Type</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            placeholder="Enter chart type"
                            value={
                              field.value === undefined || field.value === null
                                ? ""
                                : field.value
                            }
                            onChange={(e) => {
                              const value = e.target.value
                                ? parseFloat(e.target.value)
                                : undefined;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Active
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isCreating || isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsEditable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Editable
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isCreating || isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isCreating || isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isCreating || isUpdating}
                    className="min-w-30"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isCreating || isUpdating
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => setShowDeleteConfirm(open)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default ScheduleForm;
