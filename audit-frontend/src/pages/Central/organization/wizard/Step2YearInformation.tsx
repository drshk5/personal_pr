import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Info } from "lucide-react";

import type { OrganizationFormValues } from "@/validations/central/organization";

import { generateYearName } from "@/lib/utils";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

interface Step2YearInformationProps {
  form: UseFormReturn<OrganizationFormValues>;
  isSaving: boolean;
  isEditMode: boolean;
}

export const Step2YearInformation: React.FC<Step2YearInformationProps> = ({
  form,
  isSaving,
  isEditMode,
}) => {
  const startDate = form.watch("dtStartDate");
  const endDate = form.watch("dtEndDate");

  useEffect(() => {
    if (startDate && !isEditMode) {
      const oneYearLater = new Date(startDate);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      oneYearLater.setDate(oneYearLater.getDate() - 1);
      form.setValue("dtEndDate", oneYearLater);
    }
  }, [startDate, isEditMode, form]);

  useEffect(() => {
    if (startDate && endDate) {
      const year = generateYearName(startDate, endDate);
      form.setValue("strYearName", year || "");
    }
  }, [startDate, endDate, form]);

  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-hidden bg-card">
      <CardContent className="p-6 sm:p-8 pb-4 sm:pb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Year Information
          </h2>
          <p className="text-muted-foreground">
            Define the financial year for your organization
          </p>
        </div>

        {isEditMode && (
          <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-1 shrink-0" />
              <div className="text-blue-800 text-sm">
                Year information is not editable for existing organizations.
                Please contact your administrator if you need to change these
                dates.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="dtStartDate"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-medium">
                  Start Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={field.onChange}
                    disabled={isSaving || isEditMode}
                    placeholder="Select start date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dtEndDate"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="font-medium">
                  End Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={field.onChange}
                    disabled={isSaving || isEditMode}
                    placeholder="Select end date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 mt-6">
          <FormField
            control={form.control}
            name="strYearName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Year Name{" "}
                  <span className="text-gray-400">(Auto-generated)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Select start and end dates first"
                    {...field}
                    value={field.value || ""}
                    disabled={true}
                    className="bg-muted"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-2">
                  This field is automatically populated based on your selected
                  dates.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
